import hashlib
import threading

from django.conf import settings

from .models import ProduitEmbedding

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