from rest_framework import serializers
from .models import Tenant


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = [
            "id", "nom_boutique", "sous_domaine", "devise", "statut",
            "logo", "banniere", "couleur_primaire", "couleur_secondaire",
            "description", "slogan",
            "numero_nif", "numero_stat", "est_verifie", "date_verification",
            "telephone", "whatsapp", "adresse", "ville", "reseaux_sociaux",
            "horaires_ouverture", "langue_preferee", "moyens_paiement_actifs",
            "note_moyenne", "nombre_avis", "nombre_ventes",
            "etape_onboarding", "date_creation", "date_modification",
        ]
        read_only_fields = [
            "id", "sous_domaine", "statut",
            "est_verifie", "date_verification",
            "note_moyenne", "nombre_avis", "nombre_ventes",
            "date_creation", "date_modification",
        ]


class TenantPublicSerializer(serializers.ModelSerializer):
    """Version publique, sans les champs sensibles (NIF/STAT, etc.), pour la vitrine."""

    class Meta:
        model = Tenant
        fields = [
            "id", "nom_boutique", "sous_domaine", "devise",
            "logo", "banniere", "couleur_primaire", "couleur_secondaire",
            "description", "slogan",
            "est_verifie",
            "telephone", "whatsapp", "adresse", "ville", "reseaux_sociaux",
            "horaires_ouverture", "langue_preferee", "moyens_paiement_actifs",
            "note_moyenne", "nombre_avis", "nombre_ventes",
        ]


class TenantAdminSerializer(serializers.ModelSerializer):
    """Vue complète d'une boutique, réservée au SuperAdmin — inclut les champs sensibles."""

    commercant_email = serializers.CharField(source="commercant.email", read_only=True)
    nombre_produits = serializers.IntegerField(source="produits.count", read_only=True)
    nombre_commandes = serializers.IntegerField(source="commandes.count", read_only=True)

    class Meta:
        model = Tenant
        fields = [
            "id", "nom_boutique", "sous_domaine", "commercant_email",
            "statut", "est_verifie", "date_verification",
            "numero_nif", "numero_stat",
            "ville", "telephone",
            "note_moyenne", "nombre_avis", "nombre_ventes",
            "nombre_produits", "nombre_commandes",
            "date_creation",
        ]
        read_only_fields = fields