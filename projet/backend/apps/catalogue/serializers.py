from rest_framework import serializers
from .models import Categorie, Produit, ImageProduit, VarianteProduit


class CategorieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorie
        fields = ["id", "nom", "slug", "description", "ordre", "parent"]
        read_only_fields = ["id", "slug"]


class ImageProduitSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImageProduit
        fields = ["id", "image", "est_principale", "ordre"]
        read_only_fields = ["id"]


class VarianteProduitSerializer(serializers.ModelSerializer):
    class Meta:
        model = VarianteProduit
        fields = ["id", "taille", "couleur", "sku", "stock", "prix_supplement"]


class ProduitSerializer(serializers.ModelSerializer):
    images = ImageProduitSerializer(many=True, read_only=True)
    variantes = VarianteProduitSerializer(many=True, read_only=True)
    prix_actuel = serializers.ReadOnlyField()
    en_stock = serializers.ReadOnlyField()

    class Meta:
        model = Produit
        fields = [
            "id", "categorie", "nom", "slug", "description", "marque", "tags",
            "prix", "prix_promo", "prix_achat", "promo_debut", "promo_fin", "prix_actuel",
            "sku", "stock", "gestion_stock", "seuil_alerte_stock", "poids", "en_stock",
            "meta_description",
            "note_moyenne", "nombre_avis", "nombre_ventes", "est_mis_en_avant",
            "statut", "date_publication", "date_creation", "date_modification",
            "images", "variantes",
        ]
        read_only_fields = [
            "id", "slug", "note_moyenne", "nombre_avis", "nombre_ventes",
            "date_publication", "date_creation", "date_modification",
        ]

# API Gemini pour les complétions de texte
class GenerateDescriptionSerializer(serializers.Serializer):
    nom = serializers.CharField(max_length=255, allow_blank=False)