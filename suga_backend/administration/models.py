"""
administration/models.py
Platform-level models: Advertisements, SupportTickets.
"""
from django.db import models
from django.conf import settings


class Advertisement(models.Model):
    """Vendor-purchased ad placements on the platform."""

    class AdType(models.TextChoices):
        HOMEPAGE_CAROUSEL = 'homepage_carousel', 'Homepage Carousel'
        SEARCH_TOP = 'search_top', 'Top of Search Results'
        FEATURED_ARTISAN = 'featured_artisan', 'Featured Artisan'
        CATEGORY_BANNER = 'category_banner', 'Category Banner'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending Approval'
        APPROVED = 'approved', 'Approved'
        ACTIVE = 'active', 'Active'
        REJECTED = 'rejected', 'Rejected'
        EXPIRED = 'expired', 'Expired'

    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='advertisements',
        limit_choices_to={'role': 'vendor'},
    )
    ad_type = models.CharField(max_length=30, choices=AdType.choices)
    title = models.CharField(max_length=200)
    banner = models.ImageField(upload_to='ads/', blank=True, null=True)
    target_url = models.URLField(blank=True)
    keywords = models.CharField(max_length=300, blank=True, help_text='Comma-separated keywords')

    start_date = models.DateField()
    end_date = models.DateField()
    daily_rate = models.DecimalField(max_digits=8, decimal_places=2)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_status = models.CharField(max_length=20, default='unpaid')
    priority = models.PositiveSmallIntegerField(default=0)

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reviewed_ads',
    )
    rejection_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_ad_type_display()})"


class SupportTicket(models.Model):
    """Customer/vendor support requests."""

    class IssueType(models.TextChoices):
        ORDER = 'order', 'Order Issue'
        PAYMENT = 'payment', 'Payment Issue'
        PRODUCT = 'product', 'Product Issue'
        ACCOUNT = 'account', 'Account Issue'
        VENDOR = 'vendor', 'Vendor Complaint'
        OTHER = 'other', 'Other'

    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        URGENT = 'urgent', 'Urgent'

    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        IN_PROGRESS = 'in_progress', 'In Progress'
        RESOLVED = 'resolved', 'Resolved'
        CLOSED = 'closed', 'Closed'

    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tickets',
    )
    issue_type = models.CharField(max_length=20, choices=IssueType.choices)
    subject = models.CharField(max_length=300)
    description = models.TextField()
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)

    assigned_admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assigned_tickets',
        limit_choices_to={'role': 'admin'},
    )

    related_order = models.ForeignKey(
        'orders.Order',
        on_delete=models.SET_NULL,
        null=True, blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Ticket #{self.id}: {self.subject}"


class TicketReply(models.Model):
    """Replies within a support ticket conversation."""
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='replies')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Reply by {self.sender.username} on Ticket #{self.ticket.id}"

