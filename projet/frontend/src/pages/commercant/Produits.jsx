import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, ArrowUpDown, Package, CheckSquare, Square } from "lucide-react";
import { catalogueApi } from "../../api/catalogue";
import Modal from "../../components/ui/Modal";
import Skeleton from "../../components/ui/Skeleton";
import ProduitFormulaire from "../../components/commercant/ProduitFormulaire";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";

export default function Produits() {
  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [produitEnEdition, setProduitEnEdition] = useState(null);
  const [selection, setSelection] = useState([]);
  const [tri, setTri] = useState({ champ: "date_creation", ordre: "desc" });

  const { notifier } = useToast();
  const confirmer = useConfirm();

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

  const produitsTries = useMemo(() => {
    const copie = [...produits];
    copie.sort((a, b) => {
      const valA = a[tri.champ];
      const valB = b[tri.champ];
      const comparaison = typeof valA === "string" ? valA.localeCompare(valB) : valA - valB;
      return tri.ordre === "asc" ? comparaison : -comparaison;
    });
    return copie;
  }, [produits, tri]);

  const changerTri = (champ) => {
    setTri((t) => ({ champ, ordre: t.champ === champ && t.ordre === "asc" ? "desc" : "asc" }));
  };

  const toggleSelection = (id) => {
    setSelection((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const toggleToutSelectionner = () => {
    setSelection((s) => (s.length === produitsTries.length ? [] : produitsTries.map((p) => p.id)));
  };

  const ouvrirCreation = () => {
    setProduitEnEdition(null);
    setModalOuvert(true);
  };

  const ouvrirEdition = (produit) => {
    setProduitEnEdition(produit);
    setModalOuvert(true);
  };

  const handleSauvegarde = () => {
    const estEdition = Boolean(produitEnEdition);
    setModalOuvert(false);
    chargerProduits();
    notifier(estEdition ? "Produit modifié." : "Produit créé.");
  };

  const togglePublication = async (produit) => {
    const nouveauStatut = produit.statut === "publie" ? "brouillon" : "publie";
    await catalogueApi.modifierProduit(produit.id, { statut: nouveauStatut });
    chargerProduits();
    notifier(nouveauStatut === "publie" ? "Produit publié." : "Produit dépublié.");
  };

  const supprimer = async (produit) => {
    const ok = await confirmer({
      titre: "Supprimer ce produit ?",
      message: `"${produit.nom}" sera retiré de ta boutique. Cette action est irréversible.`,
      texteConfirmer: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    await catalogueApi.supprimerProduit(produit.id);
    chargerProduits();
    notifier("Produit supprimé.", "info");
  };

  const actionGroupee = async (action) => {
    if (action === "supprimer") {
      const ok = await confirmer({
        titre: `Supprimer ${selection.length} produit${selection.length > 1 ? "s" : ""} ?`,
        message: "Cette action est irréversible.",
        texteConfirmer: "Supprimer",
        danger: true,
      });
      if (!ok) return;
      await Promise.all(selection.map((id) => catalogueApi.supprimerProduit(id)));
      notifier("Produits supprimés.", "info");
    } else {
      const statut = action === "publier" ? "publie" : "brouillon";
      await Promise.all(selection.map((id) => catalogueApi.modifierProduit(id, { statut })));
      notifier(action === "publier" ? "Produits publiés." : "Produits dépubliés.");
    }
    setSelection([]);
    chargerProduits();
  };

  const EnTeteColonne = ({ champ, label }) => (
    <button
      onClick={() => changerTri(champ)}
      className="flex items-center gap-1 text-[12px] font-medium text-[#12181B]/50 uppercase tracking-wide hover:text-[#12181B]/80"
    >
      {label} <ArrowUpDown size={12} />
    </button>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-[24px] font-medium text-[#12181B]">Mes produits</h1>
        <button
          onClick={ouvrirCreation}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--boutique-primary,#12181B)] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Nouveau produit
        </button>
      </div>

      {selection.length > 0 && (
        <div className="flex items-center gap-3 bg-[#12181B] text-[#F6F7F2] rounded-xl px-4 py-3 mb-4">
          <span className="text-[13px]">{selection.length} sélectionné{selection.length > 1 ? "s" : ""}</span>
          <div className="flex-1" />
          <button onClick={() => actionGroupee("publier")} className="text-[13px] font-medium hover:underline">Publier</button>
          <button onClick={() => actionGroupee("depublier")} className="text-[13px] font-medium hover:underline">Dépublier</button>
          <button onClick={() => actionGroupee("supprimer")} className="text-[13px] font-medium text-red-300 hover:underline">Supprimer</button>
        </div>
      )}

      {chargement ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : produits.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center bg-white border border-dashed border-[#12181B]/15 rounded-xl py-16">
          <Package size={28} className="text-[#12181B]/25 mb-3" />
          <p className="text-[14px] text-[#12181B]/60 mb-4">Aucun produit pour l'instant.</p>
          <button
            onClick={ouvrirCreation}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--boutique-primary,#12181B)] text-[#F6F7F2] text-[13px] font-medium px-4 py-2 hover:opacity-90 transition-opacity"
          >
            <Plus size={14} /> Créer le premier
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#12181B]/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#12181B]/10">
                <th className="w-10 pl-4 py-3">
                  <button onClick={toggleToutSelectionner} className="text-[#12181B]/40 hover:text-[#12181B]">
                    {selection.length === produitsTries.length ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </th>
                <th className="text-left py-3 pl-2"><span className="text-[12px] font-medium text-[#12181B]/50 uppercase tracking-wide">Produit</span></th>
                <th className="text-left py-3"><EnTeteColonne champ="prix" label="Prix" /></th>
                <th className="text-left py-3"><EnTeteColonne champ="stock" label="Stock" /></th>
                <th className="text-left py-3"><span className="text-[12px] font-medium text-[#12181B]/50 uppercase tracking-wide">Statut</span></th>
                <th className="w-28 py-3" />
              </tr>
            </thead>
            <tbody>
              {produitsTries.map((produit) => {
                const imagePrincipale = produit.images?.find((img) => img.est_principale) || produit.images?.[0];
                const stockBas = produit.gestion_stock && produit.stock <= produit.seuil_alerte_stock;
                return (
                  <tr key={produit.id} className="border-b border-[#12181B]/[0.06] last:border-0 hover:bg-[#12181B]/[0.015]">
                    <td className="pl-4 py-3">
                      <button onClick={() => toggleSelection(produit.id)} className="text-[#12181B]/40 hover:text-[#12181B]">
                        {selection.includes(produit.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </td>
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-[#12181B]/[0.04] shrink-0 overflow-hidden flex items-center justify-center">
                          {imagePrincipale ? (
                            <img src={imagePrincipale.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Package size={16} className="text-[#12181B]/20" />
                          )}
                        </div>
                        <span className="text-[14px] font-medium text-[#12181B]">{produit.nom}</span>
                      </div>
                    </td>
                    <td className="py-3 text-[13px] text-[#12181B]/80">
                      {Number(produit.prix).toLocaleString("fr-MG")} Ar
                    </td>
                    <td className="py-3 text-[13px]">
                      <span className={stockBas ? "text-amber-600 font-medium" : "text-[#12181B]/80"}>
                        {produit.stock}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => togglePublication(produit)}
                        className={`text-[12px] font-medium rounded-full px-2.5 py-1 ${
                          produit.statut === "publie" ? "bg-[var(--boutique-accent,#0E7C66)]/10 text-[var(--boutique-accent,#0E7C66)]" : "bg-[#12181B]/[0.06] text-[#12181B]/60"
                        }`}
                      >
                        {produit.statut === "publie" ? "Publié" : "Brouillon"}
                      </button>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => ouvrirEdition(produit)}
                          aria-label="Modifier"
                          className="p-1.5 rounded-lg text-[#12181B]/50 hover:text-[#12181B] hover:bg-[#12181B]/[0.05]"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => supprimer(produit)}
                          aria-label="Supprimer"
                          className="p-1.5 rounded-lg text-red-500/60 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOuvert} onClose={() => setModalOuvert(false)}>
        <ProduitFormulaire produit={produitEnEdition} onSauvegarde={handleSauvegarde} />
      </Modal>
    </div>
  );
}