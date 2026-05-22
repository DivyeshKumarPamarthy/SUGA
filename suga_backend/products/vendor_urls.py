"""
products/vendor_urls.py
Vendor-only product management endpoints.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('products/', views.VendorProductListView.as_view(), name='vendor-product-list'),
    path('products/create/', views.VendorProductCreateView.as_view(), name='vendor-product-create'),
    path('products/<int:pk>/', views.VendorProductUpdateView.as_view(), name='vendor-product-update'),
    path('products/<int:product_id>/images/', views.ProductImageUploadView.as_view(), name='product-image-upload'),
]
