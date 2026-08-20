from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CreerCommandeView, MesCommandesView, CommandeDetailView, CommandeCommercantViewSet

router = DefaultRouter()
router.register("gestion", CommandeCommercantViewSet, basename="commandes-gestion")

app_name = "commandes"

urlpatterns = [
    path("", include(router.urls)),
    path("mes-commandes/", MesCommandesView.as_view()),
    path("suivi/<str:numero_commande>/", CommandeDetailView.as_view()),
    path("boutiques/<slug:sous_domaine>/commander/", CreerCommandeView.as_view()),
]