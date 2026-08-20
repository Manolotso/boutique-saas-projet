from django.contrib import admin
from .models import Paiement, TauxChange


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = ("commande", "operateur", "montant", "montant_net", "statut", "date_transaction")
    list_filter = ("statut", "operateur")
    search_fields = ("commande__numero_commande", "reference_transaction")
    readonly_fields = ("montant_frais", "montant_net", "donnees_brutes", "date_transaction", "date_modification")


@admin.register(TauxChange)
class TauxChangeAdmin(admin.ModelAdmin):
    list_display = ("code_devise", "taux", "date_maj")