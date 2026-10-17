from django.urls import path
from .views import TauxChangeView, InitierPaiementView, ConfirmerPaiementView, StatutPaiementView

app_name = "paiements"

urlpatterns = [
    path("taux-change/", TauxChangeView.as_view(), name="taux-change"),
     path("commandes/<str:numero_commande>/initier/", InitierPaiementView.as_view()),
    path("commandes/<str:numero_commande>/statut/", StatutPaiementView.as_view()),
    path("commandes/<str:numero_commande>/confirmer/", ConfirmerPaiementView.as_view()),
]