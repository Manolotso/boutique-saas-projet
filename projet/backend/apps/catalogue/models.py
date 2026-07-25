import uuid
from django.db import models
from apps.tenants.models import Tenant


class Produit(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="produits")
    nom = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    prix = models.DecimalField(max_digits=12, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    photo = models.ImageField(upload_to="produits/", blank=True, null=True)
    actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nom} ({self.tenant.nom_boutique})"


class VarianteProduit(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    produit = models.ForeignKey(Produit, on_delete=models.CASCADE, related_name="variantes")
    taille = models.CharField(max_length=30, blank=True)
    couleur = models.CharField(max_length=30, blank=True)
    stock = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.produit.nom} - {self.taille}/{self.couleur}"
