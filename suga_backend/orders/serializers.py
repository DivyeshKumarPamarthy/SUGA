"""
orders/serializers.py
Serializers for placing orders and managing order status.
"""
from rest_framework import serializers
from .models import Order, OrderItem, Appointment
from products.serializers import ProductListSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source='product.title', read_only=True, default='')
    vendor_name = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_title', 'vendor', 'vendor_name',
            'quantity', 'price', 'total', 'size',
            'customization_request', 'item_status',
        ]
        read_only_fields = ['id', 'vendor', 'vendor_name', 'price', 'total', 'item_status']

    def get_vendor_name(self, obj):
        if obj.vendor and hasattr(obj.vendor, 'vendor_profile'):
            return obj.vendor.vendor_profile.shop_name
        return ''

    def validate(self, attrs):
        product = attrs.get('product')
        quantity = attrs.get('quantity', 1)
        if product.status != 'active':
            raise serializers.ValidationError(
                {'product': f'{product.title} is currently unavailable.'}
            )
        if product.stock < quantity:
            raise serializers.ValidationError(
                {'quantity': f'Only {product.stock} units of {product.title} are available.'}
            )
        return attrs


class OrderCreateSerializer(serializers.ModelSerializer):
    """Customer places an order."""
    items = OrderItemSerializer(many=True)

    status = serializers.ChoiceField(choices=Order.Status.choices, required=False)
    payment_status = serializers.CharField(required=False)

    class Meta:
        model = Order
        fields = [
            'shipping_name', 'shipping_address', 'shipping_city',
            'shipping_state', 'shipping_pincode', 'shipping_phone',
            'notes', 'items', 'status', 'payment_status',
        ]

    def create(self, validated_data):
        from django.db import transaction
        from django.db.models import F
        from products.models import Product

        items_data = validated_data.pop('items')
        customer = self.context['request'].user

        with transaction.atomic():
            order = Order.objects.create(customer=customer, **validated_data)
            subtotal = 0

            for item_data in items_data:
                product = item_data['product']
                quantity = item_data.get('quantity', 1)
                price = product.price
                item_total = price * quantity

                # Lock product row in database to handle race conditions
                product_db = Product.objects.select_for_update().get(id=product.id)
                if product_db.stock < quantity:
                    raise serializers.ValidationError(
                        f"Only {product_db.stock} units of {product_db.title} are available."
                    )

                # Decrement stock
                product_db.stock = F('stock') - quantity
                product_db.save()

                # Update status to out of stock if appropriate
                product_db.refresh_from_db()
                if product_db.stock == 0:
                    product_db.status = 'out_of_stock'
                    product_db.save()

                OrderItem.objects.create(
                    order=order,
                    product=product_db,
                    vendor=product_db.vendor,
                    quantity=quantity,
                    price=price,
                    total=item_total,
                    size=item_data.get('size', ''),
                    customization_request=item_data.get('customization_request', ''),
                )
                subtotal += item_total

            order.subtotal = subtotal
            order.total = subtotal + order.shipping_charge - order.discount
            order.save()

        return order


class OrderListSerializer(serializers.ModelSerializer):
    """For listing orders."""
    items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer', 'customer_name', 'status',
            'subtotal', 'shipping_charge', 'discount', 'total',
            'payment_status', 'items', 'created_at',
        ]
        read_only_fields = fields


class OrderStatusUpdateSerializer(serializers.Serializer):
    """Vendor or Admin updates order item status."""
    item_status = serializers.ChoiceField(choices=OrderItem.ItemStatus.choices)


class AppointmentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    vendor_name = serializers.CharField(source='vendor.vendor_profile.shop_name', read_only=True, default='')
    product_title = serializers.CharField(source='order_item.product.title', read_only=True, default='')
    order_number = serializers.CharField(source='order_item.order.order_number', read_only=True, default='')

    class Meta:
        model = Appointment
        fields = [
            'id', 'customer', 'customer_name', 'vendor', 'vendor_name',
            'order_item', 'product_title', 'order_number',
            'appointment_type', 'date', 'time_slot', 'status',
            'meeting_link', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'customer', 'customer_name', 'vendor_name', 'product_title', 'order_number', 'created_at', 'updated_at']


class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            'id', 'vendor', 'order_item', 'appointment_type',
            'date', 'time_slot', 'notes'
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        vendor = attrs.get('vendor')
        order_item = attrs.get('order_item')
        request = self.context.get('request')

        if not vendor.is_vendor:
            raise serializers.ValidationError({'vendor': 'Selected user must be a vendor.'})

        if order_item and request and request.user:
            if order_item.order.customer != request.user:
                raise serializers.ValidationError({'order_item': 'You do not own this order item.'})
            if order_item.vendor != vendor:
                raise serializers.ValidationError({'vendor': 'The selected vendor does not match the vendor of the order item.'})

        return attrs


