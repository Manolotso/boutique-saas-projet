import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { catalogueApi } from "../../api/catalogue";
import Modal from "../../components/ui/Modal";
import ProduitFormulaire from "../../components/commercant/ProduitFormulaire";

export default function Produits() {
  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [produitEnEdition, setProduitEnEdition] = useState(null);

  const chargerProduits = () => {
    setChargement(true);
    catalogueApi
      .listerProduits()
      .then((res) => setProduits(res.data.results || res.data))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    chargerProduits();
  }, []);

  const ouvrirCreation = () => {
    setProduitEnEdition(null);
    setModalOuvert(true);
  };

  const ouvrirEdition = (produit) => {
    setProduitEnEdition(produit);
    setModalOuvert(true);
  };

  const handleSauvegarde = () => {
    setModalOuvert(false);
    chargerProduits();
  };

  const togglePublication = async (produit) => {
    const nouveauStatut = produit.statut === "publie" ? "brouillon" : "publie";
    await catalogueApi.modifierProduit(produit.id, { statut: nouveauStatut });
    chargerProduits();
  };

  const supprimer = async (produit) => {
    if (!window.confirm(`Supprimer "${produit.nom}" ?`)) return;
    await catalogueApi.supprimerProduit(produit.id);
    chargerProduits();
  };

  return (
    <div className="min-h-screen bg-[#FBFAF6] p-8">
      <Link to="/commercant" className="flex items-center gap-1 text-[13px] text-[#12181B]/50 hover:text-[#12181B] mb-6 transition-colors">
        <ArrowLeft size={14} /> Retour au tableau de bord
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-[24px] font-medium text-[#12181B]">Mes produits</h1>
        <button
          onClick={ouvrirCreation}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#12181B] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[#0E7C66] transition-colors duration-300"
        >
          <Plus size={16} /> Nouveau produit
        </button>
      </div>

      {chargement ? (
        <p className="text-[14px] text-[#12181B]/60">Chargement...</p>
      ) : produits.length === 0 ? (
        <p className="text-[14px] text-[#12181B]/60">Aucun produit pour l'instant — crée le premier.</p>
      ) : (
        <div className="space-y-3">
          {produits.map((produit) => (
            <div
              key={produit.id}
              className="flex items-center justify-between bg-white border border-[#12181B]/10 rounded-xl px-5 py-4"
            >
              <div>
                <p className="text-[14px] font-medium text-[#12181B]">{produit.nom}</p>
                <p className="text-[13px] text-[#12181B]/60 mt-0.5">
                  {Number(produit.prix).toLocaleString("fr-MG")} Ar · Stock : {produit.stock} ·{" "}
                  <span className={produit.statut === "publie" ? "text-[#0E7C66]" : "text-[#12181B]/50"}>
                    {produit.statut === "publie" ? "Publié" : "Brouillon"}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePublication(produit)}
                  className="text-[13px] font-medium text-[#12181B]/70 hover:text-[#12181B] px-3 py-1.5 rounded-lg border border-[#12181B]/10 transition-colors"
                >
                  {produit.statut === "publie" ? "Dépublier" : "Publier"}
                </button>
                <button
                  onClick={() => ouvrirEdition(produit)}
                  aria-label="Modifier"
                  className="p-2 rounded-lg border border-[#12181B]/10 text-[#12181B]/70 hover:text-[#12181B] transition-colors"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => supprimer(produit)}
                  aria-label="Supprimer"
                  className="p-2 rounded-lg border border-[#12181B]/10 text-red-500/70 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOuvert} onClose={() => setModalOuvert(false)}>
        <ProduitFormulaire produit={produitEnEdition} onSauvegarde={handleSauvegarde} />
      </Modal>
    </div>
  );
}