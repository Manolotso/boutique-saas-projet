import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { catalogueApi } from "../api/catalogue";

const PanierContext = createContext(null);

const cleStockage = (sousDomaine, identifiantUtilisateur) =>
  identifiantUtilisateur ? `panier_${sousDomaine}_${identifiantUtilisateur}` : `panier_${sousDomaine}`;

const cleArticle = (produitId, varianteId) => `${produitId}::${varianteId || "sans-variante"}`;

function lireStockage(cle) {
  try {
    const stocke = localStorage.getItem(cle);
    return stocke ? JSON.parse(stocke) : [];
  } catch {
    return [];
  }
}

export function PanierProvider({ children }) {
  const { sousDomaine } = useParams();
  const { utilisateur } = useAuth();
  const identifiant = utilisateur?.email || null;

  const [articles, setArticles] = useState([]);
  const [verification, setVerification] = useState({ enCours: false, changements: [] });

  // Empêche l'effet de sauvegarde d'écraser le panier juste après un chargement/fusion
  // (le state React n'est pas encore à jour au moment où les deux effets s'exécutent à la suite).
  const ignorerProchaineSauvegarde = useRef(false);

  useEffect(() => {
    if (!sousDomaine) return;
    ignorerProchaineSauvegarde.current = true;

    const clePersonnelle = cleStockage(sousDomaine, identifiant);

    if (identifiant) {
      const cleAnonyme = cleStockage(sousDomaine, null);
      const panierAnonyme = lireStockage(cleAnonyme);
      if (panierAnonyme.length > 0) {
        const panierCompte = lireStockage(clePersonnelle);
        const fusionne = [...panierCompte];
        panierAnonyme.forEach((articleAnonyme) => {
          const cle = cleArticle(articleAnonyme.produitId, articleAnonyme.varianteId);
          const existant = fusionne.find((a) => cleArticle(a.produitId, a.varianteId) === cle);
          if (existant) {
            existant.quantite = Math.min(
              existant.quantite + articleAnonyme.quantite,
              existant.stockDisponible ?? Infinity
            );
          } else {
            fusionne.push(articleAnonyme);
          }
        });
        localStorage.setItem(clePersonnelle, JSON.stringify(fusionne));
        localStorage.removeItem(cleAnonyme);
        setArticles(fusionne);
        return;
      }
    }

    setArticles(lireStockage(clePersonnelle));
  }, [sousDomaine, identifiant]);

  useEffect(() => {
    if (!sousDomaine) return;
    if (ignorerProchaineSauvegarde.current) {
      ignorerProchaineSauvegarde.current = false;
      return;
    }
    localStorage.setItem(cleStockage(sousDomaine, identifiant), JSON.stringify(articles));
  }, [articles, sousDomaine, identifiant]);

  const ajouterArticle = (produit, variante, quantiteDemandee = 1) => {
    const stockDisponible = variante
      ? variante.stock
      : produit.gestion_stock
      ? produit.stock
      : Infinity;

    let resultat = { quantiteAjoutee: quantiteDemandee, limitee: false, stockDisponible };

    setArticles((precedent) => {
      const cle = cleArticle(produit.id, variante?.id);
      const existant = precedent.find((a) => cleArticle(a.produitId, a.varianteId) === cle);
      const quantiteActuelle = existant?.quantite || 0;
      const quantiteVoulue = quantiteActuelle + quantiteDemandee;
      const quantiteFinale = Math.min(quantiteVoulue, stockDisponible);

      resultat = {
        quantiteAjoutee: quantiteFinale - quantiteActuelle,
        limitee: quantiteVoulue > stockDisponible,
        stockDisponible,
      };

      if (existant) {
        return precedent.map((a) =>
          cleArticle(a.produitId, a.varianteId) === cle ? { ...a, quantite: quantiteFinale, stockDisponible } : a
        );
      }

      const prixSupplement = variante?.prix_supplement ? Number(variante.prix_supplement) : 0;
      return [
        ...precedent,
        {
          produitId: produit.id,
          slug: produit.slug,
          nom: produit.nom,
          image: produit.images?.find((i) => i.est_principale)?.image || produit.images?.[0]?.image || null,
          prix: Number(produit.prix_actuel) + prixSupplement,
          varianteId: variante?.id || null,
          varianteLabel: variante ? [variante.taille, variante.couleur].filter(Boolean).join(" / ") : null,
          quantite: quantiteFinale,
          stockDisponible,
        },
      ];
    });

    return resultat;
  };

  const modifierQuantite = (produitId, varianteId, quantite) => {
    if (quantite <= 0) {
      retirerArticle(produitId, varianteId);
      return;
    }
    const cle = cleArticle(produitId, varianteId);
    setArticles((precedent) =>
      precedent.map((a) =>
        cleArticle(a.produitId, a.varianteId) === cle
          ? { ...a, quantite: Math.min(quantite, a.stockDisponible ?? Infinity) }
          : a
      )
    );
  };

  const retirerArticle = (produitId, varianteId) => {
    const cle = cleArticle(produitId, varianteId);
    setArticles((precedent) => precedent.filter((a) => cleArticle(a.produitId, a.varianteId) !== cle));
  };

  const viderPanier = () => setArticles([]);

  const verifierArticles = useCallback(async () => {
    if (!sousDomaine || articles.length === 0) return [];
    setVerification({ enCours: true, changements: [] });

    const changements = [];
    const articlesAJour = [];

    for (const article of articles) {
      try {
        const { data: produit } = await catalogueApi.obtenirProduitPublic(sousDomaine, article.slug);
        const variante = article.varianteId
          ? produit.variantes?.find((v) => v.id === article.varianteId)
          : null;

        if (article.varianteId && !variante) {
          changements.push(`"${article.nom}" (${article.varianteLabel}) n'est plus disponible et a été retiré.`);
          continue;
        }

        const stockDisponible = variante ? variante.stock : produit.gestion_stock ? produit.stock : Infinity;
        const prixSupplement = variante?.prix_supplement ? Number(variante.prix_supplement) : 0;
        const nouveauPrix = Number(produit.prix_actuel) + prixSupplement;

        if (stockDisponible <= 0) {
          changements.push(`"${article.nom}" est en rupture de stock et a été retiré du panier.`);
          continue;
        }

        let quantite = article.quantite;
        if (quantite > stockDisponible) {
          changements.push(`"${article.nom}" : quantité ajustée à ${stockDisponible} (stock limité).`);
          quantite = stockDisponible;
        }

        if (nouveauPrix !== article.prix) {
          changements.push(`Le prix de "${article.nom}" a changé (${article.prix.toLocaleString("fr-MG")} → ${nouveauPrix.toLocaleString("fr-MG")} Ar).`);
        }

        articlesAJour.push({ ...article, prix: nouveauPrix, quantite, stockDisponible });
      } catch {
        changements.push(`"${article.nom}" n'existe plus et a été retiré du panier.`);
      }
    }

    setArticles(articlesAJour);
    setVerification({ enCours: false, changements });
    return changements;
  }, [articles, sousDomaine]);

  const nombreArticles = useMemo(() => articles.reduce((t, a) => t + a.quantite, 0), [articles]);
  const montantTotal = useMemo(() => articles.reduce((t, a) => t + a.quantite * a.prix, 0), [articles]);

  return (
    <PanierContext.Provider
      value={{
        articles,
        ajouterArticle,
        modifierQuantite,
        retirerArticle,
        viderPanier,
        verifierArticles,
        verification,
        nombreArticles,
        montantTotal,
      }}
    >
      {children}
    </PanierContext.Provider>
  );
}

export function usePanier() {
  const ctx = useContext(PanierContext);
  if (!ctx) throw new Error("usePanier doit être utilisé dans un <PanierProvider>");
  return ctx;
}