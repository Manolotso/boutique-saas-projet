from rest_framework import serializers
from .models import Plan, Abonnement, HistoriqueAbonnement, Facture
from .services import CODE_PLAN_ESSAI, usage_de


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = [
            "id", "code", "nom", "description",
            "prix_mensuel", "prix_annuel",
            "nombre_produits_max", "commission_transaction", "fonctionnalites",
            "duree_essai_jours",
        ]
        read_only_fields = fields


class HistoriqueAbonnementSerializer(serializers.ModelSerializer):
    ancien_plan_nom = serializers.CharField(source="ancien_plan.nom", read_only=True)
    nouveau_plan_nom = serializers.CharField(source="nouveau_plan.nom", read_only=True)

    class Meta:
        model = HistoriqueAbonnement
        fields = ["ancien_plan_nom", "nouveau_plan_nom", "commentaire", "date"]
        read_only_fields = fields


class FactureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Facture
        fields = ["numero_facture", "montant", "statut", "periode_debut", "periode_fin", "date_emission"]
        read_only_fields = fields


class AbonnementSerializer(serializers.ModelSerializer):
    plan = PlanSerializer(read_only=True)
    historique = HistoriqueAbonnementSerializer(many=True, read_only=True)
    factures = FactureSerializer(many=True, read_only=True)
    boutique_nom = serializers.CharField(source="tenant.nom_boutique", read_only=True)
    jours_restants_essai = serializers.SerializerMethodField()
    usage = serializers.SerializerMethodField()

    class Meta:
        model = Abonnement
        fields = [
            "id", "boutique_nom", "plan", "statut", "periodicite",
            "renouvellement_automatique", "date_prochain_renouvellement",
            "date_fin_essai", "jours_restants_essai",
            "date_debut", "date_fin",
            "usage",
            "historique", "factures",
        ]
        read_only_fields = fields

    def get_jours_restants_essai(self, obj):
        if obj.statut != "essai" or not obj.date_fin_essai:
            return None
        from django.utils import timezone
        delta = (obj.date_fin_essai - timezone.now().date()).days
        return max(delta, 0)

    def get_usage(self, obj):
        # Calculé seulement pour le commerçant qui consulte son propre abonnement (la liste du
        # SuperAdmin n'en a pas besoin, et chaque calcul interroge la base).
        if not self.context.get("avec_usage"):
            return None
        return usage_de(obj)


class ChangerPlanSerializer(serializers.Serializer):
    # Le plan d'essai ne se choisit pas à la main : sinon un essai terminé pourrait être recommencé
    # indéfiniment en repassant sur le plan gratuit.
    plan_code = serializers.SlugRelatedField(
        slug_field="code",
        queryset=Plan.objects.filter(est_actif=True).exclude(code=CODE_PLAN_ESSAI),
        source="plan",
    )
    periodicite = serializers.ChoiceField(choices=Plan.PERIODICITE_CHOICES, default="mensuel")