import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Package, CheckCircle2, Circle, XCircle } from "lucide-react";
import { commandesApi } from "../../api/commandes";
import { useBoutiquePublique } from "../../context/BoutiquePubliqueContext";
import Skeleton from "../../components/ui/Skeleton";

const ETAPES_NORMALES = ["en_attente", "confirmee", "payee", "expediee", "livree"];
const LABELS_STATUT = {
  en_attente: "En attente",
  confirmee: "Confirmée",
  payee: "Payée",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
};

export default function Suivi() {
  const { numeroCommande } = useParams();
  const { sousDomaine, boutique } = useBoutiquePublique();
  const [commande, setCommande] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    setChargement(true);
    setErreur(false);
    commandesApi
      .obtenirCommande(numeroCommande)
      .then((res) => setCommande(res.data))
      .catch(() => setErreur(true))
      .finally(() => setChargement(false));
  }, [numeroCommande]);

  if (chargement) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (erreur || !commande) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <Package size={28} className="text-[#12181B]/20 mx-auto mb-3" />
        <p className="text-[14px] text-[#12181B]/60">
          Cette commande n'existe pas, ou tu n'as pas accès à son suivi.
        </p>
        <Link to={`/boutique/${sousDomaine}`} className="text-[13px] text-[#12181B] underline mt-3 inline-block">
          Retour à la boutique
        </Link>
      </div>
    );
  }

  const estAnnulee = commande.statut === "annulee";
  const indexActuel = ETAPES_NORMALES.indexOf(commande.statut);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <p className="text-[13px] text-[#12181B]/50">Commande</p>
      <h1 className="font-display text-[22px] font-medium text-[#12181B]">{commande.numero_commande}</h1>
      <p className="text-[13px] text-[#12181B]/50 mt-1">
        Passée le {new Date(commande.date_commande).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      {/* Timeline */}
      <div className="bg-white border border-[#12181B]/10 rounded-xl p-6 mt-6">
        {estAnnulee ? (
          <div className="flex items-center gap-3">
            <XCircle size={20} className="text-red-500 shrink-0" />
            <div>
              <p className="text-[14px] font-medium text-[#12181B]">Commande annulée</p>
              {commande.motif_annulation && (
                <p className="text-[13px] text-[#12181B]/60 mt-0.5">{commande.motif_annulation}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {ETAPES_NORMALES.map((etape, i) => {
              const franchie = i <= indexActuel;
              const evenement = commande.historique?.find((h) => h.statut === etape);
              return (
                <div key={etape} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {franchie ? (
                      <CheckCircle2 size={18} className="text-[var(--boutique-accent,#0E7C66)]" />
                    ) : (
                      <Circle size={18} className="text-[#12181B]/20" />
                    )}
                    {i < ETAPES_NORMALES.length - 1 && (
                      <div className={`w-px flex-1 min-h-[24px] ${franchie ? "bg-[var(--boutique-accent,#0E7C66)]" : "bg-[#12181B]/10"}`} />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className={`text-[14px] ${franchie ? "text-[#12181B] font-medium" : "text-[#12181B]/40"}`}>
                      {LABELS_STATUT[etape]}
                    </p>
                    {evenement && (
                      <p className="text-[12px] text-[#12181B]/40 mt-0.5">
                        {new Date(evenement.date).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Récapitulatif */}
      <div className="bg-white border border-[#12181B]/10 rounded-xl p-6 mt-4">
        <p className="text-[14px] font-medium text-[#12181B] mb-3">Récapitulatif</p>
        <div className="space-y-1.5">
          {commande.lignes?.map((ligne) => (
            <div key={ligne.id} className="flex justify-between text-[13px] text-[#12181B]/70">
              <span>{ligne.quantite} × {ligne.nom_produit} {ligne.variante_label && `(${ligne.variante_label})`}</span>
              <span>{(ligne.quantite * Number(ligne.prix_unitaire)).toLocaleString("fr-MG")} {boutique.devise}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[13px] text-[#12181B]/60 mt-3 pt-3 border-t border-[#12181B]/10">
          <span>Sous-total</span>
          <span>{Number(commande.montant_sous_total).toLocaleString("fr-MG")} {boutique.devise}</span>
        </div>
        {Number(commande.frais_livraison) > 0 && (
          <div className="flex justify-between text-[13px] text-[#12181B]/60 mt-1">
            <span>Livraison</span>
            <span>{Number(commande.frais_livraison).toLocaleString("fr-MG")} {boutique.devise}</span>
          </div>
        )}
        <div className="flex justify-between text-[14px] font-medium text-[#12181B] mt-2 pt-2 border-t border-[#12181B]/10">
          <span>Total</span>
          <span>{Number(commande.montant_total).toLocaleString("fr-MG")} {boutique.devise}</span>
        </div>
      </div>

      {/* Livraison */}
      <div className="bg-white border border-[#12181B]/10 rounded-xl p-6 mt-4">
        <p className="text-[14px] font-medium text-[#12181B] mb-2">Livraison</p>
        <p className="text-[13px] text-[#12181B]/60">
          {commande.mode_livraison === "retrait" ? "Retrait en boutique" : "Livraison à domicile"}
        </p>
        <p className="text-[13px] text-[#12181B]/60 mt-0.5">{commande.nom_destinataire} — {commande.telephone_destinataire}</p>
        {commande.adresse_complete && <p className="text-[13px] text-[#12181B]/60 mt-0.5">{commande.adresse_complete}</p>}
      </div>
    </div>
  );
}