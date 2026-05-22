"""
reviews/models.py
Review system — only verified purchasers can leave reviews.
"""
from django.db import models
from django.conf import settings


class Review(models.Model):
    """Customer review for a product."""

    class ModerationStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews',
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='reviews',
    )
    order_item = models.ForeignKey(
        'orders.OrderItem',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        help_text='Links review to a specific purchase for verification',
    )

    rating = models.PositiveSmallIntegerField(help_text='1-5 stars')
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField()

    is_verified_purchase = models.BooleanField(default=False)
    moderation_status = models.CharField(
        max_length=10,
        choices=ModerationStatus.choices,
        default=ModerationStatus.PENDING,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['customer', 'product']  # One review per product per user

    def __str__(self):
        return f"{self.customer.username} → {self.product.title} ({self.rating}★)"
