"""
administration/urls.py
"""
from django.urls import path
from . import views

urlpatterns = [
    # Dashboard
    path('dashboard/', views.AdminDashboardView.as_view(), name='admin-dashboard'),

    # Vendor Verification
    path('vendors/pending/', views.PendingVendorsView.as_view(), name='pending-vendors'),
    path('vendors/<int:pk>/verify/', views.VerifyVendorView.as_view(), name='verify-vendor'),

    # Review Moderation
    path('reviews/pending/', views.PendingReviewsView.as_view(), name='pending-reviews'),
    path('reviews/<int:pk>/moderate/', views.ModerateReviewView.as_view(), name='moderate-review'),

    # Support Tickets
    path('tickets/', views.AdminTicketListView.as_view(), name='admin-tickets'),
    path('tickets/create/', views.TicketCreateView.as_view(), name='ticket-create'),
    path('tickets/my/', views.CustomerTicketListView.as_view(), name='customer-tickets'),
    path('tickets/<int:pk>/', views.AdminTicketDetailView.as_view(), name='admin-ticket-detail'),
    path('tickets/<int:ticket_pk>/replies/', views.TicketReplyListCreateView.as_view(), name='ticket-replies'),

    # Advertisements (Admin)
    path('ads/', views.AdminAdListView.as_view(), name='admin-ads'),
    path('ads/<int:pk>/approve/', views.AdminAdApproveView.as_view(), name='approve-ad'),

    # Advertisements (Vendor-facing)
    path('ads/my/', views.VendorAdListView.as_view(), name='vendor-ads'),
    path('ads/create/', views.VendorAdCreateView.as_view(), name='vendor-ad-create'),
]

