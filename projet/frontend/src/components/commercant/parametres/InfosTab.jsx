import { useState } from "react";
import { tenantsApi } from "../../../api/tenants";
import { useToast } from "../../../context/ToastContext";

const VILLES = [
  ["antananarivo", "Antananarivo"], ["toamasina", "Toamasina"], ["antsirabe", "Antsirabe"],
  ["fianarantsoa", "Fianarantsoa"], ["mahajanga", "Mahajanga"], ["toliara", "Toliara"],
  ["antsiranana", "Antsiranana"], ["nosy_be", "Nosy Be"], ["autre", "Autre"],
];

export default function InfosTab({ boutique, onEnregistre }) {
  const [description, setDescription] = useState(boutique.description || "");
  const [slogan, setSlogan] = useState(boutique.slogan || "");
  const [telephone, setTelephone] = useState(boutique.telephone || "");
  const [whatsapp, setWhatsapp] = useState(boutique.whatsapp || "");
  const [adresse, setAdresse] = useState(boutique.adresse || "");
  const [ville, setVille] = useState(boutique.ville || "");
  const [chargement, setChargement] = useState(false);
  const { notifier } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    try {
      const response = await tenantsApi.modifierMaBoutique({
        description, slogan, telephone, whatsapp, adresse, ville,
      });
      onEnregistre(response.data);
      notifier("Informations enregistrées.");
    } catch {
      notifier("Impossible d'enregistrer ces informations.", "erreur");
    } finally {
      setChargement(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-[#12181B]/70">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-[#12181B]/70">Slogan</label>
        <input
          type="text"
          value={slogan}
          onChange={(e) => setSlogan(e.target.value)}
          className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-[#12181B]/70">Téléphone</label>
          <input
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-[#12181B]/70">WhatsApp</label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-[#12181B]/70">Adresse</label>
        <input
          type="text"
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
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
        className="rounded-full bg-[var(--boutique-primary,#12181B)] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[var(--boutique-accent,#0E7C66)] transition-colors disabled:opacity-50"
      >
        {chargement ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}