from django.core.mail import send_mail
from rest_framework.views import APIView
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import CustomUser, CodeVerification
from django.utils.text import slugify
from apps.tenants.models import Tenant
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from .permissions import EstSuperAdmin
from .serializers import CustomUserSerializer




class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class EnvoyerCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        role = request.data.get("role")

        if not email or role not in [CustomUser.Role.CLIENT, CustomUser.Role.COMMERCANT]:
            return Response({"detail": "Email et rôle valides requis."}, status=400)

        if CustomUser.objects.filter(email=email).exists():
            return Response({"detail": "Un compte existe déjà avec cet email."}, status=400)

        # On supprime les anciens codes non utilisés pour cet email avant d'en créer un nouveau
        CodeVerification.objects.filter(email=email).delete()

        code = CodeVerification.generer_code()
        CodeVerification.objects.create(email=email, code=code, role=role)

        send_mail(
            subject="Votre code de vérification",
            message=f"Votre code de vérification est : {code}\nIl expire dans 15 minutes.",
            from_email=None,
            recipient_list=[email],
        )

        return Response({"detail": "Code envoyé."}, status=200)


class VerifierCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        code = request.data.get("code")

        try:
            verification = CodeVerification.objects.filter(email=email).latest("date_creation")
        except CodeVerification.DoesNotExist:
            return Response({"detail": "Aucun code trouvé pour cet email."}, status=400)

        if verification.est_expire():
            return Response({"detail": "Ce code a expiré."}, status=400)

        if verification.code != code:
            return Response({"detail": "Code incorrect."}, status=400)

        verification.est_verifie = True
        verification.save()

        return Response({"detail": "Code vérifié."}, status=200)


class FinaliserInscriptionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        code = request.data.get("code")
        username = request.data.get("username")
        password = request.data.get("password")
        nom_boutique = request.data.get("nom_boutique")

        if not all([email, code, username, password]):
            return Response({"detail": "Tous les champs sont requis."}, status=400)

        try:
            verification = CodeVerification.objects.filter(email=email).latest("date_creation")
        except CodeVerification.DoesNotExist:
            return Response({"detail": "Aucune vérification trouvée pour cet email."}, status=400)

        if not verification.est_verifie or verification.est_expire():
            return Response({"detail": "Vérification invalide ou expirée."}, status=400)

        if verification.code != code:
            return Response({"detail": "Code incorrect."}, status=400)

        if CustomUser.objects.filter(username=username).exists():
            return Response({"detail": "Ce nom d'utilisateur est déjà pris."}, status=400)

        if verification.role == CustomUser.Role.COMMERCANT and not nom_boutique:
            return Response({"detail": "Le nom de la boutique est requis pour un compte commerçant."}, status=400)

        user = CustomUser.objects.create_user(
            username=username, email=email, password=password, role=verification.role
        )

        if verification.role == CustomUser.Role.COMMERCANT:
            sous_domaine = self._generer_sous_domaine_unique(nom_boutique)
            Tenant.objects.create(
                commercant=user,
                nom_boutique=nom_boutique,
                sous_domaine=sous_domaine,
            )

        verification.delete()

        refresh = CustomTokenObtainPairSerializer.get_token(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "role": user.role,
        }, status=201)

    def _generer_sous_domaine_unique(self, nom_boutique):
        base = slugify(nom_boutique)
        sous_domaine = base
        compteur = 1
        while Tenant.objects.filter(sous_domaine=sous_domaine).exists():
            sous_domaine = f"{base}-{compteur}"
            compteur += 1
        return sous_domaine

class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all().order_by("-date_joined")
    serializer_class = CustomUserSerializer
    permission_classes = [EstSuperAdmin]