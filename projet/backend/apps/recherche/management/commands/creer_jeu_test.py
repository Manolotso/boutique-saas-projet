from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify

from apps.catalogue.models import Categorie, Produit
from apps.recherche.models import Evenement
from apps.recherche.services import indexer_produits
from apps.tenants.models import Tenant

TAG = "jeu-de-test"
PREFIXE_VISITEUR = "test-"

# (nom, catégorie, marque, tags, description, prix, ventes, mis en avant)
PRODUITS = [
    ("Robe d'été fleurie", "Robes", "Zara", ["été", "fleurs"],
     "Robe légère à motif fleuri, coupe évasée au genou. Convient aux journées chaudes et aux sorties.", 65000, 14, True),
    ("Robe longue en lin", "Robes", "Mango", ["lin", "naturel"],
     "Robe longue en lin respirant, ceinture à nouer à la taille. Pour l'été ou les cérémonies simples.", 85000, 9, False),
    ("Robe de soirée noire", "Robes", "H&M", ["soirée", "élégant"],
     "Robe noire près du corps avec dos ouvert. Destinée aux soirées et aux événements habillés.", 120000, 5, False),
    ("T-shirt en coton blanc", "Hauts", "Uniqlo", ["basique", "coton"],
     "T-shirt uni à col rond en coton doux. Pièce de base pour un usage quotidien.", 25000, 30, False),
    ("Chemise en lin à rayures", "Hauts", "Zara", ["lin", "rayures"],
     "Chemise à manches longues en lin rayé, col classique. Adaptée à la chaleur et au bureau décontracté.", 55000, 11, False),
    ("Pull en laine torsadé", "Hauts", "Mango", ["hiver", "laine"],
     "Pull chaud en laine à mailles torsadées. Se porte pendant la saison fraîche.", 90000, 7, False),
    ("Débardeur côtelé", "Hauts", "Shein", ["été", "basique"],
     "Débardeur ajusté en maille côtelée, fines bretelles. Se porte seul ou sous une veste.", 18000, 20, False),
    ("Jean droit bleu", "Pantalons et shorts", "Levi's", ["denim", "classique"],
     "Jean coupe droite en denim bleu moyen, taille haute. Usage quotidien, toutes saisons.", 110000, 25, True),
    ("Bermuda en lin beige", "Pantalons et shorts", "Zara", ["lin", "été"],
     "Bermuda en lin beige à taille élastique, longueur aux genoux. Pour les journées chaudes.", 45000, 8, False),
    ("Short de sport noir", "Pantalons et shorts", "Nike", ["sport", "running"],
     "Short léger et respirant avec poche zippée. Conçu pour la course et l'entraînement.", 35000, 12, False),
    ("Pantalon cargo kaki", "Pantalons et shorts", "H&M", ["streetwear", "poches"],
     "Pantalon ample kaki avec larges poches latérales. Style décontracté pour la ville.", 70000, 6, False),
    ("Legging de sport", "Pantalons et shorts", "Adidas", ["sport", "fitness"],
     "Legging élastique taille haute, tissu qui évacue la transpiration. Pour le fitness et le yoga.", 40000, 15, False),
    ("Baskets de running", "Chaussures", "Nike", ["sport", "course"],
     "Chaussures de course avec semelle amortissante et tige en maille aérée. Pour l'entraînement régulier.", 180000, 10, True),
    ("Sandales en cuir", "Chaussures", "Birkenstock", ["été", "cuir"],
     "Sandales plates en cuir avec brides réglables. Confortables pour la marche en été.", 75000, 13, False),
    ("Bottines en cuir noir", "Chaussures", "Dr. Martens", ["hiver", "cuir"],
     "Bottines montantes en cuir noir à lacets, semelle épaisse. Pour la ville en saison fraîche.", 220000, 4, False),
    ("Tongs de plage", "Chaussures", "Havaianas", ["plage", "été"],
     "Tongs légères en caoutchouc, résistantes à l'eau. Pour la plage et la piscine.", 15000, 22, False),
    ("Casquette en coton", "Accessoires", "New Era", ["casquette", "soleil"],
     "Casquette à visière courbée en coton, réglable à l'arrière. Protège du soleil.", 22000, 16, False),
    ("Ceinture en cuir", "Accessoires", "Levi's", ["cuir", "classique"],
     "Ceinture en cuir marron avec boucle métallique. S'associe aux jeans et aux pantalons.", 30000, 9, False),
    ("Écharpe en laine", "Accessoires", "Mango", ["hiver", "laine"],
     "Écharpe longue en laine douce, bords frangés. Protège du froid.", 35000, 6, False),
    ("Lunettes de soleil", "Accessoires", "Ray-Ban", ["soleil", "été"],
     "Lunettes de soleil à monture noire et verres teintés avec filtre UV. Usage quotidien.", 95000, 11, False),
    ("Sac à main en cuir", "Sacs", "Michael Kors", ["cuir", "élégant"],
     "Sac à main structuré en cuir avec bandoulière amovible et deux compartiments.", 250000, 7, True),
    ("Sac en raphia tressé", "Sacs", "Artisanat local", ["raphia", "fait main", "naturel"],
     "Sac tressé à la main en fibres de raphia, anses solides. Pour la plage et les courses.", 45000, 18, True),
    ("Sac à dos de randonnée", "Sacs", "Quechua", ["randonnée", "sport"],
     "Sac à dos de 30 litres avec dos ventilé et sangles rembourrées. Pour les sorties en montagne.", 130000, 5, False),
    ("Pochette de soirée", "Sacs", "Zara", ["soirée", "élégant"],
     "Petite pochette rigide dorée avec chaîne amovible. Se porte lors des soirées.", 50000, 3, False),
]

# Visiteurs fictifs : (type d'événement, nom du produit)
SCENARIOS = {
    "test-robes": [
        ("vue", "Robe d'été fleurie"), ("vue", "Robe longue en lin"),
        ("ajout_panier", "Robe longue en lin"), ("vue", "Sandales en cuir"),
    ],
    "test-sport": [
        ("vue", "Baskets de running"), ("vue", "Legging de sport"),
        ("ajout_panier", "Short de sport noir"), ("vue", "Sac à dos de randonnée"),
    ],
    "test-hiver": [
        ("vue", "Pull en laine torsadé"), ("vue", "Écharpe en laine"),
        ("vue", "Bottines en cuir noir"),
    ],
}


class Command(BaseCommand):
    help = "Crée (ou supprime avec --nettoyer) un jeu de produits de mode et des visiteurs fictifs"

    def add_arguments(self, parser):
        parser.add_argument("sous_domaine")
        parser.add_argument("--nettoyer", action="store_true")

    def handle(self, *args, **opts):
        try:
            tenant = Tenant.objects.get(sous_domaine=opts["sous_domaine"])
        except Tenant.DoesNotExist:
            raise CommandError("Boutique introuvable.")

        if opts["nettoyer"]:
            return self.nettoyer(tenant)

        categories = {}
        for nom in dict.fromkeys(p[1] for p in PRODUITS):
            categories[nom], _ = Categorie.objects.get_or_create(
                tenant=tenant, slug=slugify(nom), defaults={"nom": nom, "description": TAG}
            )

        crees = 0
        par_nom = {}
        for nom, cat, marque, tags, description, prix, ventes, avant in PRODUITS:
            produit, cree = Produit.objects.get_or_create(
                tenant=tenant, slug=slugify(nom),
                defaults={
                    "nom": nom, "categorie": categories[cat], "marque": marque,
                    "tags": [TAG] + tags, "description": description, "prix": prix,
                    "stock": 10, "nombre_ventes": ventes, "est_mis_en_avant": avant,
                    "statut": "publie",
                },
            )
            crees += cree
            par_nom[nom] = produit
        self.stdout.write(f"{crees} produit(s) créé(s), {len(PRODUITS) - crees} déjà présent(s).")

        self.stdout.write("Calcul des embeddings (le modèle peut mettre un moment à charger)...")
        n = indexer_produits(
            Produit.objects.filter(tenant=tenant, tags__contains=[TAG]).select_related("categorie")
        )
        self.stdout.write(f"{n} embedding(s) calculé(s).")

        Evenement.objects.filter(tenant=tenant, visiteur_id__startswith=PREFIXE_VISITEUR).delete()
        evenements = [
            Evenement(tenant=tenant, produit=par_nom[nom], visiteur_id=visiteur, type=type_)
            for visiteur, actions in SCENARIOS.items()
            for type_, nom in actions
        ]
        Evenement.objects.bulk_create(evenements)
        self.stdout.write(f"{len(evenements)} événement(s) créé(s) pour {len(SCENARIOS)} visiteurs fictifs.")

    def nettoyer(self, tenant):
        Evenement.objects.filter(tenant=tenant, visiteur_id__startswith=PREFIXE_VISITEUR).delete()
        produits = Produit.objects.filter(tenant=tenant, tags__contains=[TAG])
        n = produits.count()
        produits.delete()  # supprime aussi les embeddings et les événements liés (cascade)
        Categorie.objects.filter(tenant=tenant, description=TAG).delete()
        self.stdout.write(f"{n} produit(s) de test supprimé(s).")