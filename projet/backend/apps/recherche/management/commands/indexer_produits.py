from django.core.management.base import BaseCommand

from apps.catalogue.models import Produit
from apps.recherche.services import indexer_produits


class Command(BaseCommand):
    help = "Calcule les embeddings des produits nouveaux ou modifiés."

    def add_arguments(self, parser):
        parser.add_argument("--forcer", action="store_true", help="Recalcule tous les embeddings.")

    def handle(self, *args, **options):
        produits = Produit.objects.filter(est_supprime=False).select_related("categorie")
        nombre = indexer_produits(produits, forcer=options["forcer"])
        self.stdout.write(self.style.SUCCESS(f"{nombre} produit(s) indexé(s) sur {produits.count()}."))