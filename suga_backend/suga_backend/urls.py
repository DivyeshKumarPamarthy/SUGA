"""
suga_backend/urls.py
Root URL configuration — routes all API traffic.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from accounts.views import VendorPublicProfileView

urlpatterns = [
    # Django admin
    path('admin/', admin.site.urls),

    # ── API Routes ────────────────────────────────────────────────────────
    # Auth & Accounts
    path('api/auth/', include('accounts.urls')),

    # Public vendor profiles
    path('api/vendors/<int:pk>/', VendorPublicProfileView.as_view(), name='vendor-public-profile'),

    # Products (public browsing)
    path('api/products/', include('products.urls')),

    # Vendor portal (product management)
    path('api/vendor/', include('products.vendor_urls')),

    # Orders
    path('api/orders/', include('orders.urls')),

    # Reviews
    path('api/reviews/', include('reviews.urls')),

    # Admin panel
    path('api/admin-panel/', include('administration.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
