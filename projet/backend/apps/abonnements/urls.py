from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ListerPlansView, MonAbonnementView, ChangerPlanView, AbonnementsAdminViewSet

router = DefaultRouter()
router.register("admin/abonnements", AbonnementsAdminViewSet, basename="admin-abonnements")

app_name = "abonnements"

urlpatterns = [
    path("plans/", ListerPlansView.as_view()),
    path("mon-abonnement/", MonAbonnementView.as_view()),
    path("mon-abonnement/changer-plan/", ChangerPlanView.as_view()),
    path("", include(router.urls)),
]