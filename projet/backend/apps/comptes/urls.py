from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EnvoyerCodeView, VerifierCodeView, FinaliserInscriptionView, CustomUserViewSet

router = DefaultRouter()
router.register("utilisateurs", CustomUserViewSet, basename="utilisateurs")

app_name = "comptes"

urlpatterns = [
    path("inscription/envoyer-code/", EnvoyerCodeView.as_view()),
    path("inscription/verifier-code/", VerifierCodeView.as_view()),
    path("inscription/finaliser/", FinaliserInscriptionView.as_view()),
    path("", include(router.urls)),
]