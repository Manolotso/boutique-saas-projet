import { useEffect, useMemo, useState } from "react";
import { Package, Search, SearchX, RotateCcw, X } from "lucide-react";
import { catalogueApi } from "../../api/catalogue";
import { useBoutiquePublique } from "../../context/BoutiquePubliqueContext";
import ProduitCarte from "../../components/boutique/ProduitCarte";
import Skeleton from "../../components/ui/Skeleton";
import ProduitQuickView from "../../components/boutique/ProduitQuickView";

// Même largeur que le header, l'accueil et le footer
const CONTENEUR = "w-full px-4 sm:px-6 lg:px-8 2xl:px-12";

// La grille s'adapte à la largeur : 2 colonnes sur mobile, jusqu'à 6 sur grand écran
const GRILLE = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

// Recherche défensive : le nom exact du champ produit n'est pas confirmé,
// on tente les variantes les plus probables plutôt que de supposer une seule.
function texteRecherchable(produit) {
  return [produit?.nom, produit?.titre, produit?.nom_produit, produit?.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function EtatVide({ icone: Icone, titre, texte, children }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center justify-center py-20 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#12181B]/5">
        <Icone size={24} className="text-[#12181B]/35" />
      </span>
      <p className="text-[15px] font-medium text-[#12181B]">{titre}</p>
      {texte && <p className="mt-1 text-[13px] leading-relaxed text-[#12181B]/50">{texte}</p>}
      {children}
    </div>
  );
}

export default function CatalogueBoutique() {
  const { sousDomaine } = useBoutiquePublique();
  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [produitQuickView, setProduitQuickView] = useState(null);

  const chargerProduits = () => {
    setChargement(true);
    setErreur(false);
    catalogueApi
      .listerProduitsPublics(sousDomaine)
      .then((res) => setProduits(res.data.results || res.data))
      .catch(() => setErreur(true))
      .finally(() => setChargement(false));
  };

  useEffect(chargerProduits, [sousDomaine]);

  const produitsFiltres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    if (!terme) return produits;
    return produits.filter((produit) => texteRecherchable(produit).includes(terme));
  }, [produits, recherche]);

  const aDesProduits = !chargement && !erreur && produits.length > 0;
  const rechercheActive = recherche.trim() !== "";

  const compteur = rechercheActive
    ? `${produitsFiltres.length} résultat${produitsFiltres.length > 1 ? "s" : ""} sur ${produits.length}`
    : `${produits.length} produit${produits.length > 1 ? "s" : ""}`;

  return (
    <div className={`${CONTENEUR} py-6 sm:py-10`}>
      {/* En-tête de page */}
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[24px] font-medium text-[#12181B] sm:text-[28px]">Catalogue</h1>
          {aDesProduits && <p className="mt-1 text-[13px] text-[#12181B]/50">{compteur}</p>}
        </div>

        {aDesProduits && (
          <div className="relative w-full sm:w-80">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#12181B]/35" />
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un produit"
              aria-label="Rechercher un produit"
              className="h-11 w-full rounded-full border border-[#12181B]/10 bg-white pl-11 pr-10 text-[14px] text-[#12181B] transition-shadow placeholder:text-[#12181B]/35 focus:outline-none focus:ring-2 focus:ring-[#12181B]/20 [&::-webkit-search-cancel-button]:hidden"
            />
            {recherche && (
              <button
                onClick={() => setRecherche("")}
                aria-label="Effacer la recherche"
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#12181B]/40 transition-colors hover:bg-[#12181B]/5 hover:text-[#12181B]"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Contenu */}
      {chargement ? (
        <div className={GRILLE}>
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      ) : erreur ? (
        <EtatVide
          icone={Package}
          titre="Impossible de charger le catalogue"
          texte="Vérifie ta connexion et réessaie."
        >
          <button
            onClick={chargerProduits}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-[#12181B] px-5 text-[13px] font-medium text-[#F6F7F2] transition-colors hover:bg-[#12181B]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12181B] focus-visible:ring-offset-2"
          >
            <RotateCcw size={14} />
            Réessayer
          </button>
        </EtatVide>
      ) : produits.length === 0 ? (
        <EtatVide
          icone={Package}
          titre="Aucun produit pour l'instant"
          texte="Repasse bientôt, la boutique vient de démarrer."
        />
      ) : produitsFiltres.length === 0 ? (
        <EtatVide
          icone={SearchX}
          titre={`Aucun résultat pour « ${recherche} »`}
          texte="Essaie avec un autre mot ou vérifie l'orthographe."
        >
          <button
            onClick={() => setRecherche("")}
            className="mt-5 inline-flex h-10 items-center rounded-full border border-[#12181B]/15 px-5 text-[13px] font-medium text-[#12181B] transition-colors hover:bg-[#12181B]/5"
          >
            Effacer la recherche
          </button>
        </EtatVide>
      ) : (
        <div className={GRILLE}>
          {produitsFiltres.map((produit) => (
            <ProduitCarte key={produit.id} produit={produit} onQuickView={setProduitQuickView} />
          ))}
        </div>
      )}

      {produitQuickView && (
        <ProduitQuickView produit={produitQuickView} onFermer={() => setProduitQuickView(null)} />
      )}
    </div>
  );
}