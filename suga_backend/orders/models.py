"""
orders/models.py
Order system: customer places orders, vendor fulfils them.
"""
from django.db import models
from django.conf import settings


class Order(models.Model):
    """A customer's order, potentially spanning multiple vendors."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        CONFIRMED = 'confirmed', 'Confirmed'
        PROCESSING = 'processing', 'Processing'
        SHIPPED = 'shipped', 'Shipped'
        DELIVERED = 'delivered', 'Delivered'
        CANCELLED = 'cancelled', 'Cancelled'
        RETURNED = 'returned', 'Returned'

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders',
        limit_choices_to={'role': 'customer'},
    )
    order_number = models.CharField(max_length=20, unique=True, editable=False)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    # Shipping
    shipping_name = models.CharField(max_length=200)
    shipping_address = models.TextField()
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100)
    shipping_pincode = models.CharField(max_length=10)
    shipping_phone = models.CharField(max_length=15)

    # Totals
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_charge = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Payment (placeholder for Razorpay integration)
    payment_status = models.CharField(max_length=20, default='unpaid')
    payment_id = models.CharField(max_length=100, blank=True)

    notes = models.TextField(blank=True, help_text='Customer notes for the order')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order {self.order_number} by {self.customer.username}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            # Generate: SUGA-0001, SUGA-0002, ...
            last = Order.objects.order_by('-id').first()
            next_id = (last.id + 1) if last else 1
            self.order_number = f"SUGA-{next_id:04d}"
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    """Individual line items in an order."""

    class ItemStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        ACCEPTED = 'accepted', 'Accepted'
        REJECTED = 'rejected', 'Rejected'
        SHIPPED = 'shipped', 'Shipped'
        DELIVERED = 'delivered', 'Delivered'

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True)
    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='order_items_as_vendor',
    )

    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text='Price at time of order')
    total = models.DecimalField(max_digits=10, decimal_places=2)

    size = models.CharField(max_length=20, blank=True)
    customization_request = models.TextField(blank=True)

    item_status = models.CharField(max_length=20, choices=ItemStatus.choices, default=ItemStatus.PENDING)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.quantity}x {self.product} in {self.order.order_number}"

    def save(self, *args, **kwargs):
        if not self.total:
            self.total = self.price * self.quantity
        super().save(*args, **kwargs)


class Appointment(models.Model):
    """Consultations (digital measurements or studio fittings) for custom orders."""
    
    class AppointmentType(models.TextChoices):
        VIRTUAL = 'virtual', 'Virtual Measurement'
        IN_PERSON = 'in_person', 'In-Person Fitting'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        CONFIRMED = 'confirmed', 'Confirmed'
        RESCHEDULED = 'rescheduled', 'Rescheduled'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='appointments_as_customer',
        limit_choices_to={'role': 'customer'},
    )
    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='appointments_as_vendor',
        limit_choices_to={'role': 'vendor'},
    )
    order_item = models.ForeignKey(
        OrderItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appointments'
    )
    appointment_type = models.CharField(
        max_length=20,
        choices=AppointmentType.choices,
        default=AppointmentType.VIRTUAL,
    )
    date = models.DateField()
    time_slot = models.CharField(max_length=100) # e.g. "02:00 PM - 02:30 PM"
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    meeting_link = models.URLField(max_length=500, blank=True, null=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date', 'time_slot']

    def __str__(self):
        return f"{self.get_appointment_type_display()} with {self.customer.username} on {self.date}"

