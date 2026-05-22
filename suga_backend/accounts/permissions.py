from rest_framework import permissions

class IsVerifiedVendor(permissions.BasePermission):
    """
    Permission class that only allows verified vendors with 'approved' status.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'vendor' and
            hasattr(request.user, 'vendor_profile') and
            request.user.vendor_profile.verification_status == 'approved'
        )
