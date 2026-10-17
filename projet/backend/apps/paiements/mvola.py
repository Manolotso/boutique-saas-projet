"""Client minimal pour l'API MVola « Merchant Pay » (environnement de test ou production).

Tout ce qui dépend du format exact de l'API MVola (chemins, en-têtes, corps des requêtes) est
regroupé ici : si MVola répond par une erreur, c'est ce fichier qu'il faut ajuster.
"""
import datetime
import logging
import re

import requests
import uuid
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

logger = logging.getLogger(__name__)

CLE_CACHE_TOKEN = "mvola_access_token"
CHEMIN_MERCHANT_PAY = "/mvola/mm/transactions/type/merchantpay/1.0.0/"
DELAI_REQUETE_SECONDES = 20


class MVolaErreur(Exception):
    """Toute erreur de communication avec MVola (réseau, authentification, réponse inattendue)."""


def _url(chemin):
    return settings.MVOLA_BASE_URL.rstrip("/") + chemin


def obtenir_token(forcer=False):
    """Jeton d'accès OAuth2 (client credentials), gardé en cache jusqu'à peu avant son expiration."""
    if not forcer:
        token = cache.get(CLE_CACHE_TOKEN)
        if token:
            return token

    if not settings.MVOLA_CONSUMER_KEY or not settings.MVOLA_CONSUMER_SECRET:
        raise MVolaErreur("MVOLA_CONSUMER_KEY / MVOLA_CONSUMER_SECRET manquants dans backend/.env")

    try:
        reponse = requests.post(
            _url("/token"),
            auth=(settings.MVOLA_CONSUMER_KEY, settings.MVOLA_CONSUMER_SECRET),
            data={"grant_type": "client_credentials", "scope": settings.MVOLA_SCOPE},
            headers={"Cache-Control": "no-cache"},
            timeout=DELAI_REQUETE_SECONDES,
        )
    except requests.RequestException as exc:
        raise MVolaErreur(f"MVola injoignable : {exc}") from exc

    if reponse.status_code != 200:
        raise MVolaErreur(f"Authentification refusée (HTTP {reponse.status_code}) : {reponse.text[:300]}")

    donnees = reponse.json()
    token = donnees.get("access_token")
    if not token:
        raise MVolaErreur("Réponse d'authentification sans access_token.")

    cache.set(CLE_CACHE_TOKEN, token, max(int(donnees.get("expires_in", 3600)) - 60, 60))
    return token


def _entetes(token):
    return {
        "Authorization": f"Bearer {token}",
        "Version": "1.0",
        "X-CorrelationID": str(uuid.uuid4()),
        "UserLanguage": "FR",
        "UserAccountIdentifier": f"msisdn;{settings.MVOLA_PARTNER_MSISDN}",
        "partnerName": settings.MVOLA_PARTNER_NAME,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
    }


def _requete(methode, chemin, corps=None):
    """Appel authentifié. Si le jeton est refusé (401), on en redemande un et on réessaie une fois."""
    reponse = None
    for tentative in (1, 2):
        token = obtenir_token(forcer=(tentative == 2))
        try:
            reponse = requests.request(
                methode, _url(chemin), headers=_entetes(token), json=corps, timeout=DELAI_REQUETE_SECONDES
            )
        except requests.RequestException as exc:
            raise MVolaErreur(f"MVola injoignable : {exc}") from exc
        if reponse.status_code == 401 and tentative == 1:
            cache.delete(CLE_CACHE_TOKEN)
            continue
        break

    if reponse.status_code not in (200, 201, 202):
        raise MVolaErreur(f"HTTP {reponse.status_code} : {reponse.text[:300]}")

    try:
        return reponse.json()
    except ValueError as exc:
        raise MVolaErreur(f"Réponse MVola illisible : {reponse.text[:300]}") from exc


def initier_paiement(paiement_id, montant, telephone_client, numero_commande):
    """Demande à MVola de débiter `telephone_client` : le client reçoit une demande à valider
    sur son téléphone. Retourne la réponse MVola (dont `serverCorrelationId`, à garder pour
    interroger l'état de la transaction)."""
    corps = {
        "amount": str(int(montant)),
        "currency": "Ar",
        # MVola n'accepte qu'une description courte, sans caractères spéciaux.
        "descriptionText": re.sub(r"[^A-Za-z0-9 ]", " ", f"Commande {numero_commande}")[:50],
        "requestingOrganisationTransactionReference": str(paiement_id),
        "requestDate": timezone.now().astimezone(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "originalTransactionReference": str(paiement_id),
        "debitParty": [{"key": "msisdn", "value": telephone_client}],
        "creditParty": [{"key": "msisdn", "value": settings.MVOLA_PARTNER_MSISDN}],
        "metadata": [{"key": "partnerName", "value": settings.MVOLA_PARTNER_NAME}],
    }
    donnees = _requete("POST", CHEMIN_MERCHANT_PAY, corps)
    if not donnees.get("serverCorrelationId"):
        raise MVolaErreur(f"Réponse sans serverCorrelationId : {donnees}")
    return donnees


def statut_transaction(server_correlation_id):
    """État d'une transaction : la réponse contient `status` (pending, completed ou failed)."""
    return _requete("GET", f"{CHEMIN_MERCHANT_PAY}status/{server_correlation_id}")