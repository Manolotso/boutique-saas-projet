from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from apps.comptes.permissions import EstCommercant
from .models import Tenant
from .serializers import TenantSerializer


class MaBoutiqueView(generics.RetrieveUpdateAPIView):
    serializer_class = TenantSerializer
    permission_classes = [IsAuthenticated, EstCommercant]

    def get_object(self):
        return self.request.user.boutique