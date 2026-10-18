from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify

from apps.catalogue.models import Categorie, Produit
from apps.recherche.services import indexer_produits
from apps.tenants.models import Tenant

TAG = "demo-varie"

# (nom, catégorie, marque, tags, description, prix, prix_promo, stock, ventes, mis en avant)
PRODUITS = [
    # --- Téléphones et audio ---
    ("Smartphone Android 128 Go", "Téléphones et audio", "Samsung", ["smartphone", "android"],
     "Smartphone avec écran de 6,5 pouces, 128 Go de stockage et triple capteur photo. Batterie pour une journée complète.", 1250000, 1090000, 12, 22, True),
    ("Écouteurs Bluetooth sans fil", "Téléphones et audio", "JBL", ["écouteurs", "bluetooth", "audio"],
     "Écouteurs intra-auriculaires sans fil avec boîtier de charge. Bonne autonomie pour la musique et les appels.", 135000, None, 30, 40, False),
    ("Enceinte portable étanche", "Téléphones et audio", "JBL", ["enceinte", "bluetooth", "étanche"],
     "Enceinte Bluetooth résistante à l'eau et à la poussière. Pour la plage, les voyages et les fêtes.", 220000, 189000, 15, 18, False),
    ("Chargeur rapide USB-C 65 W", "Téléphones et audio", "Anker", ["chargeur", "usb-c"],
     "Chargeur mural compact à charge rapide, compatible smartphones, tablettes et ordinateurs portables.", 75000, None, 40, 25, False),
    ("Batterie externe 20 000 mAh", "Téléphones et audio", "Xiaomi", ["batterie externe", "powerbank"],
     "Batterie portable de grande capacité avec deux ports USB. Recharge plusieurs fois un smartphone.", 95000, None, 25, 33, False),
    ("Montre connectée sport", "Téléphones et audio", "Huawei", ["montre", "connectée", "sport"],
     "Montre avec suivi du rythme cardiaque, du sommeil et des activités sportives. Notifications du téléphone.", 390000, 340000, 10, 12, True),
    ("Tablette 10 pouces", "Téléphones et audio", "Lenovo", ["tablette", "écran"],
     "Tablette de 10 pouces, 64 Go, adaptée à la lecture, aux vidéos et à la navigation web.", 780000, None, 8, 6, False),
    ("Téléviseur LED 43 pouces", "Téléphones et audio", "TCL", ["télévision", "smart tv"],
     "Téléviseur Full HD avec applications de streaming intégrées et trois ports HDMI.", 1450000, None, 5, 4, False),

    # --- Composants PC ---
    ("Processeur 8 cœurs 3,6 GHz", "Composants PC", "AMD", ["processeur", "cpu", "gaming"],
     "Processeur 8 cœurs et 16 threads pour le jeu et la création de contenu. Ventirad fourni.", 1150000, None, 6, 7, False),
    ("Carte graphique 8 Go GDDR6", "Composants PC", "NVIDIA", ["carte graphique", "gpu", "gaming"],
     "Carte graphique dédiée pour jouer en Full HD et en 1440p, avec 8 Go de mémoire vidéo.", 2650000, 2390000, 4, 5, True),
    ("Mémoire RAM DDR4 16 Go", "Composants PC", "Corsair", ["ram", "mémoire", "ddr4"],
     "Barrette de mémoire vive DDR4 de 16 Go à 3200 MHz pour ordinateurs de bureau.", 210000, None, 20, 14, False),
    ("Disque SSD NVMe 500 Go", "Composants PC", "Kingston", ["ssd", "stockage", "nvme"],
     "SSD NVMe très rapide pour accélérer le démarrage et le chargement des programmes.", 240000, None, 18, 21, False),
    ("Disque dur externe 1 To", "Composants PC", "Seagate", ["disque dur", "stockage", "sauvegarde"],
     "Disque dur portable USB 3.0 pour sauvegarder photos, documents et vidéos.", 260000, None, 14, 17, False),
    ("Carte mère ATX", "Composants PC", "ASUS", ["carte mère", "atx"],
     "Carte mère ATX avec emplacements DDR4, port M.2 NVMe et Wi-Fi intégré.", 680000, None, 5, 3, False),
    ("Alimentation 650 W 80+ Bronze", "Composants PC", "Corsair", ["alimentation", "pc"],
     "Bloc d'alimentation 650 watts certifié 80+ Bronze, câbles modulaires.", 320000, None, 9, 8, False),
    ("Boîtier PC moyen tour", "Composants PC", "Cooler Master", ["boîtier", "pc", "ventilateur"],
     "Boîtier moyen tour avec façade aérée, vitre latérale et trois ventilateurs inclus.", 290000, 259000, 7, 5, False),
    ("Ventirad processeur", "Composants PC", "Cooler Master", ["refroidissement", "ventirad"],
     "Ventirad à caloducs pour refroidir efficacement un processeur, silencieux en usage courant.", 120000, None, 16, 9, False),

    # --- Périphériques et ordinateurs ---
    ("Clavier mécanique rétroéclairé", "Périphériques", "Logitech", ["clavier", "mécanique", "gaming"],
     "Clavier mécanique avec touches rétroéclairées, adapté au jeu et à la frappe longue.", 280000, None, 12, 15, False),
    ("Souris sans fil ergonomique", "Périphériques", "Logitech", ["souris", "sans fil"],
     "Souris sans fil silencieuse à forme ergonomique, autonomie de plusieurs mois.", 85000, None, 35, 28, False),
    ("Moniteur 24 pouces Full HD", "Périphériques", "Samsung", ["écran", "moniteur"],
     "Écran 24 pouces Full HD à 75 Hz avec entrées HDMI et VGA, pour le bureau ou le jeu.", 640000, 590000, 8, 10, True),
    ("Webcam HD avec micro", "Périphériques", "Logitech", ["webcam", "visioconférence"],
     "Webcam 1080p avec microphone intégré pour les réunions et les cours en ligne.", 130000, None, 15, 11, False),
    ("Ordinateur portable 15 pouces", "Périphériques", "HP", ["ordinateur portable", "laptop"],
     "Ordinateur portable de 15,6 pouces, 8 Go de RAM et 256 Go de SSD, pour le travail et les études.", 2150000, None, 6, 9, True),

    # --- Soins du visage ---
    ("Crème hydratante visage", "Soins du visage", "Nivea", ["hydratant", "visage", "peau sèche"],
     "Crème légère qui hydrate la peau toute la journée. Convient aux peaux normales à sèches.", 28000, None, 40, 35, False),
    ("Sérum à la vitamine C", "Soins du visage", "The Ordinary", ["sérum", "vitamine c", "éclat"],
     "Sérum antioxydant qui unifie le teint et donne de l'éclat. À appliquer le matin.", 65000, 55000, 22, 24, True),
    ("Crème solaire SPF 50", "Soins du visage", "La Roche-Posay", ["solaire", "protection", "spf"],
     "Crème solaire visage à haute protection contre les UVA et UVB, texture non grasse.", 70000, None, 25, 19, False),
    ("Masque purifiant à l'argile", "Soins du visage", "Garnier", ["masque", "argile", "peau grasse"],
     "Masque à l'argile qui nettoie les pores et matifie les peaux mixtes à grasses.", 22000, None, 30, 16, False),

    # --- Maquillage ---
    ("Rouge à lèvres mat rouge", "Maquillage", "Maybelline", ["rouge à lèvres", "maquillage", "mat"],
     "Rouge à lèvres à fini mat, couleur rouge intense et tenue longue durée.", 32000, None, 28, 26, False),
    ("Fond de teint fluide", "Maquillage", "L'Oréal", ["fond de teint", "maquillage", "teint"],
     "Fond de teint fluide à couvrance moyenne, fini naturel, disponible en plusieurs teintes.", 55000, None, 20, 20, False),
    ("Mascara volume intense", "Maquillage", "Maybelline", ["mascara", "cils", "maquillage"],
     "Mascara qui épaissit et allonge les cils sans les faire coller.", 30000, None, 34, 31, False),
    ("Palette de fards à paupières", "Maquillage", "Revolution", ["fard à paupières", "palette", "maquillage"],
     "Palette de 18 teintes mates et irisées pour des maquillages de jour comme de soirée.", 48000, 42000, 18, 13, False),
    ("Vernis à ongles rose", "Maquillage", "Essie", ["vernis", "ongles", "manucure"],
     "Vernis à ongles rose pâle, brillant, séchage rapide.", 18000, None, 45, 22, False),

    # --- Soins du corps et cheveux ---
    ("Parfum floral femme 50 ml", "Soins du corps et cheveux", "Yves Rocher", ["parfum", "femme", "floral"],
     "Eau de parfum aux notes florales et fruitées, flacon de 50 ml.", 145000, 125000, 14, 17, True),
    ("Huile de coco pure", "Soins du corps et cheveux", "Artisanat local", ["huile", "coco", "naturel", "cheveux"],
     "Huile de coco pressée à froid pour nourrir les cheveux et hydrater la peau.", 25000, None, 50, 38, True),
    ("Beurre de karité naturel", "Soins du corps et cheveux", "Artisanat local", ["karité", "naturel", "peau sèche"],
     "Beurre de karité brut qui nourrit en profondeur les peaux et les cheveux secs.", 20000, None, 40, 27, False),
    ("Shampoing nourrissant", "Soins du corps et cheveux", "Dove", ["shampoing", "cheveux", "nourrissant"],
     "Shampoing qui répare et nourrit les cheveux secs ou abîmés.", 24000, None, 38, 29, False),
    ("Gel douche parfumé", "Soins du corps et cheveux", "Dove", ["gel douche", "corps", "hygiène"],
     "Gel douche doux au parfum frais, convient à un usage quotidien.", 15000, None, 60, 41, False),
    ("Déodorant roll-on", "Soins du corps et cheveux", "Nivea", ["déodorant", "hygiène"],
     "Déodorant roll-on protection 48 heures, sans alcool.", 12000, None, 55, 36, False),
]


class Command(BaseCommand):
    help = "Ajoute des produits variés (électronique, composants PC, cosmétiques) ou les supprime avec --nettoyer"

    def add_arguments(self, parser):
        parser.add_argument("sous_domaine")
        parser.add_argument("--nettoyer", action="store_true")

    def handle(self, *args, **opts):
        try:
            tenant = Tenant.objects.get(sous_domaine=opts["sous_domaine"])
        except Tenant.DoesNotExist:
            raise CommandError("Boutique introuvable.")

        if opts["nettoyer"]:
            produits = Produit.objects.filter(tenant=tenant, tags__contains=[TAG])
            n = produits.count()
            produits.delete()
            Categorie.objects.filter(tenant=tenant, description=TAG).delete()
            self.stdout.write(f"{n} produit(s) de démonstration supprimé(s).")
            return

        categories = {}
        for nom in dict.fromkeys(p[1] for p in PRODUITS):
            categories[nom], _ = Categorie.objects.get_or_create(
                tenant=tenant, slug=slugify(nom), defaults={"nom": nom, "description": TAG}
            )

        crees = 0
        for nom, cat, marque, tags, description, prix, promo, stock, ventes, avant in PRODUITS:
            _, cree = Produit.objects.get_or_create(
                tenant=tenant, slug=slugify(nom),
                defaults={
                    "nom": nom, "categorie": categories[cat], "marque": marque,
                    "tags": [TAG] + tags, "description": description,
                    "prix": prix, "prix_promo": promo, "stock": stock,
                    "nombre_ventes": ventes, "est_mis_en_avant": avant,
                    "statut": "publie",
                },
            )
            crees += cree
        self.stdout.write(f"{crees} produit(s) créé(s), {len(PRODUITS) - crees} déjà présent(s).")

        n = indexer_produits(
            Produit.objects.filter(tenant=tenant, tags__contains=[TAG]).select_related("categorie")
        )
        self.stdout.write(f"{n} embedding(s) calculé(s) en complément.")