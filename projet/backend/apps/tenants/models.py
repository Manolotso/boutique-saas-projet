import uuid
from django.conf import settings
from django.db import models


class Tenant(models.Model):
    """Une boutique en ligne (= un tenant de la plateforme SaaS)."""

    STATUT_CHOICES = [
        ("actif", "Actif"),
        ("suspendu", "Suspendu"),
        ("en_essai", "En période d'essai"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commercant = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="boutique"
    )
    nom_boutique = models.CharField(max_length=150)
    sous_domaine = models.SlugField(max_length=60, unique=True)
    theme = models.CharField(max_length=50, default="default")
    devise = models.CharField(max_length=10, default="MGA")
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default="en_essai")
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Boutique (tenant)"
        verbose_name_plural = "Boutiques (tenants)"

    def __str__(self):
        return self.nom_boutique
