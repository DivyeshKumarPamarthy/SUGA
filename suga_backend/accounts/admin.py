from django.contrib import admin
# pyrefly: ignore [missing-import]
from .models import User, VendorProfile, Notification


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']


@admin.register(VendorProfile)
class VendorProfileAdmin(admin.ModelAdmin):
    list_display = ['shop_name', 'vendor_type', 'verification_status', 'rating', 'created_at']
    list_filter = ['vendor_type', 'verification_status']
    search_fields = ['shop_name', 'user__username']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['user__username', 'title', 'message']

