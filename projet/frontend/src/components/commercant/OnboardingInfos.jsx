import { useState } from "react";
import { tenantsApi } from "../../api/tenants";

const VILLES = [
  ["antananarivo", "Antananarivo"],
  ["toamasina", "Toamasina"],
  ["antsirabe", "Antsirabe"],
  ["fianarantsoa", "Fianarantsoa"],
  ["mahajanga", "Mahajanga"],
  ["toliara", "Toliara"],
  ["antsiranana", "Antsiranana"],
  ["nosy_be", "Nosy Be"],
  ["autre", "Autre"],
];

export default function OnboardingInfos({ boutique, onSuivant }) {
  const [description, setDescription] = useState(boutique.description || "");
  const [slogan, setSlogan] = useState(boutique.slogan || "");
  const [telephone, setTelephone] = useState(boutique.telephone || "");
  const [whatsapp, setWhatsapp] = useState(boutique.whatsapp || "");
  const [adresse, setAdresse] = useState(boutique.adresse || "");
  const [ville, setVille] = useState(boutique.ville || "");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      const response = await tenantsApi.modifierMaBoutique({
        description, slogan, telephone, whatsapp, adresse, ville,
        etape_onboarding: "branding",
      });
      onSuivant(response.data);
    } catch {
      setErreur("Impossible d'enregistrer ces informations.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="font-display text-[20px] font-medium text-[#12181B]">Parle-nous de ta boutique</h2>
        <p className="text-[14px] text-[#12181B]/60 mt-1">Étape 1 sur 3 — Informations générales</p>
      </div>

      {erreur && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-[13px] text-red-600">
          {erreur}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-[#12181B]/70">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Décris en quelques mots ce que tu vends..."
          className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] placeholder:text-[#12181B]/30 focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-[#12181B]/70">Slogan</label>
        <input
          type="text"
          value={slogan}
          onChange={(e) => setSlogan(e.target.value)}
          placeholder="Ex : L'artisanat malgache à portée de clic"
          className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] placeholder:text-[#12181B]/30 focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-[#12181B]/70">Téléphone</label>
          <input
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="034 00 000 00"
            className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] placeholder:text-[#12181B]/30 focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-[#12181B]/70">WhatsApp</label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="034 00 000 00"
            className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] placeholder:text-[#12181B]/30 focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-[#12181B]/70">Adresse</label>
        <input
          type="text"
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          placeholder="Lot / rue / quartier"
          className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] placeholder:text-[#12181B]/30 focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-[#12181B]/70">Ville</label>
        <select
          value={ville}
          onChange={(e) => setVille(e.target.value)}
          className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
        >
          <option value="">Sélectionner...</option>
          {VILLES.map(([valeur, label]) => (
            <option key={valeur} value={valeur}>{label}</option>
          ))}
        </select>
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