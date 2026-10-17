import logging

from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.catalogue.models import Produit

logger = logging.getLogger(__name__)

CHAMPS_TEXTE = {"nom", "description", "marque", "tags", "categorie", "categorie_id"}


@receiver(post_save, sender=Produit)
def indexer_apres_sauvegarde(sender, instance, created, update_fields, raw=False, **kwargs):
    if raw or instance.est_supprime:
        return
    # Les mises à jour de stock ou de statut ne changent pas le texte : inutile de recalculer.
    if update_fields is not None and not CHAMPS_TEXTE & set(update_fields):
        return
    transaction.on_commit(lambda: _indexer_sans_bloquer(instance.pk))


def _indexer_sans_bloquer(produit_id):
    from .services import indexer_produits

    try:
        produit = Produit.objects.select_related("categorie").get(pk=produit_id)
        indexer_produits([produit])
    except Exception:
        # Même principe que pour les emails : un échec d'indexation ne doit jamais empêcher
        # d'enregistrer un produit. La commande `indexer_produits` rattrape les oublis.
        logger.exception("Indexation sémantique impossible pour le produit %s", produit_id)