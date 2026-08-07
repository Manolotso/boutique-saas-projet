import uuid
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from apps.tenants.models import Tenant


class Categorie(models.Model):
    """Catégorie de produits, propre à chaque boutique (ex: 'Sacs', 'Décoration')."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="categories")
    parent = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="sous_categories"
    )
    nom = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120)
    description = models.TextField(blank=True)
    ordre = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Catégorie"
        verbose_name_plural = "Catégories"
        unique_together = ("tenant", "slug")
        ordering = ["ordre", "nom"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nom)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nom


class Produit(models.Model):
    STATUT_CHOICES = [
        ("brouillon", "Brouillon"),
        ("publie", "Publié"),
        ("archive", "Archivé"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="produits")
    categorie = models.ForeignKey(
        Categorie, on_delete=models.SET_NULL, null=True, blank=True, related_name="produits"
    )

    # --- Identité ---
    nom = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, blank=True)
    description = models.TextField(blank=True)
    marque = models.CharField(max_length=100, blank=True)
    tags = models.JSONField(default=list, blank=True)  # ex: ["fait main", "édition limitée"]

    # --- Groupe C : Tarification avancée ---
    prix = models.DecimalField(max_digits=12, decimal_places=2)
    prix_promo = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    prix_achat = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    promo_debut = models.DateTimeField(null=True, blank=True)
    promo_fin = models.DateTimeField(null=True, blank=True)

    # --- Groupe D : Gestion des stocks professionnelle ---
    sku = models.CharField(max_length=50, blank=True, verbose_name="Référence (SKU)")
    stock = models.PositiveIntegerField(default=0)
    gestion_stock = models.BooleanField(default=True)
    seuil_alerte_stock = models.PositiveIntegerField(default=5)
    poids = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True, help_text="En kg")

    # --- Groupe E : SEO ---
    meta_description = models.CharField(max_length=255, blank=True)

    # --- Groupe F : Signaux sociaux (dénormalisés) ---
    note_moyenne = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    nombre_avis = models.PositiveIntegerField(default=0)
    nombre_ventes = models.PositiveIntegerField(default=0)
    est_mis_en_avant = models.BooleanField(default=False)

    # --- Groupe G : Cycle de vie avancé ---
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default="brouillon")
    date_publication = models.DateTimeField(null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    est_supprime = models.BooleanField(default=False)
    date_suppression = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Produit"
        verbose_name_plural = "Produits"
        unique_together = ("tenant", "slug")
        ordering = ["-date_creation"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nom)
        if self.statut == "publie" and not self.date_publication:
            self.date_publication = timezone.now()
        super().save(*args, **kwargs)

    @property
    def promo_active(self):
        if not self.prix_promo:
            return False
        maintenant = timezone.now()
        if self.promo_debut and maintenant < self.promo_debut:
            return False
        if self.promo_fin and maintenant > self.promo_fin:
            return False
        return True

    @property
    def prix_actuel(self):
        return self.prix_promo if self.promo_active else self.prix

    @property
    def en_stock(self):
        if not self.gestion_stock:
            return True
        return self.stock > 0

    def __str__(self):
        return f"{self.nom} ({self.tenant.nom_boutique})"


class ImageProduit(models.Model):
    """Une image de la galerie d'un produit (Groupe B)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    produit = models.ForeignKey(Produit, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="produits/galerie/")
    est_principale = models.BooleanField(default=False)
    ordre = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["ordre"]

    def __str__(self):
        return f"Image de {self.produit.nom}"


class VarianteProduit(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    produit = models.ForeignKey(Produit, on_delete=models.CASCADE, related_name="variantes")
    taille = models.CharField(max_length=30, blank=True)
    couleur = models.CharField(max_length=30, blank=True)
    sku = models.CharField(max_length=50, blank=True)
    stock = models.PositiveIntegerField(default=0)
    prix_supplement = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="Montant ajouté au prix de base pour cette variante"
    )

    def __str__(self):
        return f"{self.produit.nom} - {self.taille}/{self.couleur}"