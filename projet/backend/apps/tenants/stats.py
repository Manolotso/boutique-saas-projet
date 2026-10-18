from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Tenant

# Commandes comptées dans le chiffre d'affaires
STATUTS_VALIDES = ["payee", "expediee", "livree"]


class EstSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and getattr(u, "role", None) == "superadmin")


class StatistiquesAdminView(APIView):
    permission_classes = [EstSuperAdmin]

    def get(self, request):
        from apps.catalogue.models import Produit
        from apps.commandes.models import Commande
        from apps.recherche.models import Evenement, ProduitEmbedding

        User = get_user_model()
        maintenant = timezone.now()
        depuis = maintenant - timedelta(days=29)

        boutiques = Tenant.objects.filter(est_supprime=False)
        par_statut = {l["statut"]: l["n"] for l in boutiques.values("statut").annotate(n=Count("id"))}
        par_role = {l["role"]: l["n"] for l in User.objects.values("role").annotate(n=Count("id"))}

        produits = Produit.objects.filter(est_supprime=False)
        publies = produits.filter(statut="publie")

        valides = Commande.objects.filter(statut__in=STATUTS_VALIDES)
        ca_total = valides.aggregate(t=Sum("montant_total"))["t"] or 0
        ca_30j = valides.filter(date_commande__gte=depuis).aggregate(t=Sum("montant_total"))["t"] or 0

        # Série des 30 derniers jours (jours sans commande = 0)
        lignes = (
            Commande.objects.filter(date_commande__gte=depuis)
            .annotate(jour=TruncDate("date_commande"))
            .values("jour")
            .annotate(
                commandes=Count("id"),
                ca=Sum("montant_total", filter=Q(statut__in=STATUTS_VALIDES)),
            )
        )
        par_jour = {l["jour"]: l for l in lignes}
        serie = []
        for i in range(30):
            jour = (depuis + timedelta(days=i)).date()
            l = par_jour.get(jour)
            serie.append({
                "jour": jour.isoformat(),
                "commandes": l["commandes"] if l else 0,
                "ca": float(l["ca"] or 0) if l else 0,
            })

        top = (
            boutiques.annotate(
                ca=Sum("commandes__montant_total", filter=Q(commandes__statut__in=STATUTS_VALIDES)),
                nb=Count("commandes", filter=Q(commandes__statut__in=STATUTS_VALIDES)),
            )
            .filter(nb__gt=0)
            .order_by("-ca")[:5]
        )

        recentes = Commande.objects.select_related("tenant").order_by("-date_commande")[:6]

        return Response({
            "boutiques": {
                "total": boutiques.count(),
                "actif": par_statut.get("actif", 0),
                "en_essai": par_statut.get("en_essai", 0),
                "suspendu": par_statut.get("suspendu", 0),
                "verifiees": boutiques.filter(est_verifie=True).count(),
            },
            "utilisateurs": {
                "total": sum(par_role.values()),
                "client": par_role.get("client", 0),
                "commercant": par_role.get("commercant", 0),
                "superadmin": par_role.get("superadmin", 0),
                "nouveaux_30j": User.objects.filter(date_joined__gte=depuis).count(),
            },
            "produits": {
                "total": produits.count(),
                "publies": publies.count(),
                "indexes": ProduitEmbedding.objects.filter(produit__in=publies).count(),
            },
            "commandes": {
                "total": Commande.objects.count(),
                "en_attente": Commande.objects.filter(statut="en_attente").count(),
                "annulees": Commande.objects.filter(statut="annulee").count(),
                "ca_total": float(ca_total),
                "ca_30j": float(ca_30j),
            },
            "recommandation": {
                "evenements_30j": Evenement.objects.filter(date__gte=depuis).count(),
            },
            "serie": serie,
            "top_boutiques": [
                {"nom": t.nom_boutique, "ca": float(t.ca or 0), "commandes": t.nb} for t in top
            ],
            "commandes_recentes": [
                {
                    "numero": c.numero_commande,
                    "boutique": c.tenant.nom_boutique,
                    "montant": float(c.montant_total),
                    "statut": c.statut,
                    "date": c.date_commande.isoformat(),
                }
                for c in recentes
            ],
        })