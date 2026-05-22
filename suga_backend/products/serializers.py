"""
products/serializers.py
Serializers for product listing, creation, and category management.
"""
from rest_framework import serializers
from .models import Product, ProductImage, Category
from accounts.serializers import UserSerializer


class CategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon', 'parent', 'subcategories']

    def get_subcategories(self, obj):
        children = obj.subcategories.filter(is_active=True)
        return CategorySerializer(children, many=True).data


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'order']


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for product listing pages."""
    vendor_name = serializers.CharField(source='vendor.vendor_profile.shop_name', read_only=True, default='')
    category_name = serializers.CharField(source='category.name', read_only=True, default='')
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'slug', 'price', 'compare_at_price',
            'vendor_name', 'category_name', 'primary_image',
            'avg_rating', 'total_sold', 'is_customizable', 'status',
        ]

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(img.image.url)
            return img.image.url
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full product detail with images and vendor info."""
    images = ProductImageSerializer(many=True, read_only=True)
    vendor = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'slug', 'description', 'price', 'compare_at_price',
            'vendor', 'category', 'images', 'stock', 'sku',
            'is_customizable', 'customization_notes',
            'sizes_available', 'fabric_type', 'care_instructions',
            'status', 'is_featured', 'avg_rating', 'total_sold',
            'created_at', 'updated_at',
        ]


class ProductCreateSerializer(serializers.ModelSerializer):
    """Vendor creates/edits a product."""
    class Meta:
        model = Product
        fields = [
            'title', 'description', 'category', 'price', 'compare_at_price',
            'stock', 'sku', 'is_customizable', 'customization_notes',
            'sizes_available', 'fabric_type', 'care_instructions', 'status',
        ]

    def create(self, validated_data):
        validated_data['vendor'] = self.context['request'].user
        # Auto-generate slug from title
        from django.utils.text import slugify
        import uuid
        base_slug = slugify(validated_data['title'])
        validated_data['slug'] = f"{base_slug}-{uuid.uuid4().hex[:6]}"
        return super().create(validated_data)
