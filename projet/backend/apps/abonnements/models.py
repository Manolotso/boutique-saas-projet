import uuid
from django.db import models
from apps.tenants.models import Tenant


class Abonnement(models.Model):
    PLAN_CHOICES = [
        ("essai", "Essai gratuit"),
        ("standard", "Standard"),
        ("premium", "Premium"),
    ]
    STATUT_CHOICES = [
        ("actif", "Actif"),
        ("expire", "Expiré"),
        ("annule", "Annulé"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="abonnements")
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default="essai")
    date_debut = models.DateField(auto_now_add=True)
    date_fin = models.DateField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default="actif")

    def __str__(self):
        return f"{self.tenant.nom_boutique} - {self.plan}"
