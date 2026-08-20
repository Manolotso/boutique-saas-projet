import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Pencil, Trash2, FolderTree, ChevronRight, Search, X } from "lucide-react";
import { catalogueApi } from "../../api/catalogue";
import Modal from "../../components/ui/Modal";
import Skeleton from "../../components/ui/Skeleton";
import CategorieFormulaire from "../../components/commercant/CategorieFormulaire";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";

/* ---------------------------------------------------------
   Ligne catégorie — vue arbre (par défaut, sans recherche)
--------------------------------------------------------- */
function LigneCategorie({ categorie, niveau, sousCategoriesDe, reduites, onToggleReduire, onEditer, onSupprimer }) {
  const enfants = sousCategoriesDe(categorie.id);
  const aDesEnfants = enfants.length > 0;
  const estReduite = reduites.has(categorie.id);

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="group flex items-center justify-between bg-white border border-[#12181B]/10 rounded-xl px-4 py-3 hover:border-[#12181B]/20 transition-colors"
        style={{ marginLeft: niveau * 22 }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {aDesEnfants ? (
            <button
              onClick={() => onToggleReduire(categorie.id)}
              aria-label={estReduite ? "Déplier" : "Replier"}
              className="p-1 -ml-1 rounded-md text-[#12181B]/40 hover:text-[#12181B] hover:bg-[#12181B]/[0.05] shrink-0"
            >
              <ChevronRight size={14} className={`transition-transform ${estReduite ? "" : "rotate-90"}`} />
            </button>
          ) : (
            <span className="w-[22px] shrink-0" />
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-medium text-[#12181B] truncate">{categorie.nom}</p>
              {aDesEnfants && (
                <span className="text-[11px] text-[#12181B]/35 shrink-0">
                  {enfants.length} sous-catégorie{enfants.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {categorie.description && (
              <p className="text-[13px] text-[#12181B]/50 truncate mt-0.5">{categorie.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pl-3">
          <button
            onClick={() => onEditer(categorie)}
            aria-label="Modifier"
            className="p-1.5 rounded-lg text-[#12181B]/50 hover:text-[#12181B] hover:bg-[#12181B]/[0.06] transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onSupprimer(categorie)}
            aria-label="Supprimer"
            className="p-1.5 rounded-lg text-red-500/60 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </motion.div>

      <AnimatePresence initial={false}>
        {!estReduite &&
          enfants.map((sousCategorie) => (
            <LigneCategorie
              key={sousCategorie.id}
              categorie={sousCategorie}
              niveau={niveau + 1}
              sousCategoriesDe={sousCategoriesDe}
              reduites={reduites}
              onToggleReduire={onToggleReduire}
              onEditer={onEditer}
              onSupprimer={onSupprimer}
            />
          ))}
      </AnimatePresence>
    </>
  );
}

/* ---------------------------------------------------------
   Ligne catégorie — résultat de recherche (à plat, avec
   fil d'ariane pour situer la catégorie dans l'arbre sans
   avoir à déplier manuellement)
--------------------------------------------------------- */
function LigneCategorieRecherche({ categorie, chemin, onEditer, onSupprimer }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="group flex items-center justify-between bg-white border border-[#12181B]/10 rounded-xl px-4 py-3 hover:border-[#12181B]/20 transition-colors"
    >
      <div className="min-w-0">
        {chemin.length > 0 && (
          <p className="text-[11.5px] text-[#12181B]/35 truncate mb-0.5">{chemin.join(" › ")}</p>
        )}
        <p className="text-[14px] font-medium text-[#12181B] truncate">{categorie.nom}</p>
        {categorie.description && (
          <p className="text-[13px] text-[#12181B]/50 truncate mt-0.5">{categorie.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pl-3">
        <button
          onClick={() => onEditer(categorie)}
          aria-label="Modifier"
          className="p-1.5 rounded-lg text-[#12181B]/50 hover:text-[#12181B] hover:bg-[#12181B]/[0.06] transition-colors"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onSupprimer(categorie)}
          aria-label="Supprimer"
          className="p-1.5 rounded-lg text-red-500/60 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [categorieEnEdition, setCategorieEnEdition] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [reduites, setReduites] = useState(new Set());

  const { notifier } = useToast();
  const confirmer = useConfirm();

  const charger = () => {
    setChargement(true);
    catalogueApi
      .listerCategories()
      .then((res) => setCategories(res.data.results || res.data))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    charger();
  }, []);

  const principales = categories.filter((c) => !c.parent);
  const sousCategoriesDe = (parentId) => categories.filter((c) => c.parent === parentId);

  const obtenirChemin = (categorie) => {
    const chemin = [];
    let courante = categorie;
    while (courante?.parent) {
      const parent = categories.find((c) => c.id === courante.parent);
      if (!parent) break;
      chemin.unshift(parent.nom);
      courante = parent;
    }
    return chemin;
  };

  const resultatsRecherche = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return null;
    return categories.filter(
      (c) => c.nom.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
    );
  }, [categories, recherche]);

  const toggleReduire = (id) => {
    setReduites((prev) => {
      const suivant = new Set(prev);
      suivant.has(id) ? suivant.delete(id) : suivant.add(id);
      return suivant;
    });
  };

  const ouvrirCreation = () => {
    setCategorieEnEdition(null);
    setModalOuvert(true);
  };

  const ouvrirEdition = (categorie) => {
    setCategorieEnEdition(categorie);
    setModalOuvert(true);
  };

  const handleSauvegarde = () => {
    const estEdition = Boolean(categorieEnEdition);
    setModalOuvert(false);
    charger();
    notifier(estEdition ? "Catégorie modifiée." : "Catégorie créée.");
  };

  const supprimer = async (categorie) => {
    const aDesEnfants = sousCategoriesDe(categorie.id).length > 0;
    const ok = await confirmer({
      titre: "Supprimer cette catégorie ?",
      message: aDesEnfants
        ? `"${categorie.nom}" a des sous-catégories qui deviendront des catégories principales. Les produits associés ne seront pas supprimés.`
        : `"${categorie.nom}" sera supprimée. Les produits associés ne seront pas supprimés, juste déclassés.`,
      texteConfirmer: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    await catalogueApi.supprimerCategorie(categorie.id);
    charger();
    notifier("Catégorie supprimée.", "info");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[24px] font-medium text-[#12181B]">Catégories</h1>
          <p className="text-[13px] text-[#12181B]/45 mt-0.5">
            {categories.length} catégorie{categories.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <button
          onClick={ouvrirCreation}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--boutique-primary,#12181B)] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Nouvelle catégorie
        </button>
      </div>

      {categories.length > 0 && (
        <div className="relative mb-4 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#12181B]/35" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une catégorie…"
            className="w-full rounded-full border border-[#12181B]/12 bg-white pl-9 pr-8 py-2 text-[13.5px] text-[#12181B] placeholder:text-[#12181B]/35 focus:outline-none focus:ring-2 focus:ring-[#0E7C66]/30 focus:border-[#0E7C66]/40"
          />
          {recherche && (
            <button
              onClick={() => setRecherche("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#12181B]/35 hover:text-[#12181B]"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {chargement ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center bg-white border border-dashed border-[#12181B]/15 rounded-xl py-16">
          <FolderTree size={28} className="text-[#12181B]/25 mb-3" />
          <p className="text-[14px] text-[#12181B]/60 mb-4">Aucune catégorie pour l'instant.</p>
          <button
            onClick={ouvrirCreation}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--boutique-primary,#12181B)] text-[#F6F7F2] text-[13px] font-medium px-4 py-2 hover:opacity-90 transition-opacity"
          >
            <Plus size={14} /> Créer la première
          </button>
        </div>
      ) : resultatsRecherche !== null ? (
        resultatsRecherche.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center bg-white border border-dashed border-[#12181B]/15 rounded-xl py-16">
            <Search size={26} className="text-[#12181B]/20 mb-3" />
            <p className="text-[14px] text-[#12181B]/60 mb-1">Aucun résultat pour "{recherche}".</p>
            <button onClick={() => setRecherche("")} className="text-[13px] text-[#0E7C66] font-medium hover:underline mt-2">
              Réinitialiser la recherche
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {resultatsRecherche.map((categorie) => (
                <LigneCategorieRecherche
                  key={categorie.id}
                  categorie={categorie}
                  chemin={obtenirChemin(categorie)}
                  onEditer={ouvrirEdition}
                  onSupprimer={supprimer}
                />
              ))}
            </AnimatePresence>
          </div>
        )
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {principales.map((categorie) => (
              <LigneCategorie
                key={categorie.id}
                categorie={categorie}
                niveau={0}
                sousCategoriesDe={sousCategoriesDe}
                reduites={reduites}
                onToggleReduire={toggleReduire}
                onEditer={ouvrirEdition}
                onSupprimer={supprimer}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal isOpen={modalOuvert} onClose={() => setModalOuvert(false)}>
        <CategorieFormulaire categorie={categorieEnEdition} categories={categories} onSauvegarde={handleSauvegarde} />
      </Modal>
    </div>
  );
}