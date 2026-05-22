from django.contrib import admin
from .models import Order, OrderItem, Appointment


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product', 'vendor', 'price', 'total']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'customer', 'status', 'total', 'payment_status', 'created_at']
    list_filter = ['status', 'payment_status']
    search_fields = ['order_number', 'customer__username']
    inlines = [OrderItemInline]


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['appointment_type', 'customer', 'vendor', 'date', 'time_slot', 'status']
    list_filter = ['appointment_type', 'status', 'date']
    search_fields = ['customer__username', 'vendor__username', 'time_slot']

