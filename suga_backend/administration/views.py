"""
administration/views.py
Admin-only endpoints: dashboard, vendor verification, review moderation.
"""
from rest_framework import generics, permissions, status, parsers, exceptions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum

from accounts.models import User, VendorProfile
from accounts.serializers import VendorProfileSerializer
from accounts.permissions import IsVerifiedVendor
from products.models import Product
from orders.models import Order
from reviews.models import Review
from .models import Advertisement, SupportTicket, TicketReply
from .serializers import (
    AdvertisementSerializer,
    VendorAdCreateSerializer,
    SupportTicketSerializer,
    VendorVerifySerializer,
    AdminDashboardSerializer,
    TicketReplySerializer,
)


class IsAdminUser(permissions.BasePermission):
    """Only admin-role users."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


# ── Dashboard ────────────────────────────────────────────────────────────

class AdminDashboardView(APIView):
    """GET /api/admin/dashboard/ — platform overview stats."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_revenue = Order.objects.filter(
            status__in=['confirmed', 'processing', 'shipped', 'delivered']
        ).aggregate(total=Sum('total'))['total'] or 0

        data = {
            'total_customers': User.objects.filter(role='customer').count(),
            'total_vendors': User.objects.filter(role='vendor').count(),
            'total_products': Product.objects.count(),
            'total_orders': Order.objects.count(),
            'pending_verifications': VendorProfile.objects.filter(
                verification_status__in=['pending', 'under_review']
            ).count(),
            'pending_reviews': Review.objects.filter(moderation_status='pending').count(),
            'open_tickets': SupportTicket.objects.filter(status__in=['open', 'in_progress']).count(),
            'total_revenue': total_revenue,
        }
        return Response(AdminDashboardSerializer(data).data)


# ── Vendor Verification ──────────────────────────────────────────────────

class PendingVendorsView(generics.ListAPIView):
    """GET /api/admin/vendors/pending/ — list vendors awaiting verification."""
    serializer_class = VendorProfileSerializer
    permission_classes = [IsAdminUser]
    queryset = VendorProfile.objects.filter(
        verification_status__in=['pending', 'under_review']
    ).order_by('created_at')


class VerifyVendorView(APIView):
    """POST /api/admin/vendors/{id}/verify/ — approve or reject a vendor."""
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            profile = VendorProfile.objects.get(pk=pk)
        except VendorProfile.DoesNotExist:
            return Response({'error': 'Vendor not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = VendorVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data['action']
        if action == 'approve':
            profile.verification_status = 'approved'
            profile.rejection_reason = ''
        else:
            profile.verification_status = 'rejected'
            profile.rejection_reason = serializer.validated_data.get('rejection_reason', '')

        profile.save()
        return Response({
            'message': f'Vendor {profile.shop_name} has been {action}d.',
            'vendor': VendorProfileSerializer(profile).data,
        })


# ── Review Moderation ─────────────────────────────────────────────────────

class PendingReviewsView(generics.ListAPIView):
    """GET /api/admin/reviews/pending/ — list reviews awaiting moderation."""
    from reviews.serializers import ReviewSerializer
    serializer_class = ReviewSerializer
    permission_classes = [IsAdminUser]
    queryset = Review.objects.filter(moderation_status='pending')


class ModerateReviewView(APIView):
    """POST /api/admin/reviews/{id}/moderate/ — approve or reject a review."""
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            review = Review.objects.get(pk=pk)
        except Review.DoesNotExist:
            return Response({'error': 'Review not found.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')  # 'approve' or 'reject'
        if action == 'approve':
            review.moderation_status = 'approved'
        elif action == 'reject':
            review.moderation_status = 'rejected'
        else:
            return Response({'error': 'action must be "approve" or "reject".'}, status=status.HTTP_400_BAD_REQUEST)

        review.save()

        # Update product average rating if approved
        if action == 'approve':
            product = review.product
            approved_reviews = Review.objects.filter(product=product, moderation_status='approved')
            avg = approved_reviews.values_list('rating', flat=True)
            if avg:
                product.avg_rating = sum(avg) / len(avg)
                product.save()

        return Response({'message': f'Review {action}d successfully.'})


# ── Support Tickets ───────────────────────────────────────────────────────

class AdminTicketListView(generics.ListAPIView):
    """GET /api/admin-panel/tickets/ — all support tickets."""
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAdminUser]
    queryset = SupportTicket.objects.all()


class TicketCreateView(generics.CreateAPIView):
    """POST /api/admin-panel/tickets/create/ — submit a new ticket."""
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user, status='open')


class CustomerTicketListView(generics.ListAPIView):
    """GET /api/admin-panel/tickets/my/ — list my own tickets."""
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SupportTicket.objects.filter(submitted_by=self.request.user)


class AdminTicketDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/admin-panel/tickets/<int:pk>/ — view/update a ticket."""
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAdminUser]
    queryset = SupportTicket.objects.all()



# ── Advertisements ────────────────────────────────────────────────────────

class AdminAdListView(generics.ListAPIView):
    """GET /api/admin-panel/ads/ — list all advertisements."""
    serializer_class = AdvertisementSerializer
    permission_classes = [IsAdminUser]
    queryset = Advertisement.objects.all()


class AdminAdApproveView(APIView):
    """POST /api/admin-panel/ads/{id}/approve/ — approve or reject an advertisement."""
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            ad = Advertisement.objects.get(pk=pk)
        except Advertisement.DoesNotExist:
            return Response({'error': 'Advertisement not found.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')  # 'approve' or 'reject'
        rejection_reason = request.data.get('rejection_reason', '')

        if action == 'approve':
            ad.status = 'approved'
            ad.rejection_reason = ''
        elif action == 'reject':
            ad.status = 'rejected'
            ad.rejection_reason = rejection_reason
        else:
            return Response({'error': 'action must be "approve" or "reject".'}, status=status.HTTP_400_BAD_REQUEST)

        ad.reviewed_by = request.user
        ad.save()
        return Response({
            'message': f'Advertisement has been {action}d.',
            'advertisement': AdvertisementSerializer(ad).data
        })


# ── Vendor-Facing Ad Endpoints ────────────────────────────────────────────

class VendorAdListView(generics.ListAPIView):
    """GET /api/admin-panel/ads/my/ — vendor lists their own ad campaigns."""
    serializer_class = AdvertisementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Advertisement.objects.filter(vendor=self.request.user)


class VendorAdCreateView(generics.CreateAPIView):
    """POST /api/admin-panel/ads/create/ — vendor submits a new ad campaign request."""
    serializer_class = VendorAdCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsVerifiedVendor]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def perform_create(self, serializer):
        serializer.save(vendor=self.request.user, status='pending', payment_status='unpaid')


class TicketReplyListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/admin-panel/tickets/<int:ticket_pk>/replies/ — view/create replies."""
    serializer_class = TicketReplySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        ticket_pk = self.kwargs.get('ticket_pk')
        try:
            ticket = SupportTicket.objects.get(pk=ticket_pk)
        except SupportTicket.DoesNotExist:
            raise exceptions.NotFound("Support ticket not found.")

        # Check permissions: Admin or owner of the ticket
        if not (self.request.user.role == 'admin' or ticket.submitted_by == self.request.user):
            raise exceptions.PermissionDenied("You do not have permission to view replies for this ticket.")

        return TicketReply.objects.filter(ticket=ticket)

    def perform_create(self, serializer):
        ticket_pk = self.kwargs.get('ticket_pk')
        try:
            ticket = SupportTicket.objects.get(pk=ticket_pk)
        except SupportTicket.DoesNotExist:
            raise exceptions.NotFound("Support ticket not found.")

        # Check permissions: Admin or owner of the ticket
        if not (self.request.user.role == 'admin' or ticket.submitted_by == self.request.user):
            raise exceptions.PermissionDenied("You do not have permission to reply to this ticket.")

        serializer.save(ticket=ticket, sender=self.request.user)


