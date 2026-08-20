from rest_framework import serializers
from django.db import transaction
from apps.catalogue.models import Produit, VarianteProduit
from .models import Commande, LigneCommande, HistoriqueStatutCommande


class LigneCommandeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LigneCommande
        fields = ["id", "produit", "nom_produit", "variante_label", "quantite", "prix_unitaire"]
        read_only_fields = fields


class HistoriqueStatutSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoriqueStatutCommande
        fields = ["statut", "statut_precedent", "commentaire", "date"]
        read_only_fields = fields


class CommandeSerializer(serializers.ModelSerializer):
    """Lecture d'une commande (suivi client, gestion commerçant)."""

    lignes = LigneCommandeSerializer(many=True, read_only=True)
    historique = HistoriqueStatutSerializer(many=True, read_only=True)
    boutique_nom = serializers.CharField(source="tenant.nom_boutique", read_only=True)
    boutique_sous_domaine = serializers.CharField(source="tenant.sous_domaine", read_only=True)

    class Meta:
        model = Commande
        fields = [
            "id", "numero_commande", "boutique_nom", "boutique_sous_domaine", "statut",
            "montant_sous_total", "montant_remise", "frais_livraison", "montant_total",
            "mode_livraison", "nom_destinataire", "telephone_destinataire",
            "zone_livraison", "adresse_complete", "instructions_livraison",
            "note_client", "note_interne",
            "motif_annulation", "annulee_le",
            "date_commande", "date_modification",
            "lignes", "historique",
        ]
        read_only_fields = fields


class LigneCommandeCreationSerializer(serializers.Serializer):
    produit_id = serializers.UUIDField()
    variante_id = serializers.UUIDField(required=False, allow_null=True)
    quantite = serializers.IntegerField(min_value=1)


class CommandeCreationSerializer(serializers.Serializer):
    """Création d'une commande à partir du contenu du panier."""

    lignes = LigneCommandeCreationSerializer(many=True)
    mode_livraison = serializers.ChoiceField(choices=Commande.MODE_LIVRAISON_CHOICES)
    nom_destinataire = serializers.CharField(max_length=150)
    telephone_destinataire = serializers.CharField(max_length=20)
    zone_livraison = serializers.CharField(max_length=120, required=False, allow_blank=True)
    adresse_complete = serializers.CharField(required=False, allow_blank=True)
    instructions_livraison = serializers.CharField(required=False, allow_blank=True)
    note_client = serializers.CharField(required=False, allow_blank=True)
    frais_livraison = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)

    def validate_lignes(self, valeur):
        if not valeur:
            raise serializers.ValidationError("Le panier est vide.")
        return valeur

    def create(self, validated_data):
        tenant = self.context["tenant"]
        client = self.context["client"]
        lignes_donnees = validated_data.pop("lignes")

        with transaction.atomic():
            lignes_a_creer = []
            montant_sous_total = 0

            for ligne in lignes_donnees:
                try:
                    produit = Produit.objects.select_for_update().get(
                        id=ligne["produit_id"], tenant=tenant, statut="publie", est_supprime=False
                    )
                except Produit.DoesNotExist:
                    raise serializers.ValidationError(
                        {"lignes": f"Un produit du panier n'est plus disponible dans cette boutique."}
                    )

                variante = None
                if ligne.get("variante_id"):
                    try:
                        variante = VarianteProduit.objects.select_for_update().get(
                            id=ligne["variante_id"], produit=produit
                        )
                    except VarianteProduit.DoesNotExist:
                        raise serializers.ValidationError(
                            {"lignes": f"Une variante de \"{produit.nom}\" n'est plus disponible."}
                        )

                quantite = ligne["quantite"]
                stock_disponible = variante.stock if variante else (produit.stock if produit.gestion_stock else None)

                if stock_disponible is not None and quantite > stock_disponible:
                    raise serializers.ValidationError(
                        {"lignes": f"Stock insuffisant pour \"{produit.nom}\" (disponible : {stock_disponible})."}
                    )

                prix_supplement = variante.prix_supplement if variante else 0
                prix_unitaire = produit.prix_actuel + prix_supplement
                montant_sous_total += prix_unitaire * quantite

                lignes_a_creer.append(
                    {"produit": produit, "variante": variante, "quantite": quantite, "prix_unitaire": prix_unitaire}
                )

                if variante:
                    variante.stock -= quantite
                    variante.save(update_fields=["stock"])
                elif produit.gestion_stock:
                    produit.stock -= quantite
                    produit.save(update_fields=["stock"])
                produit.nombre_ventes += quantite
                produit.save(update_fields=["nombre_ventes"])

            frais_livraison = validated_data.pop("frais_livraison", 0) or 0
            montant_total = montant_sous_total + frais_livraison

            commande = Commande.objects.create(
                tenant=tenant,
                client=client,
                montant_sous_total=montant_sous_total,
                frais_livraison=frais_livraison,
                montant_total=montant_total,
                **validated_data,
            )

            for ligne in lignes_a_creer:
                LigneCommande.objects.create(commande=commande, **ligne)

            HistoriqueStatutCommande.objects.create(commande=commande, statut="en_attente", statut_precedent="")

        return commande