"""Règles d'abonnement : un seul endroit répond à « que peut faire cette boutique avec son plan ? ».

Tout le reste de l'application (création de produit, paiements, page Abonnement) passe par ici,
pour que les limites soient appliquées côté serveur et de la même façon partout.
"""
from decimal import Decimal
from rest_framework.exceptions import PermissionDenied, ValidationError

CODE_PLAN_ESSAI = "essai"
STATUTS_BLOQUES = ("expire", "annule")  # ajouts bloqués ; la boutique et les commandes continuent


def abonnement_courant(tenant):
    """Dernier abonnement de la boutique. Si son essai est terminé, on le passe à « expiré »
    (mise à jour au moment où on le consulte : pas besoin de tâche planifiée)."""
    abonnement = tenant.abonnements.select_related("plan").order_by("-date_debut").first()
    if abonnement and abonnement.essai_expire():
        abonnement.statut = "expire"
        abonnement.date_fin = abonnement.date_fin_essai
        abonnement.save(update_fields=["statut", "date_fin", "date_modification"])
    return abonnement


def produits_utilises(tenant):
    """Produits comptés dans la limite du plan : tous ceux qui ne sont pas supprimés (archivés compris,
    sinon on contournerait la limite en archivant)."""
    from apps.catalogue.models import Produit  # import local : évite un import circulaire

    return Produit.objects.filter(tenant=tenant, est_supprime=False).count()


def _message_blocage(statut, plan):
    if plan.code == CODE_PLAN_ESSAI:
        return (
            "Ton essai gratuit est terminé : choisis un plan pour pouvoir ajouter de nouveaux produits. "
            "Ta boutique reste en ligne et tes commandes continuent normalement."
        )
    if statut == "annule":
        return "Ton abonnement est annulé : choisis un plan pour pouvoir ajouter de nouveaux produits."
    return "Ton abonnement a expiré : renouvelle-le pour pouvoir ajouter de nouveaux produits."


def usage_de(abonnement):
    """État des limites d'un abonnement : produits utilisés, maximum, et si on peut encore en ajouter."""
    plan = abonnement.plan
    utilises = produits_utilises(abonnement.tenant)
    maximum = plan.nombre_produits_max  # None = illimité
    statut = "expire" if abonnement.essai_expire() else abonnement.statut

    bloque = statut in STATUTS_BLOQUES
    limite_atteinte = maximum is not None and utilises >= maximum

    if bloque:
        message = _message_blocage(statut, plan)
    elif limite_atteinte:
        message = (
            f"Tu as atteint la limite de {maximum} produits de ton plan {plan.nom}. "
            "Passe à un plan supérieur pour en ajouter."
        )
    else:
        message = ""

    return {
        "produits_utilises": utilises,
        "produits_max": maximum,
        "peut_ajouter": not bloque and not limite_atteinte,
        "bloque": bloque,
        "message": message,
    }


def usage(tenant):
    abonnement = abonnement_courant(tenant)
    if abonnement is None:
        # Boutique sans abonnement (ancienne boutique) : on ne la bloque pas.
        return {
            "produits_utilises": produits_utilises(tenant),
            "produits_max": None,
            "peut_ajouter": True,
            "bloque": False,
            "message": "",
        }
    return usage_de(abonnement)


def verifier_peut_ajouter_produit(tenant):
    """À appeler avant de créer un produit : refuse (403) si l'essai est terminé ou la limite atteinte."""
    etat = usage(tenant)
    if not etat["peut_ajouter"]:
        raise PermissionDenied(etat["message"])


def verifier_changement_de_plan(tenant, nouveau_plan):
    """Refuse une rétrogradation si la boutique a plus de produits que le nouveau plan n'en autorise."""
    maximum = nouveau_plan.nombre_produits_max
    if maximum is None:
        return
    utilises = produits_utilises(tenant)
    if utilises > maximum:
        raise ValidationError({
            "plan_code": (
                f"Tu as {utilises} produits, mais le plan {nouveau_plan.nom} en autorise {maximum}. "
                f"Supprime-en au moins {utilises - maximum} avant de changer de plan."
            )
        })


def taux_commission(tenant):
    """Commission par vente du plan de la boutique (par exemple 0.0200 pour 2 %)."""
    abonnement = abonnement_courant(tenant)
    return abonnement.plan.commission_transaction if abonnement else Decimal("0")