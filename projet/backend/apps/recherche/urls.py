from django.urls import path

from .views import (
    CatalogueBoutiqueView,
    DecouvrirView,
    EvenementView,
    PourVousView,
    ProduitsSimilairesView,
    RechercheProduitsView,
    DecouvrirRechercheView,
)

urlpatterns = [
    path("decouvrir/", DecouvrirView.as_view(), name="decouvrir"),
    path("decouvrir/recherche/", DecouvrirRechercheView.as_view(), name="decouvrir-recherche"),
    path("<str:sous_domaine>/produits/", RechercheProduitsView.as_view(), name="recherche-produits"),
    path(
        "<str:sous_domaine>/produits/<str:slug>/similaires/",
        ProduitsSimilairesView.as_view(),
        name="produits-similaires",
    ),
    path("<str:sous_domaine>/pour-vous/", PourVousView.as_view(), name="pour-vous"),
    path("<str:sous_domaine>/evenements/", EvenementView.as_view(), name="evenements"),
    path("<str:sous_domaine>/catalogue/", CatalogueBoutiqueView.as_view(), name="catalogue-boutique"),
]