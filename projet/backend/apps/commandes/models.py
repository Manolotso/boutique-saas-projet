import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone
from apps.tenants.models import Tenant
from apps.catalogue.models import Produit, VarianteProduit


class CompteurCommande(models.Model):
    """Compteur atomique par tenant et par année, utilisé pour générer numero_commande sans collision."""

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="compteurs_commande")
    annee = models.IntegerField()
    dernier_numero = models.IntegerField(default=0)

    class Meta:
        unique_together = [("tenant", "annee")]

    def __str__(self):
        return f"{self.tenant.nom_boutique} - {self.annee} ({self.dernier_numero})"


class Commande(models.Model):
    STATUT_CHOICES = [
        ("en_attente", "En attente"),
        ("confirmee", "Confirmée"),
        ("payee", "Payée"),
        ("expediee", "Expédiée"),
        ("livree", "Livrée"),
        ("annulee", "Annulée"),
    ]

    MODE_LIVRAISON_CHOICES = [
        ("domicile", "Livraison à domicile"),
        ("retrait", "Retrait en boutique"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    numero_commande = models.CharField(max_length=30, unique=True, editable=False)

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="commandes")
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="commandes")
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default="en_attente")

    # --- Groupe E : Montants séparés ---
    montant_sous_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant_remise = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    frais_livraison = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    montant_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # --- Groupe C : Informations de livraison complètes ---
    mode_livraison = models.CharField(max_length=20, choices=MODE_LIVRAISON_CHOICES, default="domicile")
    nom_destinataire = models.CharField(max_length=150, blank=True)
    telephone_destinataire = models.CharField(max_length=20, blank=True)
    zone_livraison = models.CharField(max_length=120, blank=True)
    adresse_complete = models.TextField(blank=True)
    instructions_livraison = models.TextField(blank=True)

    # --- Groupe F : Communication ---
    note_client = models.TextField(blank=True)
    note_interne = models.TextField(blank=True)

    # --- Groupe G : Traçabilité annulation ---
    motif_annulation = models.CharField(max_length=255, blank=True)
    annulee_le = models.DateTimeField(null=True, blank=True)

    date_commande = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_commande"]

    def save(self, *args, **kwargs):
        if not self.numero_commande:
            self.numero_commande = self._generer_numero_commande()
        super().save(*args, **kwargs)

    def _generer_numero_commande(self):
        annee = timezone.now().year
        compteur, _ = CompteurCommande.objects.select_for_update().get_or_create(
            tenant=self.tenant, annee=annee
        )
        compteur.dernier_numero += 1
        compteur.save(update_fields=["dernier_numero"])
        return f"CMD-{self.tenant.sous_domaine.upper()}-{annee}-{compteur.dernier_numero:05d}"

    def changer_statut(self, nouveau_statut, commentaire=""):
        """Change le statut et trace automatiquement l'historique (Groupe B)."""
        ancien_statut = self.statut
        self.statut = nouveau_statut
        if nouveau_statut == "annulee":
            self.annulee_le = timezone.now()
        self.save()
        HistoriqueStatutCommande.objects.create(
            commande=self, statut=nouveau_statut, statut_precedent=ancien_statut, commentaire=commentaire
        )

    @property
    def paiement_reussi(self):
        return self.paiements.filter(statut="reussi").first()

    def __str__(self):
        return f"{self.numero_commande} - {self.tenant.nom_boutique}"


class HistoriqueStatutCommande(models.Model):
    """Trace chaque changement de statut d'une commande (Groupe B)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commande = models.ForeignKey(Commande, on_delete=models.CASCADE, related_name="historique")
    statut = models.CharField(max_length=20, choices=Commande.STATUT_CHOICES)
    statut_precedent = models.CharField(max_length=20, choices=Commande.STATUT_CHOICES, blank=True)
    commentaire = models.CharField(max_length=255, blank=True)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date"]
        verbose_name = "Historique de statut"
        verbose_name_plural = "Historiques de statut"

    def __str__(self):
        return f"{self.commande.numero_commande} → {self.statut}"


class LigneCommande(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commande = models.ForeignKey(Commande, on_delete=models.CASCADE, related_name="lignes")
    produit = models.ForeignKey(Produit, on_delete=models.PROTECT)
    variante = models.ForeignKey(VarianteProduit, on_delete=models.PROTECT, null=True, blank=True)
    quantite = models.PositiveIntegerField(default=1)
    prix_unitaire = models.DecimalField(max_digits=12, decimal_places=2)

    # --- Groupe D : Snapshot, figé au moment de la commande ---
    nom_produit = models.CharField(max_length=200)
    variante_label = models.CharField(max_length=100, blank=True)

    def save(self, *args, **kwargs):
        if not self.nom_produit:
            self.nom_produit = self.produit.nom
        if not self.variante_label and self.variante:
            self.variante_label = " / ".join(filter(None, [self.variante.taille, self.variante.couleur]))
        super().save(*args, **kwargs)

    @property
    def sous_total(self):
        return self.quantite * self.prix_unitaire

    def __str__(self):
        return f"{self.quantite} x {self.nom_produit}"