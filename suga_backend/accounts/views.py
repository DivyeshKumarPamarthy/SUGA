"""
accounts/views.py
Registration, profile, and vendor profile endpoints.
"""
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model

from .serializers import (
    RegisterSerializer,
    UserSerializer,
    VendorProfileSerializer,
    VendorProfileUpdateSerializer,
    NotificationSerializer,
)
from .models import VendorProfile, Notification

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — register a customer or vendor."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                'message': f'{user.get_role_display()} registered successfully.',
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    """GET /api/auth/me/ — return the current user's profile."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = UserSerializer(request.user).data
        if request.user.is_vendor:
            try:
                profile = request.user.vendor_profile
                data['vendor_profile'] = VendorProfileSerializer(profile).data
            except VendorProfile.DoesNotExist:
                data['vendor_profile'] = None
        return Response(data)


class VendorProfileUpdateView(generics.UpdateAPIView):
    """PUT/PATCH /api/auth/vendor-profile/ — vendor updates their own profile."""
    serializer_class = VendorProfileUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.vendor_profile


class VendorPublicProfileView(generics.RetrieveAPIView):
    """GET /api/vendors/{id}/ — public vendor profile (no auth needed)."""
    serializer_class = VendorProfileSerializer
    permission_classes = [permissions.AllowAny]
    queryset = VendorProfile.objects.filter(verification_status='approved')
    lookup_field = 'pk'


class NotificationListView(generics.ListAPIView):
    """GET /api/auth/notifications/ — list user's notifications."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.notifications.all()


class NotificationMarkReadView(APIView):
    """PATCH /api/auth/notifications/{id}/read/ — mark notification as read."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            notification = request.user.notifications.get(pk=pk)
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)

        notification.is_read = True
        notification.save()
        return Response(NotificationSerializer(notification).data)

