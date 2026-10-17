from django.conf import settings
from django.db import models
from pgvector.django import VectorField


class ProduitEmbedding(models.Model):
    produit = models.OneToOneField("catalogue.Produit", on_delete=models.CASCADE, related_name="embedding")
    tenant = models.ForeignKey("tenants.Tenant", on_delete=models.CASCADE, related_name="embeddings_produits")
    vecteur = VectorField(dimensions=settings.EMBEDDING_DIMENSIONS)
    texte_hash = models.CharField(max_length=64)
    modele = models.CharField(max_length=100)
    date_maj = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Embedding de {self.produit.nom}"


class Evenement(models.Model):
    TYPES = [
        ("vue", "Fiche produit consultée"),
        ("recherche", "Recherche effectuée"),
        ("ajout_panier", "Ajout au panier"),
        ("achat", "Achat"),
    ]

    tenant = models.ForeignKey("tenants.Tenant", on_delete=models.CASCADE, related_name="evenements")
    produit = models.ForeignKey(
        "catalogue.Produit", on_delete=models.CASCADE, null=True, blank=True, related_name="evenements"
    )
    visiteur_id = models.CharField(max_length=64, blank=True, db_index=True)  # identifiant anonyme du navigateur
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="evenements"
    )
    type = models.CharField(max_length=20, choices=TYPES)
    requete = models.CharField(max_length=200, blank=True)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["tenant", "visiteur_id", "-date"])]
        ordering = ["-date"]

    def __str__(self):
        return f"{self.type} ({self.visiteur_id[:8] or self.utilisateur_id})"