import uuid
from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.tenants.models import Tenant
from apps.comptes.permissions import EstCommercant, EstProprietaireBoutique
from .models import Commande
from .serializers import CommandeSerializer, CommandeCreationSerializer, NotificationCommandeSerializer
from .permissions import EstProprietaireCommandeOuCommercant

# La cloche du commerçant ne signale que les commandes à expédier : payées, pas encore expédiées.
# Dès qu'une commande passe à « expédiée » (ou est annulée), elle quitte la cloche.
STATUT_A_EXPEDIER = "payee"


class CreerCommandeView(generics.CreateAPIView):
    """Création d'une commande par un client connecté, à partir du panier."""

    serializer_class = CommandeCreationSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        tenant = generics.get_object_or_404(Tenant, sous_domaine=self.kwargs["sous_domaine"])
        serializer = self.get_serializer(
            data=request.data, context={"tenant": tenant, "client": request.user}
        )
        serializer.is_valid(raise_exception=True)
        commande = serializer.save()
        return Response(CommandeSerializer(commande).data, status=status.HTTP_201_CREATED)


class MesCommandesView(generics.ListAPIView):
    """Liste des commandes du client connecté, toutes boutiques confondues."""

    serializer_class = CommandeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Commande.objects.filter(client=self.request.user)


class CommandeDetailView(generics.RetrieveAPIView):
    """Détail/suivi d'une commande, accessible au client propriétaire ou au commerçant concerné."""

    serializer_class = CommandeSerializer
    permission_classes = [IsAuthenticated, EstProprietaireCommandeOuCommercant]
    lookup_field = "numero_commande"
    lookup_url_kwarg = "numero_commande"
    queryset = Commande.objects.all()


class CommandeCommercantViewSet(viewsets.ReadOnlyModelViewSet):
    """Gestion des commandes reçues, côté commerçant."""

    serializer_class = CommandeSerializer
    permission_classes = [IsAuthenticated, EstCommercant, EstProprietaireBoutique]

    TRANSITIONS_AUTORISEES = {
        "en_attente": ["annulee"],
        "payee": ["expediee", "annulee"],
        "expediee": ["livree", "annulee"],
        "livree": [],
        "annulee": [],
    }

    def get_queryset(self):
        return Commande.objects.filter(tenant=self.request.user.boutique)

    @action(detail=True, methods=["post"], url_path="changer-statut")
    def changer_statut(self, request, pk=None):
        commande = self.get_object()
        nouveau_statut = request.data.get("statut")
        commentaire = request.data.get("commentaire", "")

        if nouveau_statut not in dict(Commande.STATUT_CHOICES):
            return Response({"detail": "Statut invalide."}, status=400)

        transitions_possibles = self.TRANSITIONS_AUTORISEES.get(commande.statut, [])
        if nouveau_statut not in transitions_possibles:
            return Response(
                {"detail": f"Impossible de passer de \"{commande.statut}\" à \"{nouveau_statut}\" manuellement."},
                status=400,
            )

        if nouveau_statut == "annulee":
            commande.motif_annulation = commentaire
            commande.save(update_fields=["motif_annulation"])

        commande.changer_statut(nouveau_statut, commentaire)
        return Response(CommandeSerializer(commande).data)


class NotificationsCommandesView(APIView):
    """Cloche de notifications du commerçant : ses commandes À EXPÉDIER (payées, pas encore
    expédiées), avec le nombre de celles qu'il n'a pas encore ouvertes."""

    permission_classes = [IsAuthenticated, EstCommercant]

    def get(self, request):
        a_expedier = Commande.objects.filter(tenant=request.user.boutique, statut=STATUT_A_EXPEDIER)

        return Response({
            "non_lues": a_expedier.filter(notification_lue=False).count(),
            "commandes": NotificationCommandeSerializer(a_expedier[:10], many=True).data,  # les plus récentes d'abord
        })


class MarquerNotificationsLuesView(APIView):
    """Marque des notifications comme lues : celles de `ids` si la liste est fournie
    (clic sur une notification), sinon toutes les commandes à expédier (« Tout marquer comme lu »)."""

    permission_classes = [IsAuthenticated, EstCommercant]

    def post(self, request):
        commandes = Commande.objects.filter(tenant=request.user.boutique)
        a_expedier = commandes.filter(statut=STATUT_A_EXPEDIER)

        ids = request.data.get("ids")
        if ids:
            try:
                ids = [uuid.UUID(str(i)) for i in ids]
            except (ValueError, TypeError):
                return Response({"detail": "Identifiants de commande invalides."}, status=400)
            commandes.filter(id__in=ids).update(notification_lue=True)
        else:
            a_expedier.update(notification_lue=True)

        return Response({"non_lues": a_expedier.filter(notification_lue=False).count()})