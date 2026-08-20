from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.comptes.permissions import EstCommercant
from .models import Tenant
from .serializers import TenantSerializer, TenantPublicSerializer
from rest_framework import viewsets
from django.utils import timezone
from apps.comptes.permissions import EstSuperAdmin
from .serializers import TenantAdminSerializer

class MaBoutiqueView(generics.RetrieveUpdateAPIView):
    serializer_class = TenantSerializer
    permission_classes = [IsAuthenticated, EstCommercant]

    def get_object(self):
        return self.request.user.boutique


class BoutiquePubliqueView(generics.RetrieveAPIView):
    """Vitrine publique : infos d'une boutique à partir de son sous-domaine, sans authentification."""

    serializer_class = TenantPublicSerializer
    permission_classes = [AllowAny]
    lookup_field = "sous_domaine"
    lookup_url_kwarg = "sous_domaine"

    def get_queryset(self):
        return Tenant.objects.filter(est_supprime=False, statut="actif") | Tenant.objects.filter(
            est_supprime=False, statut="en_essai"
        )

class TenantAdminViewSet(viewsets.ReadOnlyModelViewSet):
    """Supervision de toutes les boutiques de la plateforme, réservée au SuperAdmin."""

    serializer_class = TenantAdminSerializer
    permission_classes = [IsAuthenticated, EstSuperAdmin]
    queryset = Tenant.objects.all().order_by("-date_creation")

    @action(detail=True, methods=["post"])
    def suspendre(self, request, pk=None):
        tenant = self.get_object()
        tenant.statut = "suspendu"
        tenant.save(update_fields=["statut"])
        return Response(TenantAdminSerializer(tenant).data)

    @action(detail=True, methods=["post"])
    def reactiver(self, request, pk=None):
        tenant = self.get_object()
        tenant.statut = "actif"
        tenant.save(update_fields=["statut"])
        return Response(TenantAdminSerializer(tenant).data)

    @action(detail=True, methods=["post"])
    def verifier(self, request, pk=None):
        tenant = self.get_object()
        tenant.est_verifie = True
        tenant.date_verification = timezone.now()
        tenant.save(update_fields=["est_verifie", "date_verification"])
        return Response(TenantAdminSerializer(tenant).data)

    @action(detail=True, methods=["post"])
    def retirer_verification(self, request, pk=None):
        tenant = self.get_object()
        tenant.est_verifie = False
        tenant.date_verification = None
        tenant.save(update_fields=["est_verifie", "date_verification"])
        return Response(TenantAdminSerializer(tenant).data)