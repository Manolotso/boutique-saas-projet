from django.contrib import admin
from .models import Commande, HistoriqueStatutCommande, LigneCommande


class LigneCommandeInline(admin.TabularInline):
    model = LigneCommande
    extra = 0
    readonly_fields = ("nom_produit", "variante_label", "prix_unitaire", "quantite")


class HistoriqueInline(admin.TabularInline):
    model = HistoriqueStatutCommande
    extra = 0
    readonly_fields = ("statut", "statut_precedent", "commentaire", "date")


@admin.register(Commande)
class CommandeAdmin(admin.ModelAdmin):
    list_display = ("numero_commande", "tenant", "client", "statut", "montant_total", "date_commande")
    list_filter = ("statut", "mode_livraison", "tenant")
    search_fields = ("numero_commande", "client__email", "nom_destinataire")
    readonly_fields = ("numero_commande", "date_commande", "date_modification")
    inlines = [LigneCommandeInline, HistoriqueInline]