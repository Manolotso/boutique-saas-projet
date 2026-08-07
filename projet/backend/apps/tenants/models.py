import uuid
from django.conf import settings
from django.db import models


def horaires_par_defaut():
    """Structure par défaut : boutique ouverte 7j/7, à ajuster par le commerçant."""
    return {
        jour: {"ouvert": True, "debut": "08:00", "fin": "18:00"}
        for jour in ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
    }


def moyens_paiement_par_defaut():
    return ["livraison"]  # paiement à la livraison actif par défaut, mobile money à activer soi-même


def reseaux_sociaux_par_defaut():
    return {"facebook": "", "instagram": "", "tiktok": ""}


class Tenant(models.Model):
    """Une boutique en ligne (= un tenant de la plateforme SaaS)."""

    STATUT_CHOICES = [
        ("actif", "Actif"),
        ("suspendu", "Suspendu"),
        ("en_essai", "En période d'essai"),
    ]

    VILLE_CHOICES = [
        ("antananarivo", "Antananarivo"),
        ("toamasina", "Toamasina"),
        ("antsirabe", "Antsirabe"),
        ("fianarantsoa", "Fianarantsoa"),
        ("mahajanga", "Mahajanga"),
        ("toliara", "Toliara"),
        ("antsiranana", "Antsiranana"),
        ("nosy_be", "Nosy Be"),
        ("autre", "Autre"),
    ]

    LANGUE_CHOICES = [
        ("fr", "Français"),
        ("mg", "Malagasy"),
    ]

    ETAPE_ONBOARDING_CHOICES = [
        ("infos_boutique", "Informations de la boutique"),
        ("branding", "Personnalisation visuelle"),
        ("paiement", "Configuration des paiements"),
        ("termine", "Terminé"),
    ]

    # --- Identité de base ---
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commercant = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="boutique"
    )
    nom_boutique = models.CharField(max_length=150)
    sous_domaine = models.SlugField(max_length=60, unique=True)
    devise = models.CharField(max_length=10, default="MGA")
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default="en_essai")
    date_creation = models.DateTimeField(auto_now_add=True)

    # --- Groupe A : Identité visuelle & branding ---
    logo = models.ImageField(upload_to="boutiques/logos/", blank=True, null=True)
    banniere = models.ImageField(upload_to="boutiques/bannieres/", blank=True, null=True)
    couleur_primaire = models.CharField(max_length=7, default="#12181B")  # format hex #RRGGBB
    couleur_secondaire = models.CharField(max_length=7, default="#0E7C66")
    description = models.TextField(blank=True)
    slogan = models.CharField(max_length=150, blank=True)

    # --- Groupe B : Confiance & légitimité ---
    numero_nif = models.CharField(max_length=30, blank=True, verbose_name="Numéro NIF")
    numero_stat = models.CharField(max_length=30, blank=True, verbose_name="Numéro STAT")
    est_verifie = models.BooleanField(default=False)
    date_verification = models.DateTimeField(null=True, blank=True)

    # --- Groupe C : Contact & présence sociale ---
    telephone = models.CharField(max_length=20, blank=True)
    whatsapp = models.CharField(max_length=20, blank=True)
    adresse = models.CharField(max_length=255, blank=True)
    ville = models.CharField(max_length=30, choices=VILLE_CHOICES, blank=True)
    reseaux_sociaux = models.JSONField(default=reseaux_sociaux_par_defaut, blank=True)

    # --- Groupe D : Paramètres opérationnels ---
    horaires_ouverture = models.JSONField(default=horaires_par_defaut, blank=True)
    langue_preferee = models.CharField(max_length=5, choices=LANGUE_CHOICES, default="fr")
    moyens_paiement_actifs = models.JSONField(default=moyens_paiement_par_defaut, blank=True)

    # --- Groupe E : Signaux de confiance (dénormalisés) ---
    note_moyenne = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    nombre_avis = models.PositiveIntegerField(default=0)
    nombre_ventes = models.PositiveIntegerField(default=0)

    # --- Groupe F : Cycle de vie & robustesse ---
    etape_onboarding = models.CharField(
        max_length=20, choices=ETAPE_ONBOARDING_CHOICES, default="infos_boutique"
    )
    date_modification = models.DateTimeField(auto_now=True)
    est_supprime = models.BooleanField(default=False)
    date_suppression = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Boutique (tenant)"
        verbose_name_plural = "Boutiques (tenants)"

    def __str__(self):
        return self.nom_boutique