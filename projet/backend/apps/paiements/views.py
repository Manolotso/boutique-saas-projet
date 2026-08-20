# apps/paiements/views.py

from django.core.cache import cache
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import TauxChange
import random
import uuid
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.commandes.models import Commande
from .models import Paiement
from .serializers import PaiementSerializer
from django.utils import timezone
from datetime import timedelta

CLE_CACHE = "taux_change_mga"
DUREE_CACHE_SECONDES = 60 * 60 * 6  # 6h — la base ne change qu'1x/jour, ce cache évite juste
                                     # de re-sérialiser toute la table à chaque requête publique


class TauxChangeView(APIView):
    """Expose les derniers taux de change connus depuis l'Ariary. Lecture publique."""

    permission_classes = [AllowAny]

    def get(self, request):
        donnees = cache.get(CLE_CACHE)
        if donnees is None:
            taux = TauxChange.objects.all()
            donnees = {
                "taux": {t.code_devise: float(t.taux) for t in taux},
                "date_maj": max((t.date_maj for t in taux), default=None),
            }
            cache.set(CLE_CACHE, donnees, DUREE_CACHE_SECONDES)
        return Response(donnees)

class InitierPaiementView(APIView):
    """Simule l'envoi d'une demande de paiement à un opérateur Mobile Money
    (génère et envoie un code de confirmation par email, comme un OTP reçu par SMS/USSD)."""

    permission_classes = [IsAuthenticated]

    def post(self, request, numero_commande):
        commande = get_object_or_404(Commande, numero_commande=numero_commande, client=request.user)

        if commande.statut != "en_attente":
            return Response({"detail": "Cette commande n'est plus en attente de paiement."}, status=400)

        operateur = request.data.get("operateur")
        if operateur not in dict(Paiement.OPERATEUR_CHOICES):
            return Response({"detail": "Opérateur invalide."}, status=400)

        code = f"{random.randint(0, 999999):06d}"

        # Groupe B : chaque tentative crée un nouveau Paiement plutôt que d'écraser le précédent
        paiement = Paiement.objects.create(
            commande=commande,
            operateur=operateur,
            montant=commande.montant_total,
            statut="en_attente",
            code_confirmation=code,
            date_expiration_code=timezone.now() + timedelta(minutes=5),
        )

        send_mail(
            subject="Code de confirmation de paiement",
            message=(
                f"Code de confirmation pour la commande {commande.numero_commande} "
                f"({commande.montant_total} Ar) via {operateur} : {code}\n"
                "Ce code expire dans 5 minutes.\n\n"
                "Environnement de démonstration — aucun paiement réel n'est effectué."
            ),
            from_email=None,
            recipient_list=[request.user.email],
        )

        return Response({"detail": "Code de confirmation envoyé.", "paiement": PaiementSerializer(paiement).data})


class ConfirmerPaiementView(APIView):
    """Valide le code saisi par le client — équivalent de la confirmation USSD chez un vrai opérateur."""

    permission_classes = [IsAuthenticated]

    def post(self, request, numero_commande):
        commande = get_object_or_404(Commande, numero_commande=numero_commande, client=request.user)

        # Groupe B : on prend la tentative de paiement la plus récente, pas "le" paiement (qui n'existe plus au singulier)
        paiement = commande.paiements.order_by("-date_transaction").first()
        if not paiement:
            return Response({"detail": "Aucun paiement initié pour cette commande."}, status=400)

        if paiement.statut == "reussi":
            return Response({"detail": "Ce paiement a déjà été confirmé."}, status=400)

        # Groupe A : expiration et limite de tentatives
        if paiement.est_code_expire():
            return Response({"detail": "Ce code a expiré, relance un paiement."}, status=400)

        if not paiement.peut_retenter():
            return Response({"detail": "Trop de tentatives incorrectes, relance un paiement."}, status=400)

        code = request.data.get("code")
        if code != paiement.code_confirmation:
            paiement.nombre_tentatives += 1
            if not paiement.peut_retenter():
                paiement.statut = "echoue"
            paiement.save(update_fields=["nombre_tentatives", "statut"])
            return Response({"detail": "Code de confirmation incorrect."}, status=400)

        paiement.statut = "reussi"
        paiement.reference_transaction = f"SIM-{uuid.uuid4().hex[:12].upper()}"
        paiement.donnees_brutes = {
            "simulateur": True,
            "operateur": paiement.operateur,
            "montant": str(paiement.montant),
            "confirme_le": timezone.now().isoformat(),
        }
        paiement.save(update_fields=["statut", "reference_transaction", "donnees_brutes"])

        commande.changer_statut("payee", commentaire=f"Paiement confirmé via {paiement.operateur}")

        return Response({"detail": "Paiement confirmé.", "paiement": PaiementSerializer(paiement).data})