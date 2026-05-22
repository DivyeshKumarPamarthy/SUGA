from django.contrib import admin
from .models import Category, Product, ProductImage


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'parent', 'is_active']
    prepopulated_fields = {'slug': ('name',)}


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['title', 'vendor', 'price', 'stock', 'status', 'avg_rating', 'created_at']
    list_filter = ['status', 'category', 'is_customizable']
    search_fields = ['title', 'vendor__username']
    prepopulated_fields = {'slug': ('title',)}
    inlines = [ProductImageInline]
