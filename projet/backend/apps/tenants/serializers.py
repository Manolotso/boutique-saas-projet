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