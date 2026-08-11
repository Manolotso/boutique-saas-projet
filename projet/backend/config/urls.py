from django.contrib import admin
from django.urls import path, include
from apps.comptes.views import CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    

    # Routes des apps métier (à créer au fur et à mesure)
    path("api/tenants/", include("apps.tenants.urls")),
    path("api/catalogue/", include("apps.catalogue.urls")),
    path("api/commandes/", include("apps.commandes.urls")),
    path("api/paiements/", include("apps.paiements.urls")),
    path("api/abonnements/", include("apps.abonnements.urls")),
    path("api/comptes/", include("apps.comptes.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
