import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShoppingBag,
  ChevronDown,
  Search,
  X,
  ArrowUpDown,
  Home,
  Store,
  Clock,
} from "lucide-react";
import { commandesApi } from "../../api/commandes";
import Skeleton from "../../components/ui/Skeleton";
import Modal from "../../components/ui/Modal";
import { useToast } from "../../context/ToastContext";

const STATUTS = [
  ["en_attente", "En attente"],
  ["confirmee", "Confirmée"],
  ["payee", "Payée"],
  ["expediee", "Expédiée"],
  ["livree", "Livrée"],
  ["annulee", "Annulée"],
];

// Hypothèse de flux métier — à ajuster si votre logique diffère,
// notamment pour "confirmee" qui n'existait pas dans la version précédente.
const TRANSITIONS_AUTORISEES = {
  en_attente: ["confirmee", "annulee"],
  confirmee: ["payee", "annulee"],
  payee: ["expediee", "annulee"],
  expediee: ["livree", "annulee"],
  livree: [],
  annulee: [],
};

const COULEUR_STATUT = {
  en_attente: "bg-[#12181B]/[0.06] text-[#12181B]/60",
  confirmee: "bg-blue-50 text-blue-600",
  payee: "bg-[var(--boutique-accent,#0E7C66)]/10 text-[var(--boutique-accent,#0E7C66)]",
  expediee: "bg-amber-50 text-amber-600",
  livree: "bg-emerald-50 text-emerald-600",
  annulee: "bg-red-50 text-red-500",
};

const labelStatut = (valeur) => STATUTS.find(([v]) => v === valeur)?.[1] || valeur;

function BadgeLivraison({ mode }) {
  const estRetrait = mode === "retrait";
  const Icone = estRetrait ? Store : Home;
  return (
    <span className="inline-flex items-center gap-1 text-[11.5px] text-[#12181B]/50">
      <Icone size={12} /> {estRetrait ? "Retrait" : "Domicile"}
    </span>
  );
}

export default function Commandes() {
  const [commandes, setCommandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [commandeSelectionnee, setCommandeSelectionnee] = useState(null);

  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [filtreLivraison, setFiltreLivraison] = useState("");
  const [tri, setTri] = useState({ champ: "date_commande", ordre: "desc" });

  const { notifier } = useToast();

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

  const changerStatut = async (commande, nouveauStatut) => {
    try {
      await commandesApi.changerStatutCommande(commande.id, nouveauStatut);
      notifier(`Commande passée à "${labelStatut(nouveauStatut)}".`);
      charger();
      setCommandeSelectionnee(null);
    } catch {
      notifier("Impossible de changer le statut.", "erreur");
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

function DetailCommande({ commande, onChangerStatut, onEnregistrerNote }) {
  const [menuStatutOuvert, setMenuStatutOuvert] = useState(false);
  const [noteInterne, setNoteInterne] = useState(commande.note_interne || "");
  const noteModifiee = noteInterne !== (commande.note_interne || "");

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-[18px] font-medium text-[#12181B]">{commande.numero_commande}</h2>
          <p className="text-[13px] text-[#12181B]/50 mt-0.5">
            {new Date(commande.date_commande).toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <BadgeLivraison mode={commande.mode_livraison} />
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuStatutOuvert((v) => !v)}
          className={`flex items-center gap-1.5 text-[13px] font-medium rounded-full px-3 py-1.5 ${COULEUR_STATUT[commande.statut]}`}
        >
          {labelStatut(commande.statut)} <ChevronDown size={13} />
        </button>
        {commande.statut === "en_attente" && (
          <p className="text-[12px] text-[#12181B]/40 mt-1.5">
            En attente du paiement par le client. Aucune action requise de ton côté.
          </p>
        )}
        {commande.statut === "annulee" && (
          <div className="mt-2 text-[12.5px] text-[#12181B]/50 space-y-0.5">
            {commande.annulee_le && (
              <p>
                Annulée le{" "}
                {new Date(commande.annulee_le).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
              </p>
            )}
            {commande.motif_annulation && <p className="italic">Motif : {commande.motif_annulation}</p>}
          </div>
        )}
        {menuStatutOuvert && (
          <div className="absolute left-0 mt-1 w-44 rounded-lg bg-white border border-[#12181B]/10 shadow-lg py-1 z-10">
            {(TRANSITIONS_AUTORISEES[commande.statut] || []).length === 0 ? (
              <p className="px-3.5 py-2 text-[12px] text-[#12181B]/40">Aucune action possible</p>
            ) : (
              TRANSITIONS_AUTORISEES[commande.statut].map((valeur) => (
                <button
                  key={valeur}
                  onClick={() => {
                    onChangerStatut(commande, valeur);
                    setMenuStatutOuvert(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-[13px] text-[#12181B]/80 hover:bg-[#12181B]/[0.05]"
                >
                  {labelStatut(valeur)}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <p className="text-[13px] font-medium text-[#12181B]">Produits</p>
        {commande.lignes?.map((ligne) => (
          <div key={ligne.id} className="flex justify-between text-[13px] text-[#12181B]/70">
            <span>
              {ligne.quantite} × {ligne.nom_produit} {ligne.variante_label && `(${ligne.variante_label})`}
            </span>
            <span>{(ligne.quantite * Number(ligne.prix_unitaire)).toLocaleString("fr-MG")} Ar</span>
          </div>
        ))}

        <div className="pt-2 mt-2 border-t border-[#12181B]/10 space-y-1">
          <div className="flex justify-between text-[13px] text-[#12181B]/60">
            <span>Sous-total</span>
            <span>{Number(commande.montant_sous_total).toLocaleString("fr-MG")} Ar</span>
          </div>
          {Number(commande.montant_remise) > 0 && (
            <div className="flex justify-between text-[13px] text-[#12181B]/60">
              <span>Remise</span>
              <span>-{Number(commande.montant_remise).toLocaleString("fr-MG")} Ar</span>
            </div>
          )}
          {Number(commande.frais_livraison) > 0 && (
            <div className="flex justify-between text-[13px] text-[#12181B]/60">
              <span>Frais de livraison</span>
              <span>{Number(commande.frais_livraison).toLocaleString("fr-MG")} Ar</span>
            </div>
          )}
          <div className="flex justify-between text-[14px] font-medium text-[#12181B] pt-1">
            <span>Total</span>
            <span>{Number(commande.montant_total).toLocaleString("fr-MG")} Ar</span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-[13px] font-medium text-[#12181B]">Livraison</p>
        <p className="text-[13px] text-[#12181B]/60">
          {commande.mode_livraison === "retrait" ? "Retrait en boutique" : "Livraison à domicile"}
        </p>
        <p className="text-[13px] text-[#12181B]/60">
          {commande.nom_destinataire} — {commande.telephone_destinataire}
        </p>
        {commande.zone_livraison && <p className="text-[13px] text-[#12181B]/60">{commande.zone_livraison}</p>}
        {commande.adresse_complete && <p className="text-[13px] text-[#12181B]/60">{commande.adresse_complete}</p>}
        {commande.instructions_livraison && (
          <p className="text-[13px] text-[#12181B]/50 italic">"{commande.instructions_livraison}"</p>
        )}
      </div>

      {commande.note_client && (
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-[#12181B]">Message du client</p>
          <p className="text-[13px] text-[#12181B]/60">{commande.note_client}</p>
        </div>
      )}

      {/* Timeline — n'apparaît que si l'API expose commande.historique */}
      {commande.historique?.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-[#12181B]">Historique</p>
          <div className="space-y-2.5">
            {commande.historique.map((evt, i) => (
              <div key={evt.id || i} className="flex gap-2.5">
                <div className="flex flex-col items-center pt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#12181B]/30" />
                  {i < commande.historique.length - 1 && <span className="w-px flex-1 bg-[#12181B]/10 mt-1" />}
                </div>
                <div className="pb-2">
                  <p className="text-[12.5px] text-[#12181B]/80">
                    {labelStatut(evt.statut)}
                    {evt.statut_precedent && (
                      <span className="text-[#12181B]/35"> (depuis {labelStatut(evt.statut_precedent)})</span>
                    )}
                  </p>
                  <p className="text-[11.5px] text-[#12181B]/40">
                    {new Date(evt.date).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {evt.commentaire && <p className="text-[12px] text-[#12181B]/50 italic mt-0.5">{evt.commentaire}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Note interne — visible uniquement par le commerçant */}
      <div className="space-y-1.5 pt-2 border-t border-[#12181B]/10">
        <div className="flex items-center gap-1.5">
          <Clock size={13} className="text-[#12181B]/35" />
          <p className="text-[13px] font-medium text-[#12181B]">Note interne</p>
        </div>
        <textarea
          value={noteInterne}
          onChange={(e) => setNoteInterne(e.target.value)}
          placeholder="Note visible uniquement par toi, pas par le client…"
          rows={2}
          className="w-full rounded-lg border border-[#12181B]/12 px-3 py-2 text-[13px] text-[#12181B] placeholder:text-[#12181B]/35 focus:outline-none focus:ring-2 focus:ring-[#0E7C66]/30 resize-none"
        />
        {noteModifiee && (
          <button
            onClick={() => onEnregistrerNote(commande, noteInterne)}
            className="text-[12.5px] font-medium text-[#0E7C66] hover:underline"
          >
            Enregistrer la note
          </button>
        )}
      </div>
    </div>
  );
}