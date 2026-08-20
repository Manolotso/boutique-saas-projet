from django.utils import timezone
from rest_framework import viewsets, generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from apps.comptes.permissions import EstCommercant, EstProprietaireBoutique
from .models import Categorie, Produit
from .serializers import CategorieSerializer, ProduitSerializer
from django.utils.text import slugify
from rest_framework.exceptions import ValidationError
from google import genai
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import UserRateThrottle
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from .models import ImageProduit
from .serializers import ImageProduitSerializer
from django_filters.rest_framework import DjangoFilterBackend
from .serializers import ProduitPublicSerializer

from .serializers import GenerateDescriptionSerializer

import logging
logger = logging.getLogger(__name__)



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

    serializer_class = ProduitPublicSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["categorie"]

    def get_queryset(self):
        sous_domaine = self.kwargs["sous_domaine"]
        return Produit.objects.filter(
            tenant__sous_domaine=sous_domaine, statut="publie", est_supprime=False
        ).select_related("categorie").prefetch_related("images", "variantes")

# API Gemini pour les complétions description de produit
class DescriptionGenerationThrottle(UserRateThrottle):
    scope = "description_generation"


class GenerateDescriptionView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [DescriptionGenerationThrottle]

    def post(self, request):
        serializer = GenerateDescriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        nom = serializer.validated_data["nom"]

        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            response = client.models.generate_content(
    model="gemini-flash-latest",
    contents=(
        f"Tu es rédacteur de fiches produit pour une boutique en ligne. "
        f"Rédige une description claire et informative pour ce produit : \"{nom}\".\n\n"
        f"Consignes :\n"
        f"- 2 à 3 phrases maximum, en français\n"
        f"- Décris le produit et son usage concret, pas un discours de vente\n"
        f"- Ton neutre et clair, comme une fiche produit, pas publicitaire\n"
        f"- N'utilise aucun superlatif (\"incroyable\", \"exceptionnel\", \"le meilleur\", "
        f"\"parfait\") ni formule d'accroche commerciale\n"
        f"- N'invente aucune caractéristique technique précise (taille, matière, prix, marque) "
        f"que tu ne connais pas à partir du nom du produit\n\n"
        f"Réponds uniquement avec la description finale, sans titre, sans guillemets, "
        f"sans préambule ni commentaire."
    ),
)

            return Response(
                {"description": response.text}, status=status.HTTP_200_OK
            )

        except Exception as e:
            logger.exception("Erreur génération description Gemini")  # <-- affiche le traceback complet
            return Response(
                {"error": "Erreur lors de la génération de la description.", "detail": str(e)},  # <-- temporaire, pour debug
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


#################
class ImageProduitListCreateView(generics.ListCreateAPIView):
    """Liste et upload des images d'un produit précis."""
    serializer_class = ImageProduitSerializer
    permission_classes = [IsAuthenticated, EstCommercant]
    parser_classes = [MultiPartParser, FormParser]

    def get_produit(self):
        return get_object_or_404(
            Produit,
            id=self.kwargs["produit_id"],
            tenant=self.request.user.boutique,
            est_supprime=False,
        )

    def get_queryset(self):
        return ImageProduit.objects.filter(produit=self.get_produit())

    def perform_create(self, serializer):
        produit = self.get_produit()
        est_principale = serializer.validated_data.get("est_principale", False)
        if est_principale:
            ImageProduit.objects.filter(produit=produit, est_principale=True).update(est_principale=False)
        elif not ImageProduit.objects.filter(produit=produit).exists():
            est_principale = True  # première image du produit
        serializer.save(produit=produit, est_principale=est_principale)


class ImageProduitDetailView(generics.DestroyAPIView):
    """Suppression d'une image (tenant vérifié via la relation produit)."""
    serializer_class = ImageProduitSerializer
    permission_classes = [IsAuthenticated, EstCommercant]
    lookup_url_kwarg = "image_id"

    def get_queryset(self):
        return ImageProduit.objects.filter(produit__tenant=self.request.user.boutique)


class DefinirImagePrincipaleView(APIView):
    permission_classes = [IsAuthenticated, EstCommercant]

    def post(self, request, image_id):
        image = get_object_or_404(
            ImageProduit, id=image_id, produit__tenant=request.user.boutique
        )
        ImageProduit.objects.filter(produit=image.produit, est_principale=True).update(est_principale=False)
        image.est_principale = True
        image.save(update_fields=["est_principale"])
        return Response(ImageProduitSerializer(image).data, status=status.HTTP_200_OK)

### API Gemini pour la génération de description de catégorie
class GenerateDescriptionCategorieView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [DescriptionGenerationThrottle]

    def post(self, request):
        serializer = GenerateDescriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        nom = serializer.validated_data["nom"]

        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            response = client.models.generate_content(
                model="gemini-flash-latest",
                contents=(
                    f"Rédige une courte description (2-3 phrases, en français) "
                    f"pour cette catégorie de produits d'une boutique en ligne : \"{nom}\". "
                    f"La description doit donner envie de parcourir les produits de cette catégorie. "
                    f"Réponds uniquement avec la description, sans préambule."
                ),
            )

            return Response(
                {"description": response.text}, status=status.HTTP_200_OK
            )

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ProduitPublicDetailView(generics.RetrieveAPIView):
    serializer_class = ProduitPublicSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    lookup_url_kwarg = "slug"

    def get_queryset(self):
        sous_domaine = self.kwargs["sous_domaine"]
        return Produit.objects.filter(
            tenant__sous_domaine=sous_domaine, statut="publie", est_supprime=False
        )