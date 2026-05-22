"""
accounts/serializers.py
Serializers for registration, login, user profile, and vendor profiles.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import VendorProfile, Notification

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """Register a new customer or vendor."""
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=[('customer', 'Customer'), ('vendor', 'Vendor')])

    # Optional vendor fields (only required when role=vendor)
    shop_name = serializers.CharField(required=False, allow_blank=True)
    vendor_type = serializers.ChoiceField(
        choices=VendorProfile.VendorType.choices, required=False
    )
    location = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'phone', 'password', 'password2', 'role',
            'shop_name', 'vendor_type', 'location',
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password2': 'Passwords do not match.'})
        if attrs.get('role') == 'vendor' and not attrs.get('shop_name'):
            raise serializers.ValidationError({'shop_name': 'Shop name is required for vendors.'})
        return attrs

    def create(self, validated_data):
        # Pop vendor-specific fields
        shop_name = validated_data.pop('shop_name', '')
        vendor_type = validated_data.pop('vendor_type', 'tailor')
        location = validated_data.pop('location', '')
        validated_data.pop('password2')
        password = validated_data.pop('password')

        user = User.objects.create_user(password=password, **validated_data)

        # If vendor, create a VendorProfile automatically
        if user.role == 'vendor':
            VendorProfile.objects.create(
                user=user,
                shop_name=shop_name,
                vendor_type=vendor_type,
                location=location,
            )

        return user


class UserSerializer(serializers.ModelSerializer):
    """Public user representation."""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'phone', 'role', 'avatar', 'created_at']
        read_only_fields = ['id', 'role', 'created_at']


class VendorProfileSerializer(serializers.ModelSerializer):
    """Vendor profile details."""
    user = UserSerializer(read_only=True)

    class Meta:
        model = VendorProfile
        fields = [
            'id', 'user', 'shop_name', 'vendor_type', 'description',
            'location', 'city', 'state', 'pincode',
            'verification_status', 'gstin',
            'id_document', 'business_license', 'rejection_reason',
            'rating', 'total_reviews', 'total_sales',
            'banner_image', 'logo', 'created_at',
        ]
        read_only_fields = ['id', 'verification_status', 'rating',
                            'total_reviews', 'total_sales', 'created_at']


class VendorProfileUpdateSerializer(serializers.ModelSerializer):
    """Allows vendors to update their own profile."""
    class Meta:
        model = VendorProfile
        fields = [
            'shop_name', 'vendor_type', 'description',
            'location', 'city', 'state', 'pincode',
            'gstin', 'id_document', 'business_license',
            'banner_image', 'logo',
        ]

    def validate(self, attrs):
        import os
        # Image fields validation helper
        def validate_image_file(file_obj, field_name):
            if not file_obj:
                return
            allowed_extensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif']
            allowed_mime_types = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
            
            ext = os.path.splitext(file_obj.name)[1].lower()
            if ext not in allowed_extensions:
                raise serializers.ValidationError({field_name: f"Invalid extension '{ext}'. Allowed image extensions are png, jpg, jpeg, webp, gif."})
            
            mime_type = getattr(file_obj, 'content_type', None)
            if mime_type and mime_type not in allowed_mime_types:
                raise serializers.ValidationError({field_name: f"Invalid file type '{mime_type}'. Allowed formats are png, jpg, jpeg, webp, gif."})

        # Document fields validation helper
        def validate_document_file(file_obj, field_name):
            if not file_obj:
                return
            allowed_extensions = ['.pdf', '.png', '.jpg', '.jpeg']
            allowed_mime_types = ['application/pdf', 'image/png', 'image/jpeg']
            
            ext = os.path.splitext(file_obj.name)[1].lower()
            if ext not in allowed_extensions:
                raise serializers.ValidationError({field_name: f"Invalid extension '{ext}'. Allowed document extensions are pdf, png, jpg, jpeg."})
            
            mime_type = getattr(file_obj, 'content_type', None)
            if mime_type and mime_type not in allowed_mime_types:
                raise serializers.ValidationError({field_name: f"Invalid file type '{mime_type}'. Allowed formats are pdf, png, jpg, jpeg."})

        if 'banner_image' in attrs:
            validate_image_file(attrs['banner_image'], 'banner_image')
        if 'logo' in attrs:
            validate_image_file(attrs['logo'], 'logo')
        if 'id_document' in attrs:
            validate_document_file(attrs['id_document'], 'id_document')
        if 'business_license' in attrs:
            validate_document_file(attrs['business_license'], 'business_license')

        return attrs



class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']

