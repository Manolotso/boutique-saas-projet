import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Store } from "lucide-react";
import { commandesApi } from "../api/commandes";
import Skeleton from "../components/ui/Skeleton";

const LABELS_STATUT = {
  en_attente: "En attente",
  confirmee: "Confirmée",
  payee: "Payée",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
};

const COULEUR_STATUT = {
  en_attente: "bg-[#12181B]/[0.06] text-[#12181B]/60",
  confirmee: "bg-blue-50 text-blue-600",
  payee: "bg-[#0E7C66]/10 text-[#0E7C66]",
  expediee: "bg-amber-50 text-amber-600",
  livree: "bg-emerald-50 text-emerald-600",
  annulee: "bg-red-50 text-red-500",
};

export default function MesCommandes() {
  const [commandes, setCommandes] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    commandesApi
      .listerMesCommandes()
      .then((res) => setCommandes(res.data.results || res.data))
      .finally(() => setChargement(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FBFAF6]">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-display text-[24px] font-medium text-[#12181B] mb-6">Mes commandes</h1>

        {chargement ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : commandes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center bg-white border border-dashed border-[#12181B]/15 rounded-xl py-16">
            <ShoppingBag size={28} className="text-[#12181B]/25 mb-3" />
            <p className="text-[14px] text-[#12181B]/60">Tu n'as pas encore passé de commande.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {commandes.map((commande) => (
              <Link
                key={commande.id}
                to={`/boutique/${commande.boutique_sous_domaine}/commande/${commande.numero_commande}/suivi`}
                className="flex items-center justify-between bg-white border border-[#12181B]/10 rounded-xl px-5 py-4 hover:border-[#12181B]/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#12181B]/[0.04] shrink-0">
                    <Store size={16} className="text-[#12181B]/40" />
                  </span>
                  <div>
                    <p className="text-[14px] font-medium text-[#12181B]">{commande.boutique_nom}</p>
                    <p className="text-[13px] text-[#12181B]/50">
                      {commande.numero_commande} · {new Date(commande.date_commande).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[14px] font-medium text-[#12181B]">
                    {Number(commande.montant_total).toLocaleString("fr-MG")} Ar
                  </span>
                  <span className={`text-[12px] font-medium rounded-full px-2.5 py-1 ${COULEUR_STATUT[commande.statut]}`}>
                    {LABELS_STATUT[commande.statut]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}