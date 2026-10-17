from django.core.management.base import BaseCommand
from pgvector.django import CosineDistance

from apps.tenants.models import Tenant
from apps.recherche.services import (
    SEUIL_SIMILARITE,
    _produits_publics,
    recherche_plein_texte,
    recherche_semantique,
    vectoriser_requete,
)


class Command(BaseCommand):
    help = "Montre ce que trouvent séparément le plein texte et les embeddings"

    def add_arguments(self, parser):
        parser.add_argument("sous_domaine")
        parser.add_argument("requete")

    def handle(self, *args, **opts):
        tenant = Tenant.objects.get(sous_domaine=opts["sous_domaine"])
        requete = opts["requete"]
        publics = _produits_publics(tenant)
        noms = {p.id: p.nom for p in publics}

        total = publics.count()
        indexes = publics.filter(embedding__isnull=False).count()
        self.stdout.write(f"Produits publiés : {total} | avec embedding : {indexes}")

        vec = vectoriser_requete(requete)
        self.stdout.write(f"Vecteur de la requête : {len(vec)} dimensions\n")

        self.stdout.write("Similarité sémantique (seuil = %.2f) :" % SEUIL_SIMILARITE)
        qs = (
            publics.filter(embedding__isnull=False)
            .annotate(d=CosineDistance("embedding__vecteur", vec))
            .order_by("d")
        )
        for p in qs:
            sim = 1 - p.d
            marque = "OK " if sim >= SEUIL_SIMILARITE else "   "
            self.stdout.write(f"  {marque}{sim:.3f}  {p.nom}")

        self.stdout.write("\nPlein texte seul :", ending=" ")
        self.stdout.write(str([noms[i] for i in recherche_plein_texte(tenant, requete)]))
        self.stdout.write("Sémantique seule :", ending=" ")
        self.stdout.write(str([noms[i] for i in recherche_semantique(tenant, requete)]))