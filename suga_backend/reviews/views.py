"""
reviews/views.py
Review creation (verified purchase check) and listing.
"""
from rest_framework import generics, permissions, status
from rest_framework.response import Response

# pyrefly: ignore [missing-import]
from .models import Review
# pyrefly: ignore [missing-import]
from .serializers import ReviewSerializer, ReviewCreateSerializer
from orders.models import OrderItem


class ReviewListView(generics.ListAPIView):
    """GET /api/reviews/?product={id} — list approved reviews for a product."""
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Review.objects.filter(moderation_status='approved')
        product = self.request.query_params.get('product')
        if product:
            qs = qs.filter(product_id=product)
        return qs


class ReviewCreateView(generics.CreateAPIView):
    """POST /api/reviews/ — customer writes a review (verified purchase check)."""
    serializer_class = ReviewCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        customer = self.request.user
        product = serializer.validated_data['product']

        # Check if customer has purchased this product (delivered)
        purchased_item = OrderItem.objects.filter(
            order__customer=customer,
            product=product,
            item_status='delivered',
        ).first()

        if not purchased_item:
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Only verified purchasers who have received this product can write a review.')

        serializer.save(
            customer=customer,
            is_verified_purchase=True,
            order_item=purchased_item,
        )
