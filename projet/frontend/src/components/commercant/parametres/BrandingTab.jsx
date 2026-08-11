import { useState } from "react";
import { tenantsApi } from "../../../api/tenants";
import { useToast } from "../../../context/ToastContext";

export default function BrandingTab({ boutique, onEnregistre }) {
  const [logo, setLogo] = useState(null);
  const [banniere, setBanniere] = useState(null);
  const [couleurPrimaire, setCouleurPrimaire] = useState(boutique.couleur_primaire || "#12181B");
  const [couleurSecondaire, setCouleurSecondaire] = useState(boutique.couleur_secondaire || "#0E7C66");
  const [chargement, setChargement] = useState(false);
  const { notifier } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    try {
      const formData = new FormData();
      if (logo) formData.append("logo", logo);
      if (banniere) formData.append("banniere", banniere);
      formData.append("couleur_primaire", couleurPrimaire);
      formData.append("couleur_secondaire", couleurSecondaire);

      const response = await tenantsApi.modifierMaBoutique(formData);
      onEnregistre(response.data);
      notifier("Personnalisation enregistrée.");
    } catch {
      notifier("Impossible d'enregistrer la personnalisation.", "erreur");
    } finally {
      setChargement(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {boutique.logo && (
        <div className="flex items-center gap-3">
          <img src={boutique.logo} alt="Logo actuel" className="h-14 w-14 rounded-lg object-cover border border-[#12181B]/10" />
          <span className="text-[13px] text-[#12181B]/50">Logo actuel</span>
        </div>
      )}
      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-[#12181B]/70">Logo</label>
        <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] || null)} className="w-full text-[13px] text-[#12181B]/70" />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-[#12181B]/70">Bannière (c'est une image large de façon photo de couverture Facebook affichée en haut de la vitrine publique de la boutique)</label>
        <input type="file" accept="image/*" onChange={(e) => setBanniere(e.target.files?.[0] || null)} className="w-full text-[13px] text-[#12181B]/70" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-[#12181B]/70">Couleur principale</label>
          <input type="color" value={couleurPrimaire} onChange={(e) => setCouleurPrimaire(e.target.value)} className="w-full h-10 rounded-lg border border-[#12181B]/10 cursor-pointer" />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-[#12181B]/70">Couleur secondaire</label>
          <input type="color" value={couleurSecondaire} onChange={(e) => setCouleurSecondaire(e.target.value)} className="w-full h-10 rounded-lg border border-[#12181B]/10 cursor-pointer" />
        </div>
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