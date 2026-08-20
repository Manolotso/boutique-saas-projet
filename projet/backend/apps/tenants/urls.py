from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MaBoutiqueView, BoutiquePubliqueView, TenantAdminViewSet

router = DefaultRouter()
router.register("admin/boutiques", TenantAdminViewSet, basename="admin-boutiques")

app_name = "tenants"

urlpatterns = [             
    path("ma-boutique/", MaBoutiqueView.as_view()),
    path("boutiques/<slug:sous_domaine>/", BoutiquePubliqueView.as_view()),
    path("", include(router.urls)),
]