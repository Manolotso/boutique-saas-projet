import { useEffect, useState } from "react";
import { catalogueApi } from "../../api/catalogue";
import ProduitCarte from "./ProduitCarte";
import Skeleton from "../ui/Skeleton";

const GRILLE = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5";

export default function ProduitsSimilaires({ sousDomaine, slug }) {
  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    let annule = false;
    setChargement(true);
    catalogueApi
      .produitsSimilaires(sousDomaine, slug)
      .then((res) => !annule && setProduits(res.data.results || []))
      .catch(() => !annule && setProduits([]))
      .finally(() => !annule && setChargement(false));
    return () => {
      annule = true;
    };
  }, [sousDomaine, slug]);

  if (!chargement && produits.length === 0) return null;

  return (
    <section className="mt-12 border-t border-[#12181B]/10 pt-8 sm:mt-16">
      <h2 className="mb-5 font-display text-[20px] font-medium text-[#12181B] sm:text-[22px]">
        Produits similaires
      </h2>
      <div className={GRILLE}>
        {chargement
          ? [...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)
          : produits.map((p) => <ProduitCarte key={p.id} produit={p} />)}
      </div>
    </section>
  );
}