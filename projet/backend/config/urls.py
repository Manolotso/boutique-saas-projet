from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Routes des apps métier (à créer au fur et à mesure)
    path("api/tenants/", include("apps.tenants.urls")),
    path("api/catalogue/", include("apps.catalogue.urls")),
    path("api/commandes/", include("apps.commandes.urls")),
    path("api/paiements/", include("apps.paiements.urls")),
    path("api/abonnements/", include("apps.abonnements.urls")),
]
