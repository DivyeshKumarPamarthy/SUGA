"""
reviews/serializers.py
"""
from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    product_title = serializers.CharField(source='product.title', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'customer', 'customer_name', 'product', 'product_title', 'rating',
            'title', 'comment', 'is_verified_purchase',
            'moderation_status', 'created_at',
        ]
        read_only_fields = ['id', 'customer', 'customer_name', 'product_title',
                            'is_verified_purchase', 'moderation_status', 'created_at']


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'product', 'rating', 'title', 'comment']
        read_only_fields = ['id']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        if request and request.user:
            customer = request.user
            product = attrs.get('product')
            if Review.objects.filter(customer=customer, product=product).exists():
                raise serializers.ValidationError('You have already submitted a review for this product.')
        return attrs

