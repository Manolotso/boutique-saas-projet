import uuid

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from apps.catalogue.models import Produit
from apps.catalogue.serializers import ProduitPublicSerializer
from apps.tenants.models import Tenant

from .services import (
    enregistrer_evenement,
    produits_pour_vous,
    produits_recommandes,
    produits_similaires,
    rechercher_produits,
)


class RechercheThrottle(AnonRateThrottle):
    scope = "recherche"


class EvenementThrottle(AnonRateThrottle):
    scope = "evenements"


def _contexte_visiteur(request):
    """Identifiant anonyme (en-tête X-Visiteur-Id) et utilisateur connecté éventuel."""
    visiteur_id = request.headers.get("X-Visiteur-Id", "").strip()[:64]
    utilisateur = request.user if request.user and request.user.is_authenticated else None
    return visiteur_id, utilisateur


def _serialiser(ids, tenant, request):
    """Retourne les produits publics dans l'ordre exact des ids fournis."""
    produits = (
        Produit.objects.filter(id__in=ids, tenant=tenant)
        .select_related("categorie")
        .prefetch_related("images", "variantes")
    )
    par_id = {p.id: p for p in produits}
    ordonnes = [par_id[i] for i in ids if i in par_id]
    return ProduitPublicSerializer(ordonnes, many=True, context={"request": request}).data


class RechercheProduitsView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [RechercheThrottle]

    def get(self, request, sous_domaine):
        tenant = get_object_or_404(Tenant, sous_domaine=sous_domaine)
        requete = request.query_params.get("q", "").strip()[:200]

        if len(requete) < 2:
            return Response({"results": [], "count": 0, "recommandations": []})

        visiteur_id, utilisateur = _contexte_visiteur(request)
        ids = rechercher_produits(tenant, requete)
        ids_reco = produits_recommandes(tenant, ids, visiteur_id, utilisateur)

        results = _serialiser(ids, tenant, request)
        return Response({
            "results": results,
            "count": len(results),
            "recommandations": _serialiser(ids_reco, tenant, request),
        })


class ProduitsSimilairesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, sous_domaine, slug):
        tenant = get_object_or_404(Tenant, sous_domaine=sous_domaine)
        produit = get_object_or_404(
            Produit, tenant=tenant, slug=slug, statut="publie", est_supprime=False
        )
        ids = produits_similaires(tenant, produit)
        return Response({"results": _serialiser(ids, tenant, request)})


class PourVousView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [RechercheThrottle]

    def get(self, request, sous_domaine):
        tenant = get_object_or_404(Tenant, sous_domaine=sous_domaine)
        visiteur_id, utilisateur = _contexte_visiteur(request)
        ids, personnalise = produits_pour_vous(tenant, visiteur_id, utilisateur)
        return Response({"results": _serialiser(ids, tenant, request), "personnalise": personnalise})


class EvenementView(APIView):
    """Enregistre une action du visiteur. L'achat n'est jamais envoyé par le navigateur."""
    permission_classes = [AllowAny]
    throttle_classes = [EvenementThrottle]

    def post(self, request, sous_domaine):
        tenant = get_object_or_404(Tenant, sous_domaine=sous_domaine)
        visiteur_id, utilisateur = _contexte_visiteur(request)
        type_ = request.data.get("type")

        if type_ not in ("vue", "recherche", "ajout_panier"):
            return Response({"detail": "Type d'événement invalide."}, status=status.HTTP_400_BAD_REQUEST)
        if not visiteur_id and utilisateur is None:
            return Response({"detail": "Visiteur non identifié."}, status=status.HTTP_400_BAD_REQUEST)

        produit, requete = None, ""
        if type_ == "recherche":
            requete = str(request.data.get("requete", "")).strip()
            if len(requete) < 2:
                return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            try:
                produit_id = uuid.UUID(str(request.data.get("produit_id")))
            except ValueError:
                return Response({"detail": "Produit invalide."}, status=status.HTTP_400_BAD_REQUEST)
            produit = Produit.objects.filter(
                id=produit_id, tenant=tenant, statut="publie", est_supprime=False
            ).first()
            if produit is None:
                return Response({"detail": "Produit introuvable."}, status=status.HTTP_404_NOT_FOUND)

        enregistrer_evenement(tenant, type_, produit, requete, visiteur_id, utilisateur)
        return Response(status=status.HTTP_204_NO_CONTENT)