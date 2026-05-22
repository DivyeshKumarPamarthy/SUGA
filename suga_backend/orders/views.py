"""
orders/views.py
Order placement (customer), order listing (role-aware), status management (vendor).
"""
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Order, OrderItem, Appointment
from .serializers import (
    OrderCreateSerializer,
    OrderListSerializer,
    OrderStatusUpdateSerializer,
    AppointmentSerializer,
    AppointmentCreateSerializer,
)
from accounts.models import Notification


class PlaceOrderView(generics.CreateAPIView):
    """POST /api/orders/ — customer places an order."""
    serializer_class = OrderCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        
        # Trigger notifications for all vendors involved in this order
        vendors = set(item.vendor for item in order.items.all() if item.vendor)
        for vendor in vendors:
            Notification.objects.create(
                user=vendor,
                title="New Order Received",
                message=f"New custom order {order.order_number} has been placed. Please review and confirm your items."
            )

        return Response(
            OrderListSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )


class OrderListView(generics.ListAPIView):
    """
    GET /api/orders/ — role-aware order list.
    - Customer: sees their orders
    - Vendor: sees orders containing their products
    - Admin: sees all orders
    """
    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'admin':
            return Order.objects.all()

        if user.role == 'vendor':
            # Orders that contain items belonging to this vendor
            order_ids = OrderItem.objects.filter(vendor=user).values_list('order_id', flat=True)
            return Order.objects.filter(id__in=order_ids)

        # Customer
        return Order.objects.filter(customer=user)


class OrderDetailView(generics.RetrieveAPIView):
    """GET /api/orders/{order_number}/ — single order detail."""
    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'order_number'

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Order.objects.all()
        if user.role == 'vendor':
            order_ids = OrderItem.objects.filter(vendor=user).values_list('order_id', flat=True)
            return Order.objects.filter(id__in=order_ids)
        return Order.objects.filter(customer=user)


class UpdateOrderItemStatusView(APIView):
    """PATCH /api/orders/items/{item_id}/status/ — vendor accepts/rejects an item."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, item_id):
        try:
            item = OrderItem.objects.get(id=item_id, vendor=request.user)
        except OrderItem.DoesNotExist:
            return Response({'error': 'Order item not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from django.db.models import F
        
        old_status = item.item_status
        new_status = serializer.validated_data['item_status']

        item.item_status = new_status
        item.save()

        if new_status == 'delivered' and old_status != 'delivered':
            product = item.product
            if product:
                product.total_sold = F('total_sold') + item.quantity
                product.save()

        # If all items in the order are accepted, update order status
        order = item.order
        all_items = order.items.all()
        if all(i.item_status == 'accepted' for i in all_items):
            order.status = 'confirmed'
            order.save()
        elif any(i.item_status == 'rejected' for i in all_items):
            # Check if ALL are rejected
            if all(i.item_status == 'rejected' for i in all_items):
                order.status = 'cancelled'
                order.save()

        # Trigger notification to customer
        shop_name = request.user.vendor_profile.shop_name if hasattr(request.user, 'vendor_profile') else request.user.username
        Notification.objects.create(
            user=order.customer,
            title=f"Order Item Update: {item.item_status.capitalize()}",
            message=f"Artisan '{shop_name}' has {item.item_status} the item '{item.product.title}' in your order {order.order_number}."
        )

        return Response({
            'message': f'Item status updated to {item.item_status}.',
            'item_id': item.id,
            'item_status': item.item_status,
            'order_status': order.status,
        })


class AppointmentListView(generics.ListAPIView):
    """GET /api/orders/appointments/ — role-aware list of appointments."""
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Appointment.objects.all()
        if user.role == 'vendor':
            return Appointment.objects.filter(vendor=user)
        return Appointment.objects.filter(customer=user)


class BookAppointmentView(generics.CreateAPIView):
    """POST /api/orders/appointments/book/ — customer books an appointment."""
    serializer_class = AppointmentCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        appointment = serializer.save(customer=self.request.user, status='pending')
        
        # Notify vendor
        customer_name = self.request.user.get_full_name() or self.request.user.username
        product_title = appointment.order_item.product.title if appointment.order_item and appointment.order_item.product else "custom item"
        Notification.objects.create(
            user=appointment.vendor,
            title="Sizing Call Appointment Request",
            message=f"Customer {customer_name} has requested a virtual sizing call for '{product_title}' on {appointment.date} at {appointment.time_slot}."
        )


class UpdateAppointmentStatusView(APIView):
    """PATCH /api/orders/appointments/<int:pk>/status/ — update appointment."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            appointment = Appointment.objects.get(id=pk)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user != appointment.vendor and request.user != appointment.customer and request.user.role != 'admin':
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        old_status = appointment.status
        old_date = appointment.date
        old_time_slot = appointment.time_slot
        old_meeting_link = appointment.meeting_link

        status_value = request.data.get('status')
        meeting_link = request.data.get('meeting_link')
        time_slot = request.data.get('time_slot')
        date = request.data.get('date')
        notes = request.data.get('notes')

        if status_value:
            if status_value not in Appointment.Status.values:
                return Response({'error': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)
            appointment.status = status_value
        
        if meeting_link is not None:
            appointment.meeting_link = meeting_link
        if time_slot:
            appointment.time_slot = time_slot
        if date:
            appointment.date = date
        if notes is not None:
            appointment.notes = notes

        appointment.save()

        # Trigger notification
        # If vendor updated it, notify customer. If customer updated it, notify vendor.
        recipient = appointment.customer if request.user == appointment.vendor else appointment.vendor
        sender_name = request.user.get_full_name() or request.user.username
        
        # Construct details of change
        changes = []
        if status_value and status_value != old_status:
            changes.append(f"status updated to '{status_value}'")
        if date and date != old_date:
            changes.append(f"date changed to {date}")
        if time_slot and time_slot != old_time_slot:
            changes.append(f"time slot changed to {time_slot}")
        if meeting_link is not None and meeting_link != old_meeting_link:
            changes.append(f"meeting link updated")

        if changes:
            change_desc = ", ".join(changes)
            product_title = appointment.order_item.product.title if appointment.order_item and appointment.order_item.product else "sizing call"
            Notification.objects.create(
                user=recipient,
                title="Sizing Call Appointment Update",
                message=f"Your appointment for '{product_title}' has been updated by {sender_name}: {change_desc}."
            )

        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)

