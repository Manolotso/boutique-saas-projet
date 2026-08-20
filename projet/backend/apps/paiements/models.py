import uuid
from django.db import models
from django.utils import timezone
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
        ("rembourse", "Remboursé"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # --- Groupe B : plusieurs tentatives possibles par commande ---
    commande = models.ForeignKey(Commande, on_delete=models.CASCADE, related_name="paiements")

    operateur = models.CharField(max_length=20, choices=OPERATEUR_CHOICES)
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default="en_attente")
    reference_transaction = models.CharField(max_length=100, blank=True)

    # --- Groupe A : sécurité du code de confirmation ---
    code_confirmation = models.CharField(max_length=6, blank=True)
    date_expiration_code = models.DateTimeField(null=True, blank=True)
    nombre_tentatives = models.PositiveIntegerField(default=0)
    max_tentatives = models.PositiveIntegerField(default=3)

    # --- Groupe C : frais de transaction ---
    # Taux illustratifs, à confirmer/ajuster une fois un vrai accord marchand signé avec chaque opérateur.
    taux_commission = models.DecimalField(max_digits=5, decimal_places=4, default=0)
    montant_frais = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant_net = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # --- Groupe D : journal brut, pour audit/débogage ---
    donnees_brutes = models.JSONField(default=dict, blank=True)

    # --- Groupe E : justificatif ---
    justificatif = models.ImageField(upload_to="paiements/justificatifs/", null=True, blank=True)

    # --- Groupe F : remboursement ---
    montant_rembourse = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    date_remboursement = models.DateTimeField(null=True, blank=True)
    motif_remboursement = models.CharField(max_length=255, blank=True)

    date_transaction = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_transaction"]

    def est_code_expire(self):
        return bool(self.date_expiration_code) and timezone.now() > self.date_expiration_code

    def peut_retenter(self):
        return self.nombre_tentatives < self.max_tentatives

    def calculer_montants(self):
        """Calcule frais et montant net à partir du taux de commission. À appeler avant save()
        si `montant` ou `taux_commission` changent."""
        self.montant_frais = self.montant * self.taux_commission
        self.montant_net = self.montant - self.montant_frais

    def save(self, *args, **kwargs):
        self.calculer_montants()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Paiement {self.operateur} - {self.commande.numero_commande}"


class TauxChange(models.Model):
    """Taux de change au comptant depuis l'Ariary (MGA) vers une devise cible.
    Une ligne par devise, réécrite chaque jour par la commande `mettre_a_jour_taux_change`.
    """

    code_devise = models.CharField(max_length=3, unique=True, db_index=True)
    taux = models.DecimalField(max_digits=20, decimal_places=8)
    date_maj = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Taux de change"
        verbose_name_plural = "Taux de change"
        ordering = ["code_devise"]

    def __str__(self):
        return f"1 MGA = {self.taux} {self.code_devise}"