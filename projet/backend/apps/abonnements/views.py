from datetime import timedelta
from django.utils import timezone
from rest_framework import generics, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.comptes.permissions import EstCommercant, EstSuperAdmin
from .models import Plan, Abonnement, Facture
from .serializers import PlanSerializer, AbonnementSerializer, ChangerPlanSerializer



class ListerPlansView(generics.ListAPIView):
    """Liste publique des plans disponibles — visible même sans connexion, pour une future page tarifs."""

    serializer_class = PlanSerializer
    queryset = Plan.objects.filter(est_actif=True)
    permission_classes = []


class MonAbonnementView(generics.RetrieveAPIView):
    """Consultation de l'abonnement de la boutique du commerçant connecté."""

    serializer_class = AbonnementSerializer
    permission_classes = [IsAuthenticated, EstCommercant]

    def get_object(self):
        return self.request.user.boutique.abonnements.order_by("-date_debut").first()


class ChangerPlanView(generics.GenericAPIView):
    """Change le plan de la boutique du commerçant connecté (simulation, pas de vrai prélèvement)."""

    serializer_class = ChangerPlanSerializer
    permission_classes = [IsAuthenticated, EstCommercant]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        abonnement = request.user.boutique.abonnements.order_by("-date_debut").first()
        nouveau_plan = serializer.validated_data["plan"]
        periodicite = serializer.validated_data["periodicite"]

        abonnement.periodicite = periodicite
        abonnement.date_prochain_renouvellement = timezone.now().date() + timedelta(
            days=365 if periodicite == "annuel" else 30
        )
        abonnement.changer_plan(nouveau_plan, commentaire=f"Changement vers {nouveau_plan.nom} ({periodicite})")

        # Facture simulée pour ce changement de plan
        if nouveau_plan.prix_pour(periodicite) > 0:
            Facture.objects.create(
                abonnement=abonnement,
                montant=nouveau_plan.prix_pour(periodicite),
                statut="payee",  # simulé : considéré payé immédiatement
                periode_debut=timezone.now().date(),
                periode_fin=abonnement.date_prochain_renouvellement,
                date_paiement=timezone.now(),
            )

        return Response(AbonnementSerializer(abonnement).data)


class AbonnementsAdminViewSet(viewsets.ReadOnlyModelViewSet):
    """Supervision de tous les abonnements de la plateforme, réservée au SuperAdmin."""

    serializer_class = AbonnementSerializer
    permission_classes = [IsAuthenticated, EstSuperAdmin]
    queryset = Abonnement.objects.select_related("tenant", "plan").order_by("-date_debut")