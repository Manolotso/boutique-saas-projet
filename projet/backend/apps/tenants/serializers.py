from rest_framework import serializers
from .models import Tenant


class TenantSerializer(serializers.ModelSerializer):
    # Lat/lng en FloatField : Leaflet envoie des coordonnées avec beaucoup de décimales,
    # un DecimalField(decimal_places=6) les refuserait. On arrondit à 6 décimales (~10 cm).
    boutique_lat = serializers.FloatField(required=False, allow_null=True, min_value=-90, max_value=90)
    boutique_lng = serializers.FloatField(required=False, allow_null=True, min_value=-180, max_value=180)

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
            "livraison_active", "boutique_lat", "boutique_lng",
            "frais_livraison_base", "frais_par_km", "rayon_max_km", "seuil_livraison_gratuite",
        ]
        read_only_fields = [
            "id", "sous_domaine", "statut",
            "est_verifie", "date_verification",
            "note_moyenne", "nombre_avis", "nombre_ventes",
            "date_creation", "date_modification",
        ]
        extra_kwargs = {
            "frais_livraison_base": {"min_value": 0},
            "frais_par_km": {"min_value": 0},
            "rayon_max_km": {"min_value": 0},
            "seuil_livraison_gratuite": {"min_value": 0},
        }

    def validate_boutique_lat(self, valeur):
        return None if valeur is None else round(valeur, 6)

    def validate_boutique_lng(self, valeur):
        return None if valeur is None else round(valeur, 6)

    def validate(self, attrs):
        """On ne peut pas activer la livraison sans avoir placé la boutique sur la carte."""

        def valeur(champ):
            if champ in attrs:
                return attrs[champ]
            return getattr(self.instance, champ, None) if self.instance else None

        if valeur("livraison_active") and (valeur("boutique_lat") is None or valeur("boutique_lng") is None):
            raise serializers.ValidationError(
                {"livraison_active": "Place ta boutique sur la carte avant d'activer la livraison."}
            )
        return attrs


class TenantPublicSerializer(serializers.ModelSerializer):
    """Version publique, sans les champs sensibles (NIF/STAT, etc.), pour la vitrine."""

    # Nombres (et non chaînes) pour pouvoir les donner directement à Leaflet.
    boutique_lat = serializers.FloatField(read_only=True)
    boutique_lng = serializers.FloatField(read_only=True)
    rayon_max_km = serializers.FloatField(read_only=True)

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
            "livraison_active", "boutique_lat", "boutique_lng", "rayon_max_km",
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


class EstimationLivraisonSerializer(serializers.Serializer):
    """Entrée de l'endpoint public d'estimation : le point cliqué sur la carte."""

    lat = serializers.FloatField(min_value=-90, max_value=90)
    lng = serializers.FloatField(min_value=-180, max_value=180)
    # Optionnel : permet d'afficher « livraison offerte » dès le panier. Le vrai calcul
    # est refait côté serveur à la création de la commande.
    montant_sous_total = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)