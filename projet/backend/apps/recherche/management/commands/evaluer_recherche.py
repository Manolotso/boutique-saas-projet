import csv

from django.core.management.base import BaseCommand
from pgvector.django import CosineDistance

from apps.recherche.services import (
    K_RRF,
    LIMITE_CANDIDATS,
    _produits_publics,
    filtrer_par_similarite,
    recherche_plein_texte,
    vectoriser_requete,
)
from apps.tenants.models import Tenant

# (plancher, marge). marge None = ancien comportement, seuil fixe seul.
CONFIGS = [
    (seuil, marge)
    for seuil in (0.25, 0.35)
    for marge in (None, 0.20, 0.15, 0.10)
]

# (requête, produits attendus). Liste vide = requête hors sujet : on mesure le bruit.
REQUETES = [
    ("short", ["Short de sport noir", "Bermuda en lin beige"]),
    ("bermuda", ["Bermuda en lin beige", "Short de sport noir"]),
    ("sac", ["Sac à main en cuir", "Sac en raphia tressé", "Sac à dos de randonnée", "Pochette de soirée"]),
    ("sac en raphia", ["Sac en raphia tressé"]),
    ("habit pour la plage", ["Tongs de plage", "Sac en raphia tressé", "Bermuda en lin beige", "Lunettes de soleil", "Casquette en coton"]),
    ("chaussures de sport", ["Baskets de running"]),
    ("vêtement chaud pour l'hiver", ["Pull en laine torsadé", "Écharpe en laine", "Bottines en cuir noir"]),
    ("tenue de soirée", ["Robe de soirée noire", "Pochette de soirée"]),
    ("jean", ["Jean droit bleu"]),
    ("protection contre le soleil", ["Casquette en coton", "Lunettes de soleil"]),
    ("équipement de fitness", ["Legging de sport", "Short de sport noir", "Baskets de running"]),
    ("robe", ["Robe d'été fleurie", "Robe longue en lin", "Robe de soirée noire"]),
    ("randonée", ["Sac à dos de randonnée"]),  # faute volontaire
    ("sandale", ["Sandales en cuir", "Tongs de plage"]),
    ("accessoire en cuir", ["Ceinture en cuir", "Sac à main en cuir"]),
    ("pull en laine", ["Pull en laine torsadé", "Écharpe en laine"]),
    ("t-shirt basique", ["T-shirt en coton blanc", "Débardeur côtelé"]),
    ("chaussure pour la plage", ["Tongs de plage", "Sandales en cuir"]),
    ("ordinateur", []),
    ("voiture", []),
]


def fusion_rrf(*listes):
    scores = {}
    for liste in listes:
        for rang, nom in enumerate(liste, start=1):
            scores[nom] = scores.get(nom, 0) + 1 / (K_RRF + rang)
    return sorted(scores, key=scores.get, reverse=True)


def mesures(resultats, attendus):
    top5 = resultats[:5]
    hits = len(set(top5) & set(attendus))
    precision = hits / min(5, len(attendus))
    rappel = hits / len(attendus)
    rr = next((1 / r for r, nom in enumerate(resultats, 1) if nom in attendus), 0.0)
    return precision, rappel, rr


class Command(BaseCommand):
    help = "Compare plein texte, sémantique et hybride sur un jeu de requêtes"

    def add_arguments(self, parser):
        parser.add_argument("sous_domaine")
        parser.add_argument("--csv", help="Chemin du fichier CSV à écrire")

    def handle(self, *args, **opts):
        tenant = Tenant.objects.get(sous_domaine=opts["sous_domaine"])
        publics = _produits_publics(tenant)
        noms = {p.id: p.nom for p in publics}

        resultats = {}

        def noter(methode, liste, attendus):
            entree = resultats.setdefault(methode, {"pertinentes": [], "bruit": []})
            if attendus:
                entree["pertinentes"].append((*mesures(liste, attendus), len(liste)))
            else:
                entree["bruit"].append(len(liste))

        for requete, attendus in REQUETES:
            plein = [noms[i] for i in recherche_plein_texte(tenant, requete)]
            noter("plein texte", plein, attendus)

            vecteur = vectoriser_requete(requete)
            classement = list(
                publics.filter(embedding__isnull=False)
                .annotate(d=CosineDistance("embedding__vecteur", vecteur))
                .order_by("d")
                .values_list("id", "d")
            )
            for seuil, marge in CONFIGS:
                sem = [noms[i] for i in filtrer_par_similarite(classement, seuil, marge)]
                etiquette = f"{seuil:.2f} " + (f"marge {marge:.2f}" if marge else "sans marge")
                noter(f"sémantique {etiquette}", sem, attendus)
                noter(f"hybride {etiquette}", fusion_rrf(plein, sem), attendus)

        lignes = []
        for methode, r in resultats.items():
            n = len(r["pertinentes"])
            moyenne = lambda k: sum(x[k] for x in r["pertinentes"]) / n
            bruit = sum(r["bruit"]) / len(r["bruit"]) if r["bruit"] else 0
            lignes.append([
                methode, round(moyenne(0), 3), round(moyenne(1), 3),
                round(moyenne(2), 3), round(moyenne(3), 1), round(bruit, 1),
            ])

        entete = ["méthode", "P@5", "Rappel@5", "MRR", "nb résultats moyen", "bruit hors sujet"]
        self.stdout.write("  ".join(f"{c:<24}" for c in entete))
        for ligne in lignes:
            self.stdout.write("  ".join(f"{str(c):<24}" for c in ligne))

        if opts["csv"]:
            with open(opts["csv"], "w", newline="", encoding="utf-8-sig") as f:
                w = csv.writer(f, delimiter=";")
                w.writerow(entete)
                w.writerows(lignes)
            self.stdout.write(f"\nCSV écrit : {opts['csv']}")