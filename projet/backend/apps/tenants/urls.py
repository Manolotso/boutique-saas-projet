from django.urls import path
from .views import MaBoutiqueView

app_name = "tenants"

urlpatterns = [
    path("ma-boutique/", MaBoutiqueView.as_view()),
]