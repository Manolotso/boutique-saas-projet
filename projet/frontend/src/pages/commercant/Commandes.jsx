import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, Search, X, ArrowUpDown } from "lucide-react";
import { commandesApi } from "../../api/commandes";
import Skeleton from "../../components/ui/Skeleton";
import Modal from "../../components/ui/Modal";
import { useToast } from "../../context/ToastContext";
import DetailCommande, {
  STATUTS,
  COULEUR_STATUT,
  labelStatut,
  BadgeLivraison,
} from "../../components/commercant/DetailCommande";

export default function Commandes() {
  const [commandes, setCommandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [commandeSelectionnee, setCommandeSelectionnee] = useState(null);

  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [filtreLivraison, setFiltreLivraison] = useState("");
  const [tri, setTri] = useState({ champ: "date_commande", ordre: "desc" });

  const { notifier } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const rechargeFaite = useRef(false);

  const charger = () => {
    setChargement(true);
    commandesApi
      .listerCommandesGestion()
      .then((res) => setCommandes(res.data.results || res.data))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    charger();
  }, []);

  // Lien venant d'une notification (?commande=NUMERO) : on ouvre le détail de cette commande.
  // Si elle n'est pas dans la liste déjà chargée (elle vient d'arriver), on recharge une fois.
  useEffect(() => {
    const numero = searchParams.get("commande");
    if (!numero || chargement) return;

    const trouvee = commandes.find((c) => c.numero_commande === numero);
    if (trouvee) {
      setCommandeSelectionnee(trouvee);
      setSearchParams({}, { replace: true });
      rechargeFaite.current = false;
    } else if (!rechargeFaite.current) {
      rechargeFaite.current = true;
      charger();
    } else {
      setSearchParams({}, { replace: true });
      rechargeFaite.current = false;
    }
  }, [searchParams, commandes, chargement]);

  const commandesFiltrees = useMemo(() => {
    let liste = [...commandes];

    if (recherche.trim()) {
      const q = recherche.trim().toLowerCase();
      liste = liste.filter(
        (c) =>
          c.numero_commande?.toLowerCase().includes(q) ||
          c.nom_destinataire?.toLowerCase().includes(q)
      );
    }
    if (filtreStatut) liste = liste.filter((c) => c.statut === filtreStatut);
    if (filtreLivraison) liste = liste.filter((c) => c.mode_livraison === filtreLivraison);

    liste.sort((a, b) => {
      const valA = a[tri.champ];
      const valB = b[tri.champ];
      const comparaison =
        typeof valA === "string" ? valA.localeCompare(valB) : Number(valA) - Number(valB);
      return tri.ordre === "asc" ? comparaison : -comparaison;
    });

    return liste;
  }, [commandes, recherche, filtreStatut, filtreLivraison, tri]);

  const changerTri = (champ) => {
    setTri((t) => ({ champ, ordre: t.champ === champ && t.ordre === "asc" ? "desc" : "asc" }));
  };

  const filtresActifs = Boolean(recherche.trim() || filtreStatut || filtreLivraison);
  const reinitialiserFiltres = () => {
    setRecherche("");
    setFiltreStatut("");
    setFiltreLivraison("");
  };

  const ouvrirDetail = (commande) => setCommandeSelectionnee(commande);

  const changerStatut = async (commande, nouveauStatut, commentaire = "") => {
    try {
      await commandesApi.changerStatutCommande(commande.id, nouveauStatut, commentaire);
      notifier(`Commande passée à "${labelStatut(nouveauStatut)}".`);
      charger();
      setCommandeSelectionnee(null);
    } catch (err) {
      const data = err.response?.data;
      const premier = data && typeof data === "object" ? Object.values(data)[0] : data;
      notifier((Array.isArray(premier) ? premier[0] : premier) || "Impossible de changer le statut.", "erreur");
    }
  };

  const enregistrerNoteInterne = async (commande, note) => {
    try {
      await commandesApi.modifierCommande(commande.id, { note_interne: note });
      notifier("Note enregistrée.");
      charger();
    } catch {
      notifier("Impossible d'enregistrer la note.", "erreur");
    }
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
          <h1 className="font-display text-[24px] font-medium text-[#12181B]">Commandes</h1>
          <p className="text-[13px] text-[#12181B]/45 mt-0.5">
            {commandes.length} commande{commandes.length > 1 ? "s" : ""} au total
          </p>
        </div>
      </div>

      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#12181B]/35" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="N° commande ou client…"
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
          <option value="">Tous les statuts</option>
          {STATUTS.map(([valeur, label]) => (
            <option key={valeur} value={valeur}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={filtreLivraison}
          onChange={(e) => setFiltreLivraison(e.target.value)}
          className="rounded-full border border-[#12181B]/12 bg-white px-3.5 py-2 text-[13px] text-[#12181B]/80 focus:outline-none focus:ring-2 focus:ring-[#0E7C66]/30"
        >
          <option value="">Tous les modes</option>
          <option value="domicile">Domicile</option>
          <option value="retrait">Retrait</option>
        </select>

        {filtresActifs && (
          <button
            onClick={reinitialiserFiltres}
            className="text-[13px] text-[#12181B]/45 hover:text-[#12181B] px-2"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {chargement ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : commandes.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center bg-white border border-dashed border-[#12181B]/15 rounded-xl py-16">
          <ShoppingBag size={28} className="text-[#12181B]/25 mb-3" />
          <p className="text-[14px] text-[#12181B]/60">Aucune commande pour l'instant.</p>
        </div>
      ) : commandesFiltrees.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center bg-white border border-dashed border-[#12181B]/15 rounded-xl py-16">
          <Search size={26} className="text-[#12181B]/20 mb-3" />
          <p className="text-[14px] text-[#12181B]/60 mb-1">Aucun résultat pour ces filtres.</p>
          <button onClick={reinitialiserFiltres} className="text-[13px] text-[#0E7C66] font-medium hover:underline mt-2">
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#12181B]/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#12181B]/10">
                <th className="text-left py-3 pl-4">
                  <span className="text-[12px] font-medium text-[#12181B]/50 uppercase tracking-wide">N° commande</span>
                </th>
                <th className="text-left py-3">
                  <span className="text-[12px] font-medium text-[#12181B]/50 uppercase tracking-wide">Client</span>
                </th>
                <th className="text-left py-3">
                  <span className="text-[12px] font-medium text-[#12181B]/50 uppercase tracking-wide">Livraison</span>
                </th>
                <th className="text-left py-3">
                  <EnTeteColonne champ="montant_total" label="Total" />
                </th>
                <th className="text-left py-3">
                  <span className="text-[12px] font-medium text-[#12181B]/50 uppercase tracking-wide">Statut</span>
                </th>
                <th className="text-left py-3 pr-4">
                  <EnTeteColonne champ="date_commande" label="Date" />
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {commandesFiltrees.map((commande) => (
                  <motion.tr
                    layout
                    key={commande.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => ouvrirDetail(commande)}
                    className="border-b border-[#12181B]/[0.06] last:border-0 hover:bg-[#12181B]/[0.015] cursor-pointer"
                  >
                    <td className="py-3 pl-4 text-[13px] font-medium text-[#12181B]">{commande.numero_commande}</td>
                    <td className="py-3 text-[13px] text-[#12181B]/70">{commande.nom_destinataire || "—"}</td>
                    <td className="py-3">
                      <BadgeLivraison mode={commande.mode_livraison} />
                    </td>
                    <td className="py-3 text-[13px] text-[#12181B]/70 whitespace-nowrap">
                      {Number(commande.montant_total).toLocaleString("fr-MG")} Ar
                    </td>
                    <td className="py-3">
                      <span className={`text-[12px] font-medium rounded-full px-2.5 py-1 ${COULEUR_STATUT[commande.statut]}`}>
                        {labelStatut(commande.statut)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[13px] text-[#12181B]/50 whitespace-nowrap">
                      {new Date(commande.date_commande).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={Boolean(commandeSelectionnee)} onClose={() => setCommandeSelectionnee(null)} maxWidth="max-w-xl">
        {commandeSelectionnee && (
          <DetailCommande
            commande={commandeSelectionnee}
            onChangerStatut={changerStatut}
            onEnregistrerNote={enregistrerNoteInterne}
          />
        )}
      </Modal>
    </div>
  );
}