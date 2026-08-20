from rest_framework.permissions import BasePermission


class EstProprietaireCommandeOuCommercant(BasePermission):
    """Autorise le client propriétaire de la commande, ou le commerçant de la boutique concernée."""

    def has_object_permission(self, request, view, obj):
        if obj.client_id == request.user.id:
            return True
        boutique = getattr(request.user, "boutique", None)
        return boutique is not None and obj.tenant_id == boutique.id