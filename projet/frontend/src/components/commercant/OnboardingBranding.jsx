import { useState } from "react";
import { tenantsApi } from "../../api/tenants";

export default function OnboardingBranding({ boutique, onSuivant }) {
  const [logo, setLogo] = useState(null);
  const [banniere, setBanniere] = useState(null);
  const [couleurPrimaire, setCouleurPrimaire] = useState(boutique.couleur_primaire || "#12181B");
  const [couleurSecondaire, setCouleurSecondaire] = useState(boutique.couleur_secondaire || "#0E7C66");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      const formData = new FormData();
      if (logo) formData.append("logo", logo);
      if (banniere) formData.append("banniere", banniere);
      formData.append("couleur_primaire", couleurPrimaire);
      formData.append("couleur_secondaire", couleurSecondaire);
      formData.append("etape_onboarding", "paiement");

      const response = await tenantsApi.modifierMaBoutique(formData);
      onSuivant(response.data);
    } catch {
      setErreur("Impossible d'enregistrer la personnalisation.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="font-display text-[20px] font-medium text-[#12181B]">Personnalise ta boutique</h2>
        <p className="text-[14px] text-[#12181B]/60 mt-1">Étape 2 sur 3 — Identité visuelle</p>
      </div>

      {erreur && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-[13px] text-red-600">
          {erreur}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-[#12181B]/70">Logo</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setLogo(e.target.files?.[0] || null)}
          className="w-full text-[13px] text-[#12181B]/70"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-[#12181B]/70">Bannière</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setBanniere(e.target.files?.[0] || null)}
          className="w-full text-[13px] text-[#12181B]/70"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-[#12181B]/70">Couleur principale</label>
          <input
            type="color"
            value={couleurPrimaire}
            onChange={(e) => setCouleurPrimaire(e.target.value)}
            className="w-full h-10 rounded-lg border border-[#12181B]/10 cursor-pointer"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-[#12181B]/70">Couleur secondaire</label>
          <input
            type="color"
            value={couleurSecondaire}
            onChange={(e) => setCouleurSecondaire(e.target.value)}
            className="w-full h-10 rounded-lg border border-[#12181B]/10 cursor-pointer"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={chargement}
        className="w-full rounded-full bg-[#12181B] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[#0E7C66] transition-colors duration-300 disabled:opacity-50"
      >
        {chargement ? "Enregistrement..." : "Continuer"}
      </button>
    </form>
  );
}