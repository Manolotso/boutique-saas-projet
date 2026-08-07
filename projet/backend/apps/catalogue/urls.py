from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategorieViewSet, ProduitViewSet, ProduitsPublicsView

router = DefaultRouter()
router.register("produits", ProduitViewSet, basename="produits")
router.register("categories", CategorieViewSet, basename="categories")

app_name = "catalogue"

urlpatterns = [
    path("", include(router.urls)),
    path("boutiques/<slug:sous_domaine>/produits/", ProduitsPublicsView.as_view()),
]