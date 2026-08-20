import { useEffect, useMemo, useState } from "react";
import { Package, Search, SearchX, RotateCcw } from "lucide-react";
import { catalogueApi } from "../../api/catalogue";
import { useBoutiquePublique } from "../../context/BoutiquePubliqueContext";
import ProduitCarte from "../../components/boutique/ProduitCarte";
import Skeleton from "../../components/ui/Skeleton";
import ProduitQuickView from "../../components/boutique/ProduitQuickView";

// Recherche défensive : le nom exact du champ produit n'est pas confirmé,
// on tente les variantes les plus probables plutôt que de supposer une seule.
function texteRecherchable(produit) {
  return [produit?.nom, produit?.titre, produit?.nom_produit, produit?.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function CatalogueBoutique() {
  const { sousDomaine } = useBoutiquePublique();
  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(false);
  const [recherche, setRecherche] = useState("");

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

  const grilleClasses = "grid grid-cols-2 md:grid-cols-4 gap-4";

  const [produitQuickView, setProduitQuickView] = useState(null);


  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="font-display text-[22px] font-medium text-[#12181B]">Catalogue</h1>

        {!chargement && !erreur && produits.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#12181B]/35" />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un produit"
              className="w-full h-10 pl-10 pr-4 rounded-full bg-white border border-[#12181B]/10 text-[14px] text-[#12181B] placeholder:text-[#12181B]/35 focus:outline-none focus:ring-2 focus:ring-[#12181B]/20 transition-shadow"
            />
          </div>
        )}
      </div>

      {chargement ? (
        <div className={grilleClasses}>
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      ) : erreur ? (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#12181B]/5 mb-3">
            <Package size={22} className="text-[#12181B]/30" />
          </span>
          <p className="text-[14px] text-[#12181B]/60">Impossible de charger le catalogue.</p>
          <p className="text-[13px] text-[#12181B]/40 mt-0.5">Vérifie ta connexion et réessaie.</p>
          <button
            onClick={chargerProduits}
            className="inline-flex items-center gap-1.5 mt-5 h-9 px-4 rounded-full bg-[#12181B] text-[#F6F7F2] text-[13px] font-medium hover:bg-[#12181B]/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12181B]"
          >
            <RotateCcw size={14} />
            Réessayer
          </button>
        </div>
      ) : produits.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <Package size={28} className="text-[#12181B]/20 mb-3" />
          <p className="text-[14px] text-[#12181B]/50">Aucun produit disponible pour l'instant.</p>
          <p className="text-[13px] text-[#12181B]/35 mt-1">Repasse bientôt, la boutique vient de démarrer.</p>
        </div>
      ) : produitsFiltres.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <SearchX size={28} className="text-[#12181B]/20 mb-3" />
          <p className="text-[14px] text-[#12181B]/50">
            Aucun résultat pour « {recherche} ».
          </p>
          <button
            onClick={() => setRecherche("")}
            className="text-[13px] text-[#12181B]/50 underline underline-offset-2 hover:text-[#12181B] mt-2"
          >
            Effacer la recherche
          </button>
        </div>
      ) : (
        <div className={grilleClasses}>
          {produitsFiltres.map((produit) => (
            <ProduitCarte key={produit.id} produit={produit} onQuickView={setProduitQuickView} />
          ))}
        </div>
      )}

      {produitQuickView && (
        <ProduitQuickView
          produit={produitQuickView}
          onFermer={() => setProduitQuickView(null)}
        />
      )}

    </div>
  );
}