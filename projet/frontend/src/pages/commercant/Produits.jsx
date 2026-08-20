import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUpDown,
  Package,
  CheckSquare,
  Square,
  Search,
  LayoutGrid,
  List,
  X,
  ChevronDown,
  Tag,
} from "lucide-react";
import { catalogueApi } from "../../api/catalogue";
import Modal from "../../components/ui/Modal";
import Skeleton from "../../components/ui/Skeleton";
import ProduitFormulaire from "../../components/commercant/ProduitFormulaire";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";

const COULEUR_ALERTE = "#D97B0D";
const COULEUR_OK = "#0E7C66";
const COULEUR_DANGER = "#DC2626";

/* ---------------------------------------------------------
   Anneau de stock — signature visuelle : remplit un cercle
   selon stock / (seuil_alerte_stock * 2), plafonné à 100%.
   Un coup d'œil suffit pour repérer ce qui manque.
--------------------------------------------------------- */
function AnneauStock({ stock, seuil, gestionStock }) {
  if (!gestionStock) return null;

  const rayon = 15;
  const circonference = 2 * Math.PI * rayon;
  const cible = Math.max(seuil * 2, 1);
  const ratio = Math.min(stock / cible, 1);
  const enAlerte = stock <= seuil;
  const couleur = enAlerte ? COULEUR_ALERTE : COULEUR_OK;

  return (
    <div className="relative h-9 w-9 shrink-0" title={`${stock} en stock · seuil d'alerte ${seuil}`}>
      <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
        <circle cx="18" cy="18" r={rayon} fill="none" stroke="#12181B0D" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r={rayon}
          fill="none"
          stroke={couleur}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circonference}
          strokeDashoffset={circonference * (1 - ratio)}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold"
        style={{ color: couleur }}
      >
        {stock}
      </span>
    </div>
  );
}

const STATUTS = {
  brouillon: { label: "Brouillon", classe: "bg-[#12181B]/[0.06] text-[#12181B]/50" },
  publie: { label: "Publié", classe: "bg-[var(--boutique-accent,#0E7C66)]/10 text-[var(--boutique-accent,#0E7C66)]" },
  archive: { label: "Archivé", classe: "bg-[#12181B]/[0.08] text-[#12181B]/35" },
};

/* ---------------------------------------------------------
   Menu de statut — 3 états réels (brouillon/publié/archivé),
   remplace l'ancien switch binaire qui ne pouvait pas
   représenter un produit archivé.
--------------------------------------------------------- */
function StatutMenu({ statut, onChanger }) {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fermerSiExterieur = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOuvert(false);
    };
    document.addEventListener("mousedown", fermerSiExterieur);
    return () => document.removeEventListener("mousedown", fermerSiExterieur);
  }, []);

  const config = STATUTS[statut] || STATUTS.brouillon;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOuvert((o) => !o);
        }}
        className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-full pl-2.5 pr-1.5 py-1 hover:brightness-95 transition ${config.classe}`}
      >
        {config.label}
        <ChevronDown size={11} className={`transition-transform ${ouvert ? "rotate-180" : ""}`} />
      </button>

      {ouvert && (
        <div className="absolute z-20 top-full mt-1 left-0 bg-white border border-[#12181B]/10 rounded-xl shadow-lg py-1 min-w-[128px]">
          {Object.entries(STATUTS).map(([valeur, cfg]) => (
            <button
              key={valeur}
              onClick={(e) => {
                e.stopPropagation();
                setOuvert(false);
                if (valeur !== statut) onChanger(valeur);
              }}
              className={`w-full text-left px-3 py-1.5 text-[12.5px] hover:bg-[#12181B]/[0.05] transition-colors ${
                valeur === statut ? "font-medium text-[#12181B]" : "text-[#12181B]/60"
              }`}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Badge promo — visible seulement si une promo est active,
   aucun encombrement pour les produits sans promo.
--------------------------------------------------------- */
function BadgePromo() {
  return (
    <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold rounded-full bg-[#DC2626]/10 text-[#DC2626] px-2 py-0.5">
      <Tag size={10} /> Promo
    </span>
  );
}

function PrixAvecPromo({ produit }) {
  if (produit.promo_active && produit.prix_promo) {
    return (
      <span className="flex items-baseline gap-1.5">
        <span className="text-[14px] font-semibold text-[#DC2626]">
          {Number(produit.prix_promo).toLocaleString("fr-MG")} Ar
        </span>
        <span className="text-[12px] text-[#12181B]/35 line-through">
          {Number(produit.prix).toLocaleString("fr-MG")} Ar
        </span>
      </span>
    );
  }
  return <span className="text-[14px] font-semibold text-[#12181B]">{Number(produit.prix).toLocaleString("fr-MG")} Ar</span>;
}

function ActionsRapides({ onEditer, onSupprimer }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onEditer}
        aria-label="Modifier"
        className="p-1.5 rounded-lg text-[#12181B]/60 hover:text-[#12181B] hover:bg-[#12181B]/[0.06] transition-colors"
      >
        <Pencil size={14} />
      </button>
      <button
        onClick={onSupprimer}
        aria-label="Supprimer"
        className="p-1.5 rounded-lg text-red-500/70 hover:text-red-600 hover:bg-red-50 transition-colors"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

/* ---------------------------------------------------------
   Carte produit — vue grille par défaut
--------------------------------------------------------- */
function CarteProduit({ produit, selectionne, onToggleSelection, onEditer, onSupprimer, onChangerStatut }) {
  const image = produit.images?.find((img) => img.est_principale) || produit.images?.[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className={`group relative bg-white rounded-2xl border transition-shadow hover:shadow-[0_4px_20px_-6px_rgba(18,24,27,0.15)] ${
        selectionne ? "border-[#0E7C66] ring-1 ring-[#0E7C66]" : "border-[#12181B]/10"
      }`}
    >
      <div className="relative aspect-square rounded-t-2xl overflow-hidden bg-[#12181B]/[0.03]">
        {image ? (
          <img src={image.image} alt={produit.nom} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package size={28} className="text-[#12181B]/15" />
          </div>
        )}

        <button
          onClick={() => onToggleSelection(produit.id)}
          className={`absolute top-2.5 left-2.5 h-6 w-6 rounded-md flex items-center justify-center backdrop-blur-sm transition-opacity ${
            selectionne ? "bg-[#0E7C66] text-white opacity-100" : "bg-white/85 text-[#12181B]/50 opacity-0 group-hover:opacity-100"
          }`}
          aria-label="Sélectionner"
        >
          {selectionne ? <CheckSquare size={14} /> : <Square size={14} />}
        </button>

        <div className="absolute top-2.5 right-2.5">
          <AnneauStock stock={produit.stock} seuil={produit.seuil_alerte_stock} gestionStock={produit.gestion_stock} />
        </div>

        {produit.promo_active && (
          <div className="absolute bottom-2 left-2">
            <BadgePromo />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-2 flex items-center justify-end gap-1 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEditer(produit)}
            aria-label="Modifier"
            className="p-1.5 rounded-lg bg-white/90 text-[#12181B] hover:bg-white transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onSupprimer(produit)}
            aria-label="Supprimer"
            className="p-1.5 rounded-lg bg-white/90 text-red-600 hover:bg-white transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="p-3.5">
        <p className="text-[13.5px] font-medium text-[#12181B] truncate leading-snug">{produit.nom}</p>
        <div className="mt-1">
          <PrixAvecPromo produit={produit} />
        </div>
        <div className="mt-2.5">
          <StatutMenu statut={produit.statut} onChanger={(s) => onChangerStatut(produit, s)} />
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------------------------------------------------
   Ligne produit — vue tableau (dense, édition en masse)
--------------------------------------------------------- */
function LigneProduit({ produit, selectionne, onToggleSelection, onEditer, onSupprimer, onChangerStatut }) {
  const image = produit.images?.find((img) => img.est_principale) || produit.images?.[0];

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="border-b border-[#12181B]/[0.06] last:border-0 hover:bg-[#12181B]/[0.015] group"
    >
      <td className="pl-4 py-3">
        <button onClick={() => onToggleSelection(produit.id)} className="text-[#12181B]/40 hover:text-[#12181B]">
          {selectionne ? <CheckSquare size={16} /> : <Square size={16} />}
        </button>
      </td>
      <td className="py-2.5 pl-2">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-[#12181B]/[0.04] shrink-0 overflow-hidden flex items-center justify-center">
            {image ? (
              <img src={image.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <Package size={16} className="text-[#12181B]/20" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-[#12181B] truncate">{produit.nom}</p>
            <div className="flex items-center gap-1.5 text-[12px] text-[#12181B]/40 truncate">
              {produit.sku && <span className="font-mono">{produit.sku}</span>}
              {produit.sku && produit.categorie_nom && <span>·</span>}
              {produit.categorie_nom && <span className="truncate">{produit.categorie_nom}</span>}
            </div>
          </div>
        </div>
      </td>
      <td className="py-2.5 whitespace-nowrap">
        <PrixAvecPromo produit={produit} />
      </td>
      <td className="py-2.5">
        <div className="flex items-center gap-2">
          <AnneauStock stock={produit.stock} seuil={produit.seuil_alerte_stock} gestionStock={produit.gestion_stock} />
          {!produit.gestion_stock && <span className="text-[12px] text-[#12181B]/35">—</span>}
        </div>
      </td>
      <td className="py-2.5">
        <StatutMenu statut={produit.statut} onChanger={(s) => onChangerStatut(produit, s)} />
      </td>
      <td className="py-2.5 pr-4">
        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionsRapides onEditer={() => onEditer(produit)} onSupprimer={() => onSupprimer(produit)} />
        </div>
      </td>
    </motion.tr>
  );
}

export default function Produits() {
  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [produitEnEdition, setProduitEnEdition] = useState(null);
  const [selection, setSelection] = useState([]);
  const [tri, setTri] = useState({ champ: "date_creation", ordre: "desc" });
  const [categories, setCategories] = useState([]);

  const [vue, setVue] = useState("grille"); // "grille" | "tableau"
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("tous"); // "tous" | "publie" | "brouillon"
  const [filtreCategorie, setFiltreCategorie] = useState("toutes");

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
    catalogueApi.listerCategories().then((res) => setCategories(res.data.results || res.data));
  }, []);

  const produitsFiltres = useMemo(() => {
    let liste = [...produits];

    if (recherche.trim()) {
      const q = recherche.trim().toLowerCase();
      liste = liste.filter((p) => p.nom.toLowerCase().includes(q));
    }
    if (filtreStatut !== "tous") {
      liste = liste.filter((p) => p.statut === filtreStatut);
    }
    if (filtreCategorie !== "toutes") {
      liste = liste.filter((p) => String(p.categorie) === String(filtreCategorie));
    }

    liste.sort((a, b) => {
      const valA = a[tri.champ];
      const valB = b[tri.champ];
      const comparaison = typeof valA === "string" ? valA.localeCompare(valB) : valA - valB;
      return tri.ordre === "asc" ? comparaison : -comparaison;
    });

    return liste;
  }, [produits, recherche, filtreStatut, filtreCategorie, tri]);

  const changerTri = (champ) => {
    setTri((t) => ({ champ, ordre: t.champ === champ && t.ordre === "asc" ? "desc" : "asc" }));
  };

  const toggleSelection = (id) => {
    setSelection((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const toggleToutSelectionner = () => {
    setSelection((s) => (s.length === produitsFiltres.length ? [] : produitsFiltres.map((p) => p.id)));
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

  const changerStatut = async (produit, nouveauStatut) => {
    await catalogueApi.modifierProduit(produit.id, { statut: nouveauStatut });
    chargerProduits();
    notifier(`Produit ${STATUTS[nouveauStatut].label.toLowerCase()}.`);
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
      const statut = action === "publier" ? "publie" : action === "archiver" ? "archive" : "brouillon";
      await Promise.all(selection.map((id) => catalogueApi.modifierProduit(id, { statut })));
      notifier(`Produits ${STATUTS[statut].label.toLowerCase()}s.`);
    }
    setSelection([]);
    chargerProduits();
  };

  const filtresActifs = filtreStatut !== "tous" || filtreCategorie !== "toutes" || recherche.trim() !== "";

  const reinitialiserFiltres = () => {
    setRecherche("");
    setFiltreStatut("tous");
    setFiltreCategorie("toutes");
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
        <div>
          <h1 className="font-display text-[24px] font-medium text-[#12181B]">Mes produits</h1>
          <p className="text-[13px] text-[#12181B]/45 mt-0.5">
            {produits.length} produit{produits.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <button
          onClick={ouvrirCreation}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--boutique-primary,#12181B)] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Nouveau produit
        </button>
      </div>

      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#12181B]/35" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un produit…"
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

        <select
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          className="rounded-full border border-[#12181B]/12 bg-white px-3.5 py-2 text-[13px] text-[#12181B]/80 focus:outline-none focus:ring-2 focus:ring-[#0E7C66]/30"
        >
          <option value="tous">Tous les statuts</option>
          <option value="publie">Publié</option>
          <option value="brouillon">Brouillon</option>
          <option value="archive">Archivé</option>
        </select>

        {categories.length > 0 && (
          <select
            value={filtreCategorie}
            onChange={(e) => setFiltreCategorie(e.target.value)}
            className="rounded-full border border-[#12181B]/12 bg-white px-3.5 py-2 text-[13px] text-[#12181B]/80 focus:outline-none focus:ring-2 focus:ring-[#0E7C66]/30"
          >
            <option value="toutes">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        )}

        {filtresActifs && (
          <button
            onClick={reinitialiserFiltres}
            className="text-[13px] text-[#12181B]/45 hover:text-[#12181B] px-2"
          >
            Réinitialiser
          </button>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-0.5 bg-[#12181B]/[0.05] rounded-full p-1">
          <button
            onClick={() => setVue("grille")}
            aria-label="Vue grille"
            className={`p-1.5 rounded-full transition-colors ${
              vue === "grille" ? "bg-white text-[#12181B] shadow-sm" : "text-[#12181B]/40 hover:text-[#12181B]/70"
            }`}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setVue("tableau")}
            aria-label="Vue tableau"
            className={`p-1.5 rounded-full transition-colors ${
              vue === "tableau" ? "bg-white text-[#12181B] shadow-sm" : "text-[#12181B]/40 hover:text-[#12181B]/70"
            }`}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Barre d'actions groupées */}
      <AnimatePresence>
        {selection.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-3 bg-[#12181B] text-[#F6F7F2] rounded-xl px-4 py-3 mb-4 overflow-hidden"
          >
            <span className="text-[13px]">{selection.length} sélectionné{selection.length > 1 ? "s" : ""}</span>
            <div className="flex-1" />
            <button onClick={() => actionGroupee("publier")} className="text-[13px] font-medium hover:underline">
              Publier
            </button>
            <button onClick={() => actionGroupee("depublier")} className="text-[13px] font-medium hover:underline">
              Dépublier
            </button>
            <button onClick={() => actionGroupee("archiver")} className="text-[13px] font-medium hover:underline">
              Archiver
            </button>
            <button onClick={() => actionGroupee("supprimer")} className="text-[13px] font-medium text-red-300 hover:underline">
              Supprimer
            </button>
            <button onClick={() => setSelection([])} className="text-[#F6F7F2]/50 hover:text-[#F6F7F2]">
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {chargement ? (
        vue === "grille" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )
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
      ) : produitsFiltres.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center bg-white border border-dashed border-[#12181B]/15 rounded-xl py-16">
          <Search size={26} className="text-[#12181B]/20 mb-3" />
          <p className="text-[14px] text-[#12181B]/60 mb-1">Aucun résultat pour ces filtres.</p>
          <button onClick={reinitialiserFiltres} className="text-[13px] text-[#0E7C66] font-medium hover:underline mt-2">
            Réinitialiser les filtres
          </button>
        </div>
      ) : vue === "grille" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {produitsFiltres.map((produit) => (
              <CarteProduit
                key={produit.id}
                produit={produit}
                selectionne={selection.includes(produit.id)}
                onToggleSelection={toggleSelection}
                onEditer={ouvrirEdition}
                onSupprimer={supprimer}
                onChangerStatut={changerStatut}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white border border-[#12181B]/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#12181B]/10">
                <th className="w-10 pl-4 py-3">
                  <button onClick={toggleToutSelectionner} className="text-[#12181B]/40 hover:text-[#12181B]">
                    {selection.length === produitsFiltres.length ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </th>
                <th className="text-left py-3 pl-2">
                  <span className="text-[12px] font-medium text-[#12181B]/50 uppercase tracking-wide">Produit</span>
                </th>
                <th className="text-left py-3">
                  <EnTeteColonne champ="prix" label="Prix" />
                </th>
                <th className="text-left py-3">
                  <EnTeteColonne champ="stock" label="Stock" />
                </th>
                <th className="text-left py-3">
                  <span className="text-[12px] font-medium text-[#12181B]/50 uppercase tracking-wide">Statut</span>
                </th>
                <th className="w-20 py-3" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {produitsFiltres.map((produit) => (
                  <LigneProduit
                    key={produit.id}
                    produit={produit}
                    selectionne={selection.includes(produit.id)}
                    onToggleSelection={toggleSelection}
                    onEditer={ouvrirEdition}
                    onSupprimer={supprimer}
                    onChangerStatut={changerStatut}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOuvert} onClose={() => setModalOuvert(false)}>
        <ProduitFormulaire produit={produitEnEdition} categories={categories} onSauvegarde={handleSauvegarde} />
      </Modal>
    </div>
  );
}