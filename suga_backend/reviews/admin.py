from django.contrib import admin
# pyrefly: ignore [missing-import]
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['customer', 'product', 'rating', 'is_verified_purchase', 'moderation_status', 'created_at']
    list_filter = ['moderation_status', 'is_verified_purchase', 'rating']
    search_fields = ['customer__username', 'product__title']
