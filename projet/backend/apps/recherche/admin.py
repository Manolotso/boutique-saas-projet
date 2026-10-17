from django.contrib import admin

from .models import ProduitEmbedding


@admin.register(ProduitEmbedding)
class ProduitEmbeddingAdmin(admin.ModelAdmin):
    list_display = ("produit", "tenant", "modele", "date_maj")
    exclude = ("vecteur",)
    readonly_fields = ("produit", "tenant", "texte_hash", "modele", "date_maj")

    def has_add_permission(self, request):
        return False