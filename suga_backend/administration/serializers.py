"""
administration/serializers.py
"""
from rest_framework import serializers
from .models import Advertisement, SupportTicket, TicketReply
from accounts.serializers import VendorProfileSerializer


class AdvertisementSerializer(serializers.ModelSerializer):
    vendor_name = serializers.SerializerMethodField()

    class Meta:
        model = Advertisement
        fields = '__all__'
        read_only_fields = ['id', 'status', 'reviewed_by', 'created_at', 'updated_at']

    def get_vendor_name(self, obj):
        if hasattr(obj.vendor, 'vendor_profile'):
            return obj.vendor.vendor_profile.shop_name
        return obj.vendor.username


class VendorAdCreateSerializer(serializers.ModelSerializer):
    """Vendor submits a new promotional campaign request."""
    class Meta:
        model = Advertisement
        fields = [
            'id', 'ad_type', 'title', 'banner', 'target_url',
            'keywords', 'start_date', 'end_date', 'daily_rate',
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        import os
        start = attrs.get('start_date')
        end = attrs.get('end_date')
        if start and end and end < start:
            raise serializers.ValidationError({'end_date': 'End date must be on or after start date.'})

        banner = attrs.get('banner')
        if banner:
            allowed_extensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif']
            allowed_mime_types = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
            ext = os.path.splitext(banner.name)[1].lower()
            if ext not in allowed_extensions:
                raise serializers.ValidationError({'banner': f"Invalid image extension '{ext}'. Allowed: png, jpg, jpeg, webp, gif."})
            mime_type = getattr(banner, 'content_type', None)
            if mime_type and mime_type not in allowed_mime_types:
                raise serializers.ValidationError({'banner': f"Invalid file type '{mime_type}'."})

        return attrs




class TicketReplySerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_role = serializers.CharField(source='sender.role', read_only=True)

    class Meta:
        model = TicketReply
        fields = ['id', 'ticket', 'sender', 'sender_name', 'sender_role', 'message', 'created_at']
        read_only_fields = ['id', 'ticket', 'sender', 'created_at']

    def get_sender_name(self, obj):
        full_name = obj.sender.get_full_name()
        return full_name if full_name else obj.sender.username


class SupportTicketSerializer(serializers.ModelSerializer):
    submitted_by_name = serializers.CharField(source='submitted_by.get_full_name', read_only=True)
    replies = TicketReplySerializer(many=True, read_only=True)

    class Meta:
        model = SupportTicket
        fields = '__all__'
        read_only_fields = ['id', 'submitted_by', 'created_at', 'updated_at']

    def validate_related_order(self, value):
        if value:
            request = self.context.get('request')
            if request and request.user:
                user = request.user
                if user.role == 'customer':
                    if value.customer != user:
                        raise serializers.ValidationError("This order does not belong to you.")
                elif user.role == 'vendor':
                    from orders.models import OrderItem
                    if not OrderItem.objects.filter(order=value, vendor=user).exists():
                        raise serializers.ValidationError("You do not have any items in this order.")
        return value



class VendorVerifySerializer(serializers.Serializer):
    """Admin approves or rejects a vendor."""
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)


class AdminDashboardSerializer(serializers.Serializer):
    """Aggregated platform stats."""
    total_customers = serializers.IntegerField()
    total_vendors = serializers.IntegerField()
    total_products = serializers.IntegerField()
    total_orders = serializers.IntegerField()
    pending_verifications = serializers.IntegerField()
    pending_reviews = serializers.IntegerField()
    open_tickets = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
