from django.contrib import admin
from .models import Advertisement, SupportTicket


@admin.register(Advertisement)
class AdvertisementAdmin(admin.ModelAdmin):
    list_display = ['title', 'vendor', 'ad_type', 'status', 'start_date', 'end_date', 'created_at']
    list_filter = ['status', 'ad_type']
    search_fields = ['title', 'vendor__username']


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ['id', 'subject', 'submitted_by', 'issue_type', 'priority', 'status', 'created_at']
    list_filter = ['status', 'priority', 'issue_type']
    search_fields = ['subject', 'submitted_by__username']
