import uuid
from django.db import models
from apps.commandes.models import Commande


class Paiement(models.Model):
    OPERATEUR_CHOICES = [
        ("mvola", "MVola"),
        ("orange_money", "Orange Money"),
        ("airtel_money", "Airtel Money"),
        ("livraison", "Paiement à la livraison"),
    ]
    STATUT_CHOICES = [
        ("en_attente", "En attente"),
        ("reussi", "Réussi"),
        ("echoue", "Échoué"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commande = models.OneToOneField(Commande, on_delete=models.CASCADE, related_name="paiement")
    operateur = models.CharField(max_length=20, choices=OPERATEUR_CHOICES)
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default="en_attente")
    reference_transaction = models.CharField(max_length=100, blank=True)
    date_transaction = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Paiement {self.operateur} - {self.commande_id}"
