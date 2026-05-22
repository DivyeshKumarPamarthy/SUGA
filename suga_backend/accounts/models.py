"""
accounts/models.py
Custom User model with role-based access (customer, vendor, admin).
VendorProfile model for artisan/tailor business details.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user with role field."""

    class Role(models.TextChoices):
        CUSTOMER = 'customer', 'Customer'
        VENDOR = 'vendor', 'Vendor'
        ADMIN = 'admin', 'Admin'

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )
    phone = models.CharField(max_length=15, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_vendor(self):
        return self.role == self.Role.VENDOR

    @property
    def is_customer(self):
        return self.role == self.Role.CUSTOMER

    @property
    def is_admin_user(self):
        return self.role == self.Role.ADMIN


class VendorProfile(models.Model):
    """Extended profile for vendors (tailors, boutiques, weavers)."""

    class VendorType(models.TextChoices):
        TAILOR = 'tailor', 'Tailor'
        BOUTIQUE = 'boutique', 'Boutique'
        HANDLOOM_WEAVER = 'handloom_weaver', 'Handloom Weaver'
        ALTERATION_SPECIALIST = 'alteration_specialist', 'Alteration Specialist'

    class VerificationStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        UNDER_REVIEW = 'under_review', 'Under Review'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='vendor_profile')
    shop_name = models.CharField(max_length=200)
    vendor_type = models.CharField(max_length=30, choices=VendorType.choices, default=VendorType.TAILOR)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=300, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)

    # Verification
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
    )
    gstin = models.CharField(max_length=20, blank=True, help_text='GSTIN number')
    id_document = models.FileField(upload_to='vendor_docs/', blank=True, null=True)
    business_license = models.FileField(upload_to='vendor_docs/', blank=True, null=True)
    rejection_reason = models.TextField(blank=True)

    # Metrics
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_reviews = models.PositiveIntegerField(default=0)
    total_sales = models.PositiveIntegerField(default=0)

    # Branding
    banner_image = models.ImageField(upload_to='vendor_banners/', blank=True, null=True)
    logo = models.ImageField(upload_to='vendor_logos/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.shop_name} ({self.get_verification_status_display()})"

    class Meta:
        verbose_name = 'Vendor Profile'
        verbose_name_plural = 'Vendor Profiles'


class Notification(models.Model):
    """User-centric notifications for status changes, orders, or appointments."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.username}: {self.title}"

