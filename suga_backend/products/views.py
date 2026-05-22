"""
products/views.py
Product listing (public), product detail, vendor CRUD, and image upload.
"""
from rest_framework import generics, permissions, status, parsers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q

from .models import Product, ProductImage, Category
from .serializers import (
    ProductListSerializer,
    ProductDetailSerializer,
    ProductCreateSerializer,
    ProductImageSerializer,
    CategorySerializer,
)


from accounts.permissions import IsVerifiedVendor

class IsVendorOwner(permissions.BasePermission):
    """Only the vendor who created the product can edit it."""
    def has_object_permission(self, request, view, obj):
        return obj.vendor == request.user


# ── Public Endpoints ─────────────────────────────────────────────────────

class ProductListView(generics.ListAPIView):
    """GET /api/products/ — browse active products (public)."""
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Product.objects.filter(status='active')

        # Search
        q = self.request.query_params.get('q')
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q))

        # Category filter
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category__slug=category)

        # Vendor filter
        vendor = self.request.query_params.get('vendor')
        if vendor:
            qs = qs.filter(vendor_id=vendor)

        # Price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)

        # Sorting
        sort = self.request.query_params.get('sort', '-created_at')
        allowed_sorts = ['price', '-price', 'avg_rating', '-avg_rating', '-created_at', '-total_sold']
        if sort in allowed_sorts:
            qs = qs.order_by(sort)

        return qs


class ProductDetailView(generics.RetrieveAPIView):
    """GET /api/products/{slug}/ — product detail (public)."""
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Product.objects.filter(status='active')
    lookup_field = 'slug'


class CategoryListView(generics.ListAPIView):
    """GET /api/categories/ — list all top-level categories (public)."""
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    queryset = Category.objects.filter(is_active=True, parent=None)


# ── Vendor Endpoints ─────────────────────────────────────────────────────

class VendorProductListView(generics.ListAPIView):
    """GET /api/vendor/products/ — list my products (vendor only)."""
    serializer_class = ProductListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(vendor=self.request.user)


class VendorProductCreateView(generics.CreateAPIView):
    """POST /api/vendor/products/ — create a product (vendor only)."""
    serializer_class = ProductCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsVerifiedVendor]

    def perform_create(self, serializer):
        serializer.save()


class VendorProductUpdateView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE /api/vendor/products/{id}/ — edit product."""
    serializer_class = ProductCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsVerifiedVendor, IsVendorOwner]

    def get_queryset(self):
        return Product.objects.filter(vendor=self.request.user)


class ProductImageUploadView(APIView):
    """POST /api/vendor/products/{product_id}/images/ — upload product images."""
    permission_classes = [permissions.IsAuthenticated, IsVerifiedVendor]
    parser_classes = [parsers.MultiPartParser]

    def post(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id, vendor=request.user)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        images = request.FILES.getlist('images')
        if not images:
            return Response({'error': 'No images provided.'}, status=status.HTTP_400_BAD_REQUEST)

        import os
        allowed_extensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif']
        allowed_mime_types = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

        for img in images:
            ext = os.path.splitext(img.name)[1].lower()
            if ext not in allowed_extensions:
                return Response({'error': f"File '{img.name}' has an invalid extension. Allowed: png, jpg, jpeg, webp, gif."}, status=status.HTTP_400_BAD_REQUEST)
            mime_type = getattr(img, 'content_type', None)
            if mime_type and mime_type not in allowed_mime_types:
                return Response({'error': f"File '{img.name}' has an invalid file type. Allowed: png, jpg, jpeg, webp, gif."}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        for i, img in enumerate(images):
            obj = ProductImage.objects.create(
                product=product,
                image=img,
                is_primary=(i == 0 and not product.images.exists()),
                order=product.images.count() + i,
            )
            created.append(ProductImageSerializer(obj, context={'request': request}).data)


        return Response({'uploaded': created}, status=status.HTTP_201_CREATED)
