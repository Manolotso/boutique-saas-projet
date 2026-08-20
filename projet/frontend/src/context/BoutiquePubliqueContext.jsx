import { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { tenantsApi } from "../api/tenants";

const BoutiquePubliqueContext = createContext(null);

export function BoutiquePubliqueProvider({ children }) {
  const { sousDomaine } = useParams();
  const [boutique, setBoutique] = useState(null);
  const [introuvable, setIntrouvable] = useState(false);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    setChargement(true);
    setIntrouvable(false);
    tenantsApi
      .obtenirBoutiquePublique(sousDomaine)
      .then((res) => setBoutique(res.data))
      .catch(() => setIntrouvable(true))
      .finally(() => setChargement(false));
  }, [sousDomaine]);

  return (
    <BoutiquePubliqueContext.Provider value={{ boutique, chargement, introuvable, sousDomaine }}>
      {children}
    </BoutiquePubliqueContext.Provider>
  );
}

export function useBoutiquePublique() {
  const ctx = useContext(BoutiquePubliqueContext);
  if (!ctx) throw new Error("useBoutiquePublique doit être utilisé dans un <BoutiquePubliqueProvider>");
  return ctx;
}