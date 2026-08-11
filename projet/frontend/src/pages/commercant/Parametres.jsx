import { useState } from "react";
import { useBoutique } from "../../context/BoutiqueContext";
import InfosTab from "../../components/commercant/parametres/InfosTab";
import BrandingTab from "../../components/commercant/parametres/BrandingTab";
import PaiementsTab from "../../components/commercant/parametres/PaiementsTab";

const ONGLETS = [
  { id: "infos", label: "Informations" },
  { id: "branding", label: "Personnalisation" },
  { id: "paiements", label: "Paiements" },
];

export default function Parametres() {
  const { boutique, setBoutique } = useBoutique();
  const [ongletActif, setOngletActif] = useState("infos");

  if (!boutique) return null;

  return (
    <div>
      <h1 className="font-display text-[24px] font-medium text-[#12181B] mb-6">Paramètres de la boutique</h1>

      <div className="flex items-center gap-1 border-b border-[#12181B]/10 mb-6">
        {ONGLETS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setOngletActif(id)}
            className={`px-4 py-2.5 text-[14px] font-medium border-b-2 -mb-px transition-colors ${
              ongletActif === id
                ? "border-[var(--boutique-primary,#12181B)] text-[#12181B]"
                : "border-transparent text-[#12181B]/50 hover:text-[#12181B]/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {ongletActif === "infos" && <InfosTab boutique={boutique} onEnregistre={setBoutique} />}
      {ongletActif === "branding" && <BrandingTab boutique={boutique} onEnregistre={setBoutique} />}
      {ongletActif === "paiements" && <PaiementsTab boutique={boutique} onEnregistre={setBoutique} />}
    </div>
  );
}