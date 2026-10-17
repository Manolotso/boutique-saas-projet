import { useEffect, useState } from "react";
import { catalogueApi } from "../../api/catalogue";
import ProduitCarte from "./ProduitCarte";
import Skeleton from "../ui/Skeleton";

const GRILLE = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

export default function PourVous({ sousDomaine }) {
  const [produits, setProduits] = useState([]);
  const [personnalise, setPersonnalise] = useState(false);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    let annule = false;
    setChargement(true);
    catalogueApi
      .produitsPourVous(sousDomaine)
      .then((res) => {
        if (annule) return;
        setProduits(res.data.results || []);
        setPersonnalise(Boolean(res.data.personnalise));
      })
      .catch(() => !annule && setProduits([]))
      .finally(() => !annule && setChargement(false));
    return () => {
      annule = true;
    };
  }, [sousDomaine]);

  if (!chargement && produits.length === 0) return null;

  return (
    <section>
      <h2 className="font-display text-[20px] font-medium text-[#12181B] sm:text-[22px]">
        {personnalise ? "Pour vous" : "Nos produits phares"}
      </h2>
      <p className="mb-5 mt-1 text-[13px] text-[#12181B]/50">
        {personnalise ? "Une sélection basée sur ce que vous avez regardé" : "Les plus appréciés de la boutique"}
      </p>
      <div className={GRILLE}>
        {chargement
          ? [...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)
          : produits.map((p) => <ProduitCarte key={p.id} produit={p} />)}
      </div>
    </section>
  );
}