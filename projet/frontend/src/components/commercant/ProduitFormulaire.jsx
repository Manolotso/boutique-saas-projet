import { useState } from "react";
import { catalogueApi } from "../../api/catalogue";

export default function ProduitFormulaire({ produit, onSauvegarde }) {
  const estEdition = Boolean(produit);

  const [nom, setNom] = useState(produit?.nom || "");
  const [description, setDescription] = useState(produit?.description || "");
  const [prix, setPrix] = useState(produit?.prix || "");
  const [stock, setStock] = useState(produit?.stock ?? 0);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      const donnees = { nom, description, prix, stock };
      const response = estEdition
        ? await catalogueApi.modifierProduit(produit.id, donnees)
        : await catalogueApi.creerProduit(donnees);
      onSauvegarde(response.data);
    } catch (err) {
      const messages = err.response?.data;
      const premierMessage = messages ? Object.values(messages)[0] : null;
      setErreur(
        Array.isArray(premierMessage) ? premierMessage[0] : premierMessage || "Une erreur est survenue."
      );
    } finally {
      setChargement(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="font-display text-[20px] font-medium text-[#12181B]">
          {estEdition ? "Modifier le produit" : "Nouveau produit"}
        </h2>
      </div>

      {erreur && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-[13px] text-red-600">
          {erreur}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-[#12181B]/70">Nom du produit</label>
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
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-[#12181B]/70">Prix (Ar)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={prix}
            onChange={(e) => setPrix(e.target.value)}
            required
            className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-[#12181B]/70">Stock</label>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
            className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={chargement}
        className="w-full rounded-full bg-[#12181B] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[#0E7C66] transition-colors duration-300 disabled:opacity-50"
      >
        {chargement ? "Enregistrement..." : estEdition ? "Enregistrer les modifications" : "Créer le produit"}
      </button>
    </form>
  );
}