"""Diagnostic de l'API MVola (sandbox) sans passer par l'interface.

Envoie une transaction de test puis interroge son statut toutes les 3 secondes.
Exemples :
    python manage.py tester_mvola --montant 1000
    python manage.py tester_mvola --montant 1000 --client 0343500004 --marchand 0343500003
"""
import time
import uuid

from django.conf import settings
from django.core.management.base import BaseCommand

from apps.paiements import mvola
from apps.paiements.mvola import MVolaErreur


class Command(BaseCommand):
    help = "Envoie une transaction MVola de test et affiche l'évolution de son statut."

    def add_arguments(self, parser):
        parser.add_argument("--montant", type=int, default=1000, help="Montant en Ar (défaut : 1000)")
        parser.add_argument("--client", default="0343500003", help="Numéro débité (défaut : 0343500003)")
        parser.add_argument("--marchand", default=None, help="Numéro crédité (défaut : MVOLA_PARTNER_MSISDN)")
        parser.add_argument("--duree", type=int, default=60, help="Durée max de suivi en secondes (défaut : 60)")

    def handle(self, *args, **options):
        if options["marchand"]:
            # Le client MVola lit ce réglage à chaque appel : on le remplace juste pour ce test.
            settings.MVOLA_PARTNER_MSISDN = options["marchand"]

        self.stdout.write(
            f"Client (débité) : {options['client']} | marchand (crédité) : {settings.MVOLA_PARTNER_MSISDN} "
            f"| montant : {options['montant']} Ar | environnement : {settings.MVOLA_BASE_URL}"
        )

        try:
            reponse = mvola.initier_paiement(
                paiement_id=uuid.uuid4(),
                montant=options["montant"],
                telephone_client=options["client"],
                numero_commande="TEST",
            )
        except MVolaErreur as exc:
            self.stderr.write(f"Initiation refusée : {exc}")
            return

        self.stdout.write(f"Initiation : {reponse}")
        identifiant = reponse["serverCorrelationId"]

        debut = time.time()
        while time.time() - debut < options["duree"]:
            time.sleep(3)
            ecoule = int(time.time() - debut)
            try:
                statut = mvola.statut_transaction(identifiant)
            except MVolaErreur as exc:
                self.stderr.write(f"[{ecoule:>3}s] erreur de lecture du statut : {exc}")
                continue
            self.stdout.write(f"[{ecoule:>3}s] {statut}")
            if str(statut.get("status", "")).lower() in ("completed", "failed"):
                break
        else:
            self.stdout.write("Fin du suivi : la transaction est toujours en attente.")