from django.contrib import admin
from .models import Categorie, Produit, ImageProduit, VarianteProduit


class ImageProduitInline(admin.TabularInline):
    model = ImageProduit
    extra = 1


class VarianteProduitInline(admin.TabularInline):
    model = VarianteProduit
    extra = 1


@admin.register(Produit)
class ProduitAdmin(admin.ModelAdmin):
    list_display = ("nom", "tenant", "categorie", "prix", "stock", "statut", "est_mis_en_avant")
    list_filter = ("statut", "gestion_stock", "est_mis_en_avant", "tenant")
    search_fields = ("nom", "sku", "tenant__nom_boutique")
    inlines = [ImageProduitInline, VarianteProduitInline]
    readonly_fields = ("date_creation", "date_modification", "note_moyenne", "nombre_avis", "nombre_ventes")


@admin.register(Categorie)
class CategorieAdmin(admin.ModelAdmin):
    list_display = ("nom", "tenant", "parent", "ordre")
    list_filter = ("tenant",)
    search_fields = ("nom",)