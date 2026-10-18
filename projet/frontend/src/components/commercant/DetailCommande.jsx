import { useState } from "react";
import { ChevronDown, Home, Store, Clock } from "lucide-react";

export const STATUTS = [
  ["en_attente", "En attente"],
  ["confirmee", "Confirmée"],
  ["payee", "Payée"],
  ["expediee", "Expédiée"],
  ["livree", "Livrée"],
  ["annulee", "Annulée"],
];

// Doit rester identique à CommandeCommercantViewSet.TRANSITIONS_AUTORISEES (Django)
const TRANSITIONS_AUTORISEES = {
  en_attente: ["annulee"],
  confirmee: [],
  payee: ["expediee", "annulee"],
  expediee: ["livree", "annulee"],
  livree: [],
  annulee: [],
};

export const COULEUR_STATUT = {
  en_attente: "bg-[#12181B]/[0.06] text-[#12181B]/60",
  confirmee: "bg-blue-50 text-blue-600",
  payee: "bg-[var(--boutique-accent,#0E7C66)]/10 text-[var(--boutique-accent,#0E7C66)]",
  expediee: "bg-amber-50 text-amber-600",
  livree: "bg-emerald-50 text-emerald-600",
  annulee: "bg-red-50 text-red-500",
};

export const labelStatut = (valeur) => STATUTS.find(([v]) => v === valeur)?.[1] || valeur;

export function BadgeLivraison({ mode }) {
  const estRetrait = mode === "retrait";
  const Icone = estRetrait ? Store : Home;
  return (
    <span className="inline-flex items-center gap-1 text-[11.5px] text-[#12181B]/50">
      <Icone size={12} /> {estRetrait ? "Retrait" : "Domicile"}
    </span>
  );
}

export default function DetailCommande({ commande, onChangerStatut, onEnregistrerNote }) {
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
    if (valeur === "annulee") {
      const motif = window.prompt("Motif de l'annulation (visible par le client) :");
      if (motif === null) return; // l'utilisateur a abandonné
      onChangerStatut(commande, valeur, motif);
    } else {
      onChangerStatut(commande, valeur);
    }
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