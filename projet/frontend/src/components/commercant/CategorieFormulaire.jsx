import { useState } from "react";
import { catalogueApi } from "../../api/catalogue";
import GeminiIcon from "../../assets/icons/google-gemini.svg";
import apiClient from "../../api/client";

export default function CategorieFormulaire({ categorie, categories, onSauvegarde }) {
  const estEdition = Boolean(categorie);

  const [nom, setNom] = useState(categorie?.nom || "");
  const [description, setDescription] = useState(categorie?.description || "");
  const [parent, setParent] = useState(categorie?.parent || "");
  const [ordre, setOrdre] = useState(categorie?.ordre ?? 0);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Une catégorie ne peut pas être son propre parent (évite un cycle infini)
  const optionsParent = categories.filter((c) => c.id !== categorie?.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      const donnees = { nom, description, ordre, parent: parent || null };
      const response = estEdition
        ? await catalogueApi.modifierCategorie(categorie.id, donnees)
        : await catalogueApi.creerCategorie(donnees);
      onSauvegarde(response.data);
    } catch (err) {
      const messages = err.response?.data;
      const premierMessage = messages ? Object.values(messages)[0] : null;
      setErreur(Array.isArray(premierMessage) ? premierMessage[0] : premierMessage || "Une erreur est survenue.");
    } finally {
      setChargement(false);
    }
  };

  const genererDescriptionIA = async () => {
  if (!nom) {
    alert("Merci de renseigner le nom de la catégorie d'abord.");
    return;
  }

  setIsGenerating(true);
  try {
    const response = await apiClient.post("/api/catalogue/generate-description-categorie/", { nom });
    setDescription(response.data.description);
  } catch (error) {
    console.error(error);
    alert("Impossible de générer la description pour le moment.");
  } finally {
    setIsGenerating(false);
  }
};
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="font-display text-[20px] font-medium text-[#12181B]">
          {estEdition ? "Modifier la catégorie" : "Nouvelle catégorie"}
        </h2>
      </div>

      {erreur && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-[13px] text-red-600">
          {erreur}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-[#12181B]/70">Nom</label>
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          required
          className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
        />
      </div>

      <div className="space-y-1.5">
  <label className="block text-[13px] font-medium text-[#12181B]/70">Description</label>
  <div className="relative">
    <textarea
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      rows={2}
      className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 pb-9 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
    />
    <button
      type="button"
      onClick={genererDescriptionIA}
      disabled={isGenerating}
      className="absolute bottom-2 right-2 text-xs px-2.5 py-1.5 rounded-md
                 bg-white/40 backdrop-blur-md border border-white/50
                 text-indigo-700 shadow-sm
                 hover:bg-white/60 hover:shadow-md
                 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-all duration-200
                 flex items-center gap-1.5"
    >
      {isGenerating ? (
        <>
          <span className="animate-spin h-3 w-3 border-2 border-indigo-600 border-t-transparent rounded-full"></span>
          Génération...
        </>
      ) : (
        <>
          <img src={GeminiIcon} alt="" className="h-3.5 w-3.5" />
          Complétion IA
        </>
      )}
    </button>
  </div>
</div>

      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-[#12181B]/70">Catégorie parente (optionnel)</label>
        <select
          value={parent}
          onChange={(e) => setParent(e.target.value)}
          className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
        >
          <option value="">Aucune (catégorie principale)</option>
          {optionsParent.map((c) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-[#12181B]/70">Ordre d'affichage</label>
        <input
          type="number"
          min="0"
          value={ordre}
          onChange={(e) => setOrdre(e.target.value)}
          className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
        />
      </div>

      <button
        type="submit"
        disabled={chargement}
        className="w-full rounded-full bg-[var(--boutique-primary,#12181B)] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[var(--boutique-accent,#0E7C66)] transition-colors disabled:opacity-50"
      >
        {chargement ? "Enregistrement..." : estEdition ? "Enregistrer" : "Créer la catégorie"}
      </button>
    </form>
  );
}