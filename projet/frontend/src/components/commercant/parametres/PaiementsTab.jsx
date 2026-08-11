import { useState } from "react";
import { tenantsApi } from "../../../api/tenants";
import { useToast } from "../../../context/ToastContext";

const OPERATEURS = [
  ["mvola", "MVola"], ["orange_money", "Orange Money"], ["airtel_money", "Airtel Money"], ["livraison", "Paiement à la livraison"],
];

export default function PaiementsTab({ boutique, onEnregistre }) {
  const [actifs, setActifs] = useState(boutique.moyens_paiement_actifs || ["livraison"]);
  const [chargement, setChargement] = useState(false);
  const { notifier } = useToast();

  const toggle = (valeur) => {
    setActifs((p) => (p.includes(valeur) ? p.filter((v) => v !== valeur) : [...p, valeur]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (actifs.length === 0) {
      notifier("Active au moins un moyen de paiement.", "erreur");
      return;
    }
    setChargement(true);
    try {
      const response = await tenantsApi.modifierMaBoutique({ moyens_paiement_actifs: actifs });
      onEnregistre(response.data);
      notifier("Moyens de paiement mis à jour.");
    } catch {
      notifier("Impossible d'enregistrer.", "erreur");
    } finally {
      setChargement(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div className="space-y-2.5">
        {OPERATEURS.map(([valeur, label]) => (
          <label key={valeur} className="flex items-center gap-3 rounded-lg border border-[#12181B]/10 px-4 py-3 cursor-pointer hover:bg-[#12181B]/[0.02]">
            <input type="checkbox" checked={actifs.includes(valeur)} onChange={() => toggle(valeur)} className="h-4 w-4" />
            <span className="text-[14px] text-[#12181B]">{label}</span>
          </label>
        ))}
      </div>
      <button
        type="submit"
        disabled={chargement}
        className="rounded-full bg-[var(--boutique-primary,#12181B)] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[var(--boutique-accent,#0E7C66)] transition-colors disabled:opacity-50"
      >
        {chargement ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}