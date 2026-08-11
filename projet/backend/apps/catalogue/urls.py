from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategorieViewSet, ProduitViewSet, ProduitsPublicsView, GenerateDescriptionView, ImageProduitListCreateView, ImageProduitDetailView, DefinirImagePrincipaleView


router = DefaultRouter()
router.register("produits", ProduitViewSet, basename="produits")
router.register("categories", CategorieViewSet, basename="categories")

app_name = "catalogue"

urlpatterns = [
    path("", include(router.urls)),
    path("boutiques/<slug:sous_domaine>/produits/", ProduitsPublicsView.as_view()),
    path("generate-description/", GenerateDescriptionView.as_view(), name="generate_description"),
    path("produits/<uuid:produit_id>/images/", ImageProduitListCreateView.as_view(), name="produit-images"),
    path("images/<uuid:image_id>/", ImageProduitDetailView.as_view(), name="image-detail"),
    path("images/<uuid:image_id>/definir-principale/", DefinirImagePrincipaleView.as_view(), name="image-principale"),
]