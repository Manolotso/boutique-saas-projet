import uuid
from django.conf import settings
from django.db import models
from apps.tenants.models import Tenant
from apps.catalogue.models import Produit, VarianteProduit


class Commande(models.Model):
    STATUT_CHOICES = [
        ("en_attente", "En attente"),
        ("confirmee", "Confirmée"),
        ("payee", "Payée"),
        ("expediee", "Expédiée"),
        ("livree", "Livrée"),
        ("annulee", "Annulée"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="commandes")
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="commandes")
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default="en_attente")
    montant_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    zone_livraison = models.CharField(max_length=120, blank=True)
    frais_livraison = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    date_commande = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Commande {self.id} - {self.tenant.nom_boutique}"


class LigneCommande(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commande = models.ForeignKey(Commande, on_delete=models.CASCADE, related_name="lignes")
    produit = models.ForeignKey(Produit, on_delete=models.PROTECT)
    variante = models.ForeignKey(VarianteProduit, on_delete=models.PROTECT, null=True, blank=True)
    quantite = models.PositiveIntegerField(default=1)
    prix_unitaire = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.quantite} x {self.produit.nom}"
