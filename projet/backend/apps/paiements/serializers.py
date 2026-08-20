from rest_framework import serializers
from .models import TauxChange, Paiement


class TauxChangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TauxChange
        fields = ["code_devise", "taux", "date_maj"]

class PaiementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paiement
        fields = [
            "id", "operateur", "montant", "montant_frais", "montant_net",
            "statut", "reference_transaction",
            "date_expiration_code", "nombre_tentatives", "max_tentatives",
            "date_transaction",
        ]
        read_only_fields = fields