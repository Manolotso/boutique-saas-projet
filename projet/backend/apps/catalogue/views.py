from django.utils import timezone
from rest_framework import viewsets, generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from apps.comptes.permissions import EstCommercant, EstProprietaireBoutique
from .models import Categorie, Produit
from .serializers import CategorieSerializer, ProduitSerializer
from django.utils.text import slugify
from rest_framework.exceptions import ValidationError


class CategorieViewSet(viewsets.ModelViewSet):
    serializer_class = CategorieSerializer
    permission_classes = [IsAuthenticated, EstCommercant]

    def get_queryset(self):
        return Categorie.objects.filter(tenant=self.request.user.boutique)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.boutique)

    
class ProduitViewSet(viewsets.ModelViewSet):
    serializer_class = ProduitSerializer
    permission_classes = [IsAuthenticated, EstCommercant, EstProprietaireBoutique]

    def get_queryset(self):
        return Produit.objects.filter(tenant=self.request.user.boutique, est_supprime=False)

    def perform_create(self, serializer):
        tenant = self.request.user.boutique
        nom = serializer.validated_data.get("nom", "")
        slug = slugify(nom)

        if Produit.objects.filter(tenant=tenant, slug=slug).exists():
            raise ValidationError(
                {"nom": "Tu as déjà un produit avec un nom identique ou très proche. "
                        "Choisis un nom différent, ou ajoute une variante à ton produit existant."}
            )

        serializer.save(tenant=tenant, slug=slug)

    def perform_destroy(self, instance):
        instance.est_supprime = True
        instance.date_suppression = timezone.now()
        instance.save()


class ProduitsPublicsView(generics.ListAPIView):
    """Vitrine publique : liste des produits publiés d'une boutique donnée."""

    serializer_class = ProduitSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        sous_domaine = self.kwargs["sous_domaine"]
        return Produit.objects.filter(
            tenant__sous_domaine=sous_domaine, statut="publie", est_supprime=False
        )