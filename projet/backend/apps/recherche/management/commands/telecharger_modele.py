import time

import numpy as np
from django.conf import settings
from django.core.management.base import BaseCommand

from apps.recherche.services import vectoriser_passages, vectoriser_requete


class Command(BaseCommand):
    help = "Télécharge le modèle d'embeddings (si nécessaire) et vérifie qu'il fonctionne."

    def handle(self, *args, **options):
        debut = time.time()
        self.stdout.write(f"Chargement de {settings.EMBEDDING_MODEL_NAME}...")
        requete = np.array(vectoriser_requete("sac en raphia"))
        self.stdout.write(f"Modèle prêt en {time.time() - debut:.1f}s, dimension : {len(requete)}")

        if len(requete) != settings.EMBEDDING_DIMENSIONS:
            self.stderr.write(
                self.style.ERROR(f"Dimension attendue : {settings.EMBEDDING_DIMENSIONS}. Corrige EMBEDDING_DIMENSIONS.")
            )
            return

        self.stdout.write('Similarité avec la requête "sac en raphia" :')
        for texte in [
            "Panier tressé en fibres naturelles",
            "Sac à main artisanal",
            "Ordinateur portable 15 pouces",
        ]:
            passage = np.array(vectoriser_passages([texte])[0])
            sim = float(np.dot(requete, passage) / (np.linalg.norm(requete) * np.linalg.norm(passage)))
            self.stdout.write(f"  {sim:.3f}  {texte}")