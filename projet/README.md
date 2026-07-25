# Boutique SaaS Madagascar — Environnement de développement

Ce dépôt contient le squelette du projet : backend **Django + DRF**, frontend **React + Tailwind**, base **PostgreSQL**, orchestrés avec **Docker**.

## 0. Prérequis à installer sur ta machine

| Outil | Version conseillée | Vérifier avec |
|---|---|---|
| Python | 3.12+ | `python3 --version` |
| Node.js | 20+ | `node --version` |
| Docker Desktop | dernière version | `docker --version` |
| Git | — | `git --version` |

## 1. Récupérer le projet et l'initialiser dans Git

```bash
cd boutique-saas
git init
git add .
git commit -m "Initialisation du projet : squelette Django + React"
```

Crée ensuite un dépôt vide sur GitHub et pousse-le :
```bash
git remote add origin <URL_DE_TON_DEPOT_GITHUB>
git push -u origin main
```

## 2. Configurer les variables d'environnement

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
Ouvre `backend/.env` et change au minimum `SECRET_KEY` (une longue chaîne aléatoire).

## 3. Lancer la base de données + le backend avec Docker

C'est la manière la plus simple : pas besoin d'installer PostgreSQL ni les dépendances Python à la main.

```bash
docker compose up --build
```

Cela démarre :
- **PostgreSQL** sur le port `5432`
- **Django** sur le port `8000`

Laisse ce terminal ouvert. Dans un **second terminal**, applique les migrations et crée ton compte admin :

```bash
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

Vérifie que ça fonctionne : ouvre http://localhost:8000/admin/ dans ton navigateur — tu dois voir l'interface d'administration Django.

### Alternative sans Docker (si tu préfères tout en local)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # sous Windows : venv\Scripts\activate
pip install -r requirements.txt
# il te faut alors un PostgreSQL local, et POSTGRES_HOST=localhost dans .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## 4. Lancer le frontend React

Le frontend tourne **en dehors de Docker** en développement, pour profiter du rechargement à chaud (hot reload) de Vite, qui est plus rapide qu'en conteneur.

```bash
cd frontend
npm install
npm run dev
```

Ouvre http://localhost:5173 — tu dois voir la page de test avec le message *"✅ Backend Django joignable."* (si le backend Docker tourne bien).

## 5. Où travailler pour développer chaque fonctionnalité

Le squelette est déjà organisé selon l'architecture du cahier des charges :

```
backend/
  config/            → réglages globaux Django (settings, urls)
  apps/
    tenants/         → modèle Tenant (boutique) — déjà créé
    catalogue/       → modèles Produit, VarianteProduit — déjà créés
    commandes/       → modèles Commande, LigneCommande — déjà créés
    paiements/       → modèle Paiement — déjà créé
    abonnements/     → modèle Abonnement — déjà créé
frontend/
  src/
    api/client.js    → client Axios pré-configuré (JWT automatique)
    components/      → composants réutilisables (à créer)
    pages/           → une page par écran (à créer)
```

Chaque app backend a déjà : `models.py` (rempli), et `views.py` / `serializers.py` / `urls.py` (vides, à toi de les remplir avec des `ModelViewSet` DRF au fur et à mesure).

## 6. Prochaines étapes concrètes (dans l'ordre)

1. `python manage.py makemigrations && python manage.py migrate` pour créer les tables en base à partir des modèles fournis.
2. Dans `apps/tenants/serializers.py` et `views.py` : créer un `TenantSerializer` + `TenantViewSet`, puis le brancher dans `urls.py`. Faire de même pour `catalogue` (Produit).
3. Tester chaque endpoint avec l'interface DRF navigable (va directement sur http://localhost:8000/api/catalogue/ dans le navigateur une fois la route branchée) ou avec Postman/Insomnia.
4. Côté frontend, créer une première page `pages/Boutique.jsx` qui appelle `GET /api/catalogue/` via `apiClient` et affiche la liste des produits.
5. Une fois le flux "lister les produits" fonctionnel de bout en bout, avancer vers le panier, la commande, puis l'intégration Mobile Money (sandbox).

## 7. Commandes utiles à retenir

```bash
docker compose up              # démarrer backend + base
docker compose down            # tout arrêter
docker compose logs -f backend # voir les logs du backend en direct
docker compose exec backend python manage.py <commande>   # exécuter une commande Django dans le conteneur
```















3 commandes à lancé : 
  - Pour lancé : docker compose up et pour arrêter : docker compose down
  - npm run dev

  - Et pour migrer : * docker compose exec backend python manage.py makemigrations
                    * docker compose exec backend python manage.py migrate
                    

