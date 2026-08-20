# apps/paiements/management/commands/mettre_a_jour_taux_change.py

import requests
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.paiements.models import TauxChange  # ajuste l'import selon ton app

URL_API_TAUX = "https://open.er-api.com/v6/latest/MGA"


class Command(BaseCommand):
    help = "Récupère les taux de change depuis l'Ariary (MGA) et met à jour la table TauxChange."

    def handle(self, *args, **options):
        try:
            reponse = requests.get(URL_API_TAUX, timeout=10)
            reponse.raise_for_status()
        except requests.RequestException as exc:
            self.stderr.write(self.style.ERROR(f"Échec de la requête vers l'API de taux : {exc}"))
            return

        donnees = reponse.json()
        if donnees.get("result") != "success":
            self.stderr.write(self.style.ERROR("Réponse invalide de l'API de taux de change."))
            return

        taux = donnees.get("rates", {})
        if not taux:
            self.stderr.write(self.style.ERROR("Aucun taux reçu, mise à jour annulée."))
            return

        with transaction.atomic():
            for code_devise, valeur in taux.items():
                TauxChange.objects.update_or_create(
                    code_devise=code_devise,
                    defaults={"taux": valeur},
                )

        self.stdout.write(self.style.SUCCESS(f"{len(taux)} taux de change mis à jour."))