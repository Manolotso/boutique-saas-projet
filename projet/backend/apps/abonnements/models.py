import uuid
from django.db import models
from django.utils import timezone
from datetime import timedelta
from apps.tenants.models import Tenant


class Plan(models.Model):
    """Un plan tarifaire configurable — modifiable depuis l'admin, sans migration à chaque changement."""

    PERIODICITE_CHOICES = [
        ("mensuel", "Mensuel"),
        ("annuel", "Annuel"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.SlugField(max_length=30, unique=True)  # ex: "essai", "standard", "premium"
    nom = models.CharField(max_length=50)
    description = models.TextField(blank=True)

    prix_mensuel = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    prix_annuel = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # --- Groupe E : limites d'usage réellement appliquées ---
    nombre_produits_max = models.PositiveIntegerField(null=True, blank=True)  # null = illimité
    commission_transaction = models.DecimalField(max_digits=5, decimal_places=4, default=0)
    fonctionnalites = models.JSONField(default=dict, blank=True)  # ex: {"support_prioritaire": true}

    duree_essai_jours = models.PositiveIntegerField(default=14)
    est_actif = models.BooleanField(default=True)
    ordre = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["ordre"]

    def prix_pour(self, periodicite):
        return self.prix_annuel if periodicite == "annuel" else self.prix_mensuel

    def __str__(self):
        return self.nom


class Abonnement(models.Model):
    STATUT_CHOICES = [
        ("essai", "En période d'essai"),
        ("actif", "Actif"),
        ("expire", "Expiré"),
        ("annule", "Annulé"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="abonnements")
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name="abonnements")
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default="essai")

    # --- Groupe B : cycle de facturation ---
    periodicite = models.CharField(max_length=10, choices=Plan.PERIODICITE_CHOICES, default="mensuel")
    renouvellement_automatique = models.BooleanField(default=True)
    date_prochain_renouvellement = models.DateField(null=True, blank=True)

    # --- Groupe F : essai géré proprement ---
    date_fin_essai = models.DateField(null=True, blank=True)

    date_debut = models.DateField(auto_now_add=True)
    date_fin = models.DateField(null=True, blank=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_debut"]

    def save(self, *args, **kwargs):
        if not self.date_fin_essai and self.statut == "essai":
            self.date_fin_essai = timezone.now().date() + timedelta(days=self.plan.duree_essai_jours)
        super().save(*args, **kwargs)

    def essai_expire(self):
        return self.statut == "essai" and self.date_fin_essai and timezone.now().date() > self.date_fin_essai

    # --- Groupe E : vérification de quota, utilisable partout dans le code (ex: création de produit) ---
    def peut_ajouter_produit(self, nombre_produits_actuel):
        if self.plan.nombre_produits_max is None:
            return True
        return nombre_produits_actuel < self.plan.nombre_produits_max

    def changer_plan(self, nouveau_plan, commentaire=""):
        """Change de plan et trace automatiquement l'historique (Groupe C)."""
        ancien_plan = self.plan
        self.plan = nouveau_plan
        self.statut = "actif"
        self.save()
        HistoriqueAbonnement.objects.create(
            abonnement=self, ancien_plan=ancien_plan, nouveau_plan=nouveau_plan, commentaire=commentaire
        )

    def __str__(self):
        return f"{self.tenant.nom_boutique} - {self.plan.nom}"


class HistoriqueAbonnement(models.Model):
    """Trace chaque changement de plan (Groupe C)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    abonnement = models.ForeignKey(Abonnement, on_delete=models.CASCADE, related_name="historique")
    ancien_plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, related_name="+")
    nouveau_plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, related_name="+")
    commentaire = models.CharField(max_length=255, blank=True)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]
        verbose_name = "Historique d'abonnement"
        verbose_name_plural = "Historiques d'abonnement"

    def __str__(self):
        return f"{self.abonnement.tenant.nom_boutique} : {self.ancien_plan} → {self.nouveau_plan}"


class Facture(models.Model):
    """Facture émise pour un cycle de facturation (Groupe D) — simulée, sans paiement réel prélevé."""

    STATUT_CHOICES = [
        ("en_attente", "En attente"),
        ("payee", "Payée"),
        ("echouee", "Échouée"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    numero_facture = models.CharField(max_length=30, unique=True, editable=False)
    abonnement = models.ForeignKey(Abonnement, on_delete=models.CASCADE, related_name="factures")
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default="en_attente")
    periode_debut = models.DateField()
    periode_fin = models.DateField()
    date_emission = models.DateTimeField(auto_now_add=True)
    date_paiement = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.numero_facture:
            self.numero_facture = self._generer_numero()
        super().save(*args, **kwargs)

    def _generer_numero(self):
        annee = timezone.now().year
        dernier = Facture.objects.filter(numero_facture__startswith=f"FAC-{annee}-").order_by("-numero_facture").first()
        prochain = int(dernier.numero_facture.split("-")[-1]) + 1 if dernier else 1
        return f"FAC-{annee}-{prochain:05d}"

    def __str__(self):
        return self.numero_facture