"""
products/urls.py
"""
from django.urls import path
from . import views

urlpatterns = [
    # Public
    path('', views.ProductListView.as_view(), name='product-list'),
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('<slug:slug>/', views.ProductDetailView.as_view(), name='product-detail'),
]
