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