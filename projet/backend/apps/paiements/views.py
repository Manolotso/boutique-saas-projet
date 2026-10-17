# apps/paiements/views.py

from django.core.cache import cache
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import TauxChange
import logging
import random
import re
import uuid
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.commandes.models import Commande
from . import mvola
from .models import Paiement
from .mvola import MVolaErreur
from .serializers import PaiementSerializer
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)

CLE_CACHE = "taux_change_mga"
DUREE_CACHE_SECONDES = 60 * 60 * 6  # 6h — la base ne change qu'1x/jour, ce cache évite juste
                                     # de re-sérialiser toute la table à chaque requête publique


def normaliser_telephone(valeur):
    """'+261 34 35 000 03' ou '261343500003' -> '0343500003'."""
    chiffres = re.sub(r"\D", "", str(valeur or ""))
    if chiffres.startswith("261"):
        chiffres = "0" + chiffres[3:]
    return chiffres


def synchroniser_paiement_mvola(paiement):
    """Interroge MVola sur l'état d'un paiement en attente et met à jour le paiement (et la commande).

    Appelée à chaque sondage du frontend. Si MVola ne répond pas, on ne change rien : le prochain
    sondage réessaiera."""
    try:
        resultat = mvola.statut_transaction(paiement.identifiant_operateur)
    except MVolaErreur:
        logger.exception("Impossible de lire le statut MVola du paiement %s", paiement.pk)
        return

    statut_mvola = str(resultat.get("status") or resultat.get("transactionStatus") or "").lower()
    if statut_mvola not in ("completed", "failed"):
        return  # toujours "pending" : le client n'a pas encore validé

    with transaction.atomic():
        # Verrou : deux sondages simultanés ne doivent pas confirmer (et notifier) deux fois.
        paiement = Paiement.objects.select_for_update().get(pk=paiement.pk)
        if paiement.statut != "en_attente":
            return

        paiement.donnees_brutes = {**paiement.donnees_brutes, "statut": resultat}
        if statut_mvola == "completed":
            paiement.statut = "reussi"
            paiement.reference_transaction = str(resultat.get("objectReference") or "")[:100]
        else:
            paiement.statut = "echoue"
        paiement.save()

        commande = paiement.commande
        if paiement.statut == "reussi" and commande.statut == "en_attente":
            commande.changer_statut("payee", commentaire="Paiement confirmé via MVola")


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
    """Initie un paiement. MVola passe par l'API réelle (environnement de test) : le client valide
    sur son téléphone. Les autres opérateurs restent simulés (code de confirmation envoyé par email,
    comme un OTP reçu par SMS/USSD)."""

    permission_classes = [IsAuthenticated]

    def post(self, request, numero_commande):
        commande = get_object_or_404(Commande, numero_commande=numero_commande, client=request.user)

        if commande.statut != "en_attente":
            return Response({"detail": "Cette commande n'est plus en attente de paiement."}, status=400)

        operateur = request.data.get("operateur")
        if operateur not in dict(Paiement.OPERATEUR_CHOICES):
            return Response({"detail": "Opérateur invalide."}, status=400)

        if operateur == "mvola":
            return self._initier_mvola(request, commande)

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

    def _initier_mvola(self, request, commande):
        telephone = normaliser_telephone(request.data.get("telephone"))
        if not re.fullmatch(r"03[48]\d{7}", telephone):
            return Response({"detail": "Numéro MVola invalide (exemple : 034 12 345 67)."}, status=400)

        # On fixe l'identifiant du paiement avant l'appel : il sert de référence côté MVola.
        paiement_id = uuid.uuid4()
        try:
            reponse = mvola.initier_paiement(
                paiement_id=paiement_id,
                montant=commande.montant_total,
                telephone_client=telephone,
                numero_commande=commande.numero_commande,
            )
        except MVolaErreur as exc:
            logger.exception("Échec d'initiation MVola pour la commande %s", commande.numero_commande)
            detail = "MVola n'a pas pu initier le paiement. Réessaie dans un instant."
            if settings.DEBUG:
                detail += f" [{exc}]"  # message brut de MVola, visible seulement en développement
            return Response({"detail": detail}, status=502)

        paiement = Paiement.objects.create(
            id=paiement_id,
            commande=commande,
            operateur="mvola",
            montant=commande.montant_total,
            statut="en_attente",
            telephone_client=telephone,
            identifiant_operateur=reponse["serverCorrelationId"],
            donnees_brutes={"initiation": reponse},
        )

        return Response({
            "detail": "Demande envoyée. Valide le paiement sur ton téléphone.",
            "paiement": PaiementSerializer(paiement).data,
        })


class StatutPaiementView(APIView):
    """État du dernier paiement d'une commande. Le frontend l'interroge régulièrement pendant que
    le client valide sur son téléphone ; pour MVola, on demande alors l'état réel à l'opérateur."""

    permission_classes = [IsAuthenticated]

    def get(self, request, numero_commande):
        commande = get_object_or_404(Commande, numero_commande=numero_commande, client=request.user)

        paiement = commande.paiements.order_by("-date_transaction").first()
        if not paiement:
            return Response({"detail": "Aucun paiement initié pour cette commande."}, status=404)

        if paiement.statut == "en_attente" and paiement.operateur == "mvola" and paiement.identifiant_operateur:
            synchroniser_paiement_mvola(paiement)
            paiement.refresh_from_db()

        return Response({"statut": paiement.statut})


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

        # Un paiement MVola (ou tout paiement sans code) se confirme sur le téléphone du client :
        # sans ce garde-fou, un code vide ("") serait égal au code_confirmation vide et validerait le paiement.
        if paiement.operateur == "mvola" or not paiement.code_confirmation:
            return Response({"detail": "Ce paiement se confirme sur ton téléphone, pas avec un code."}, status=400)

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