import hashlib
import threading

import numpy as np
from django.conf import settings
from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from pgvector.django import CosineDistance

from apps.catalogue.models import Produit

from .models import ProduitEmbedding, Evenement  # remplace l'import existant de ProduitEmbedding

from datetime import timedelta

from django.db.models import Q
from django.utils import timezone



_modele = None
_verrou = threading.Lock()


def obtenir_modele():
    """Charge le modèle une seule fois par processus, au premier usage."""
    global _modele
    if _modele is None:
        with _verrou:
            if _modele is None:
                from fastembed import TextEmbedding

                _modele = TextEmbedding(
                    model_name=settings.EMBEDDING_MODEL_NAME,
                    cache_dir=str(settings.EMBEDDING_CACHE_DIR),
                )
    return _modele


# MiniLM n'utilise pas de préfixes "query:" / "passage:" (ils sont propres aux modèles E5).
def vectoriser_passages(textes):
    modele = obtenir_modele()
    return [v.tolist() for v in modele.embed(list(textes))]


def vectoriser_requete(texte):
    modele = obtenir_modele()
    return next(iter(modele.embed([texte]))).tolist()


def construire_texte_produit(produit):
    parties = [produit.nom]
    if produit.categorie_id:
        parties.append(f"Catégorie : {produit.categorie.nom}")
    if produit.marque:
        parties.append(f"Marque : {produit.marque}")
    if produit.tags:
        parties.append("Mots-clés : " + ", ".join(str(t) for t in produit.tags))
    if produit.description:
        parties.append(produit.description[:1500])
    return ". ".join(parties)


def _empreinte(texte):
    return hashlib.sha256(f"{settings.EMBEDDING_MODEL_NAME}|{texte}".encode("utf-8")).hexdigest()


def indexer_produits(produits, forcer=False):
    """Calcule les embeddings des produits nouveaux ou modifiés, en un seul appel au modèle.
    Retourne le nombre de produits réellement (ré)indexés."""
    produits = list(produits)
    existants = dict(
        ProduitEmbedding.objects.filter(produit__in=produits).values_list("produit_id", "texte_hash")
    )

    a_indexer = []
    for produit in produits:
        texte = construire_texte_produit(produit)
        empreinte = _empreinte(texte)
        if forcer or existants.get(produit.id) != empreinte:
            a_indexer.append((produit, texte, empreinte))

    if not a_indexer:
        return 0

    vecteurs = vectoriser_passages([texte for _, texte, _ in a_indexer])
    for (produit, _, empreinte), vecteur in zip(a_indexer, vecteurs):
        ProduitEmbedding.objects.update_or_create(
            produit=produit,
            defaults={
                "tenant_id": produit.tenant_id,
                "vecteur": vecteur,
                "texte_hash": empreinte,
                "modele": settings.EMBEDDING_MODEL_NAME,
            },
        )
    return len(a_indexer)


# --------------------------------------------------------------------------
# Recherche hybride (plein texte + sémantique, fusion RRF)
# --------------------------------------------------------------------------
K_RRF = 60               # constante classique de la Reciprocal Rank Fusion
SEUIL_SIMILARITE = 0.35  # plancher absolu : en dessous, toujours hors sujet
MARGE_RELATIVE = 0.20   # on garde les produits à moins de 0,15 du meilleur score (provisoire)
LIMITE_CANDIDATS = 50


def _produits_publics(tenant):
    # Le filtre tenant est ici, à un seul endroit : toute recherche passe par lui.
    return Produit.objects.filter(tenant=tenant, statut="publie", est_supprime=False)


def recherche_plein_texte(tenant, requete):
    """Correspondances de mots (avec racinisation française). Retourne des ids classés."""
    vecteur = (
        SearchVector("nom", weight="A", config="french")
        + SearchVector("marque", weight="B", config="french")
        + SearchVector("description", weight="C", config="french")
    )
    query = SearchQuery(requete, config="french", search_type="websearch")
    qs = (
        _produits_publics(tenant)
        .annotate(recherche=vecteur, rang=SearchRank(vecteur, query))
        .filter(recherche=query)   # vrai test de correspondance (opérateur @@)
        .order_by("-rang")
    )
    return list(qs.values_list("id", flat=True)[:LIMITE_CANDIDATS])


def filtrer_par_similarite(classement, seuil, marge):
    """classement : liste de (id, distance) triée par distance croissante.
    Garde les produits au-dessus du plancher ET proches du meilleur score."""
    classement = classement[:LIMITE_CANDIDATS]
    if not classement:
        return []
    meilleur = 1 - classement[0][1]
    limite = max(seuil, meilleur - marge) if marge else seuil
    return [i for i, d in classement if 1 - d >= limite]


def recherche_semantique(tenant, requete):
    """Produits proches par le sens : au-dessus du plancher et proches du meilleur résultat."""
    vecteur = vectoriser_requete(requete)
    classement = list(
        _produits_publics(tenant)
        .filter(embedding__isnull=False)
        .annotate(distance=CosineDistance("embedding__vecteur", vecteur))
        .order_by("distance")
        .values_list("id", "distance")[:LIMITE_CANDIDATS]
    )
    return filtrer_par_similarite(classement, SEUIL_SIMILARITE, MARGE_RELATIVE)


def rechercher_produits(tenant, requete, limite=24):
    """Fusionne les deux classements (RRF) et retourne les ids triés par pertinence."""
    scores = {}
    for ids in (recherche_plein_texte(tenant, requete), recherche_semantique(tenant, requete)):
        for rang, produit_id in enumerate(ids, start=1):
            scores[produit_id] = scores.get(produit_id, 0) + 1 / (K_RRF + rang)
    return sorted(scores, key=scores.get, reverse=True)[:limite]


# --------------------------------------------------------------------------
# Recommandations sous les résultats de recherche (version provisoire, phase 2)
# --------------------------------------------------------------------------
# --------------------------------------------------------------------------
# Événements et profil du visiteur (phase 4)
# --------------------------------------------------------------------------
POIDS_EVENEMENTS = {"vue": 1.0, "ajout_panier": 3.0, "achat": 5.0}
DEMI_VIE_JOURS = 30  # une action vieille de 30 jours compte moitié moins


def enregistrer_evenement(tenant, type_, produit=None, requete="", visiteur_id="", utilisateur=None):
    # Évite les doublons de consultation (rechargement de page) sur 10 minutes
    if type_ == "vue" and produit is not None:
        deja = Evenement.objects.filter(
            tenant=tenant, produit=produit, type="vue",
            date__gte=timezone.now() - timedelta(minutes=10),
        )
        deja = deja.filter(utilisateur=utilisateur) if utilisateur else deja.filter(visiteur_id=visiteur_id)
        if deja.exists():
            return None
    return Evenement.objects.create(
        tenant=tenant, produit=produit, type=type_, requete=requete[:200],
        visiteur_id=visiteur_id, utilisateur=utilisateur,
    )


def enregistrer_achats(commande):
    """Appelé quand une commande est payée : un événement 'achat' par ligne (sans doublon)."""
    for ligne in commande.lignes.select_related("produit"):
        Evenement.objects.get_or_create(
            tenant=commande.tenant, produit=ligne.produit, type="achat",
            utilisateur=commande.client, requete=commande.numero_commande,
        )


def _evenements_visiteur(tenant, visiteur_id, utilisateur):
    q = Q()
    if visiteur_id:
        q |= Q(visiteur_id=visiteur_id)
    if utilisateur is not None:
        q |= Q(utilisateur=utilisateur)
    if not q:
        return Evenement.objects.none()
    return Evenement.objects.filter(q, tenant=tenant, produit__isnull=False, type__in=POIDS_EVENEMENTS)


def profil_visiteur(tenant, visiteur_id, utilisateur):
    """Moyenne pondérée (type d'action + récence) des embeddings des produits touchés."""
    evenements = list(
        _evenements_visiteur(tenant, visiteur_id, utilisateur)
        .order_by("-date")
        .values_list("produit_id", "type", "date")[:100]
    )
    if not evenements:
        return None

    vecteurs = dict(
        ProduitEmbedding.objects.filter(produit_id__in={e[0] for e in evenements})
        .values_list("produit_id", "vecteur")
    )
    maintenant = timezone.now()
    somme, total = None, 0.0
    for produit_id, type_, date in evenements:
        vecteur = vecteurs.get(produit_id)
        if vecteur is None:
            continue
        age_jours = (maintenant - date).total_seconds() / 86400
        poids = POIDS_EVENEMENTS[type_] * 0.5 ** (age_jours / DEMI_VIE_JOURS)
        valeur = np.asarray(vecteur, dtype=float) * poids
        somme = valeur if somme is None else somme + valeur
        total += poids
    if somme is None or total == 0:
        return None
    return (somme / total).tolist()


def _ids_achetes(tenant, visiteur_id, utilisateur):
    return set(
        _evenements_visiteur(tenant, visiteur_id, utilisateur)
        .filter(type="achat")
        .values_list("produit_id", flat=True)
    )


def _plus_proches(base, centre, limite):
    return list(
        base.filter(embedding__isnull=False)
        .annotate(distance=CosineDistance("embedding__vecteur", centre))
        .order_by("distance")
        .values_list("id", flat=True)[:limite]
    )


def _completer(base, ids, limite):
    if len(ids) < limite:
        ids = ids + list(
            base.exclude(id__in=ids)
            .order_by("-est_mis_en_avant", "-nombre_ventes", "-date_publication")
            .values_list("id", flat=True)[: limite - len(ids)]
        )
    return ids


def produits_recommandes(tenant, ids_resultats, visiteur_id="", utilisateur=None, limite=8):
    """Recommandations sous la recherche : mélange des goûts du visiteur (60 %) et des résultats (40 %)."""
    ids_resultats = list(ids_resultats)
    exclus = set(ids_resultats) | _ids_achetes(tenant, visiteur_id, utilisateur)
    base = _produits_publics(tenant).exclude(id__in=exclus)

    centres = []  # liste de (poids, vecteur)
    profil = profil_visiteur(tenant, visiteur_id, utilisateur)
    if ids_resultats:
        vecteurs = list(
            ProduitEmbedding.objects.filter(produit_id__in=ids_resultats[:3]).values_list("vecteur", flat=True)
        )
        if vecteurs:
            centres.append((0.4 if profil else 1.0, np.mean(np.array(vecteurs, dtype=float), axis=0)))
    if profil:
        centres.append((0.6 if centres else 1.0, np.asarray(profil, dtype=float)))

    ids = []
    if centres:
        centre = sum(p * v for p, v in centres) / sum(p for p, _ in centres)
        ids = _plus_proches(base, centre.tolist(), limite)
    return _completer(base, ids, limite)


def produits_pour_vous(tenant, visiteur_id="", utilisateur=None, limite=8):
    """Section 'Pour vous' de l'accueil. Retourne (ids, personnalise)."""
    base = _produits_publics(tenant).exclude(id__in=_ids_achetes(tenant, visiteur_id, utilisateur))
    profil = profil_visiteur(tenant, visiteur_id, utilisateur)
    ids = _plus_proches(base, profil, limite) if profil else []
    personnalise = bool(ids)
    return _completer(base, ids, limite), personnalise


# --------------------------------------------------------------------------
# Produits similaires (fiche produit, phase 3)
# --------------------------------------------------------------------------
def produits_similaires(tenant, produit, limite=8):
    """Produits les plus proches par le sens, complétés par la même catégorie puis les mieux classés."""
    base = _produits_publics(tenant).exclude(id=produit.id)
    ids = []

    embedding = ProduitEmbedding.objects.filter(produit=produit).first()
    if embedding is not None:
        ids = list(
            base.filter(embedding__isnull=False)
            .annotate(distance=CosineDistance("embedding__vecteur", embedding.vecteur))
            .order_by("distance")
            .values_list("id", flat=True)[:limite]
        )

    if len(ids) < limite and produit.categorie_id:
        ids += list(
            base.filter(categorie_id=produit.categorie_id)
            .exclude(id__in=ids)
            .order_by("-nombre_ventes", "-date_publication")
            .values_list("id", flat=True)[: limite - len(ids)]
        )

    if len(ids) < limite:
        ids += list(
            base.exclude(id__in=ids)
            .order_by("-est_mis_en_avant", "-nombre_ventes", "-date_publication")
            .values_list("id", flat=True)[: limite - len(ids)]
        )
    return ids