from rest_framework.permissions import BasePermission
from .models import CustomUser


class EstSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == CustomUser.Role.SUPERADMIN
        )


class EstCommercant(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == CustomUser.Role.COMMERCANT
        )


class EstProprietaireBoutique(BasePermission):
    """Vérifie que l'objet manipulé (produit, commande...) appartient bien
    à la boutique du commerçant actuellement connecté."""

    def has_object_permission(self, request, view, obj):
        tenant = getattr(request.user, "boutique", None)
        if tenant is None:
            return False
        return obj.tenant_id == tenant.id