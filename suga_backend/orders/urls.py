"""
orders/urls.py
"""
from django.urls import path
# pyrefly: ignore [missing-import]
from . import views

urlpatterns = [
    path('', views.OrderListView.as_view(), name='order-list'),
    path('place/', views.PlaceOrderView.as_view(), name='place-order'),
    path('items/<int:item_id>/status/', views.UpdateOrderItemStatusView.as_view(), name='update-item-status'),
    path('appointments/', views.AppointmentListView.as_view(), name='appointment-list'),
    path('appointments/book/', views.BookAppointmentView.as_view(), name='book-appointment'),
    path('appointments/<int:pk>/status/', views.UpdateAppointmentStatusView.as_view(), name='update-appointment-status'),
    # Put generic string matching route at the end to prevent routing conflicts
    path('<str:order_number>/', views.OrderDetailView.as_view(), name='order-detail'),
]

