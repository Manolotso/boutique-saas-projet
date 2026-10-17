"""Calcul des frais de livraison : distance à vol d'oiseau (Haversine) + tarif du marchand.

Tout est isolé dans ce fichier : pour passer plus tard à une distance par la route
(OSRM / OpenRouteService), il suffira de remplacer `calculer_distance_km`.
"""
from decimal import Decimal, ROUND_CEILING
from math import radians, sin, cos, asin, sqrt

RAYON_TERRE_KM = 6371.0088
ARRONDI_AR = Decimal("100")  # les frais sont arrondis au 100 Ar supérieur


def calculer_distance_km(lat1, lng1, lat2, lng2):
    """Distance à vol d'oiseau entre deux points GPS (formule de Haversine), en km (Decimal, 2 décimales)."""
    phi1, phi2 = radians(lat1), radians(lat2)
    delta_phi = phi2 - phi1
    delta_lambda = radians(lng2 - lng1)
    a = sin(delta_phi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(delta_lambda / 2) ** 2
    distance = 2 * RAYON_TERRE_KM * asin(sqrt(a))
    return Decimal(str(round(distance, 2)))


def calculer_frais(tenant, distance_km):
    """Frais = base + prix/km × distance, arrondi au 100 Ar supérieur."""
    frais = tenant.frais_livraison_base + tenant.frais_par_km * distance_km
    return (frais / ARRONDI_AR).to_integral_value(rounding=ROUND_CEILING) * ARRONDI_AR


def estimer_livraison(tenant, lat, lng, montant_sous_total=None):
    """Estime la livraison d'une boutique vers le point (lat, lng).

    Retourne toujours un dict avec la clé `livrable`. Si livrable : `distance_km`, `frais`,
    `livraison_offerte`. Sinon : `raison` (livraison_inactive, boutique_non_localisee, hors_zone).
    """
    if not tenant.livraison_active:
        return {"livrable": False, "raison": "livraison_inactive"}
    if tenant.boutique_lat is None or tenant.boutique_lng is None:
        return {"livrable": False, "raison": "boutique_non_localisee"}

    distance = calculer_distance_km(
        float(tenant.boutique_lat), float(tenant.boutique_lng), float(lat), float(lng)
    )

    if distance > tenant.rayon_max_km:
        return {
            "livrable": False,
            "raison": "hors_zone",
            "distance_km": distance,
            "rayon_max_km": Decimal(tenant.rayon_max_km),
        }

    offerte = (
        tenant.seuil_livraison_gratuite is not None
        and montant_sous_total is not None
        and montant_sous_total >= tenant.seuil_livraison_gratuite
    )
    frais = Decimal("0") if offerte else calculer_frais(tenant, distance)

    return {
        "livrable": True,
        "distance_km": distance,
        "frais": frais,
        "livraison_offerte": offerte,
    }