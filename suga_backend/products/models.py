"""
products/models.py
Product catalog with categories, images, and customization support.
"""
from django.db import models
from django.conf import settings


class Category(models.Model):
    """Product categories (e.g. Suits, Sarees, Alterations)."""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text='Material icon name')
    parent = models.ForeignKey(
        'self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategories'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    """A product listed by a vendor."""

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        ACTIVE = 'active', 'Active'
        OUT_OF_STOCK = 'out_of_stock', 'Out of Stock'
        ARCHIVED = 'archived', 'Archived'

    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='products',
        limit_choices_to={'role': 'vendor'},
    )
    title = models.CharField(max_length=300)
    slug = models.SlugField(max_length=320, unique=True)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')

    price = models.DecimalField(max_digits=10, decimal_places=2)
    compare_at_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,
                                            help_text='Original price before discount')
    stock = models.PositiveIntegerField(default=0)
    sku = models.CharField(max_length=50, blank=True)

    is_customizable = models.BooleanField(default=False, help_text='Can customer request custom sizing/fabric?')
    customization_notes = models.TextField(blank=True, help_text='What can be customized')

    # Measurements / sizing
    sizes_available = models.JSONField(default=list, blank=True, help_text='e.g. ["S","M","L","XL"]')
    fabric_type = models.CharField(max_length=100, blank=True)
    care_instructions = models.TextField(blank=True)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    is_featured = models.BooleanField(default=False)

    # Metrics
    total_sold = models.PositiveIntegerField(default=0)
    avg_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def is_on_sale(self):
        return self.compare_at_price and self.compare_at_price > self.price


class ProductImage(models.Model):
    """Multiple images per product."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Image for {self.product.title}"
