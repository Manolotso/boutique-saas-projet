import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { tenantsApi } from "../api/tenants";

const BoutiqueContext = createContext(null);

export function BoutiqueProvider({ children }) {
  const [boutique, setBoutique] = useState(null);
  const [chargement, setChargement] = useState(true);

  const recharger = useCallback(() => {
    setChargement(true);
    return tenantsApi
      .obtenirMaBoutique()
      .then((res) => setBoutique(res.data))
      .finally(() => setChargement(false));
  }, []);

  useEffect(() => {
    recharger();
  }, [recharger]);

  // Pose les couleurs de la boutique en variables CSS sur <html>, pas sur un simple
  // wrapper de layout : si un composant (ex: une modal via createPortal) est rendu
  // en dehors de l'arbre du layout, il n'hériterait jamais de variables posées plus bas.
  // document.documentElement garantit que la variable est visible partout, portail ou non.
  useEffect(() => {
    if (!boutique) return;
    const racine = document.documentElement;
    racine.style.setProperty("--boutique-primary", boutique.couleur_primaire || "#12181B");
    racine.style.setProperty("--boutique-accent", boutique.couleur_secondaire || "#0E7C66");
  }, [boutique]);

  return (
    <BoutiqueContext.Provider value={{ boutique, chargement, recharger, setBoutique }}>
      {children}
    </BoutiqueContext.Provider>
  );
}

export function useBoutique() {
  const contexte = useContext(BoutiqueContext);
  if (!contexte) throw new Error("useBoutique doit être utilisé dans un <BoutiqueProvider>");
  return contexte;
}