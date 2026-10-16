import { useEffect, useState } from "react";
import { Check, Clock, CreditCard } from "lucide-react";
import { abonnementsApi } from "../../api/abonnements";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import Skeleton from "../../components/ui/Skeleton";

export default function Abonnement() {
  const [abonnement, setAbonnement] = useState(null);
  const [plans, setPlans] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [periodicite, setPeriodicite] = useState("mensuel");

  const { notifier } = useToast();
  const confirmer = useConfirm();

  const charger = () => {
    setChargement(true);
    Promise.all([abonnementsApi.obtenirMonAbonnement(), abonnementsApi.listerPlans()])
      .then(([resAbo, resPlans]) => {
        setAbonnement(resAbo.data);
        setPlans(resPlans.data.results || resPlans.data);
        setPeriodicite(resAbo.data.periodicite);
      })
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    charger();
  }, []);

  const choisirPlan = async (plan) => {
    if (abonnement?.plan?.code === plan.code && abonnement?.periodicite === periodicite) return;

    const ok = await confirmer({
      titre: `Passer au plan ${plan.nom} ?`,
      message: `Facturation ${periodicite === "annuel" ? "annuelle" : "mensuelle"} — ${Number(
        plan.prix_pour ? plan.prix_pour : periodicite === "annuel" ? plan.prix_annuel : plan.prix_mensuel
      ).toLocaleString("fr-MG")} Ar. Environnement de démonstration, aucun paiement réel n'est effectué.`,
      texteConfirmer: "Confirmer",
    });
    if (!ok) return;

    try {
      await abonnementsApi.changerPlan(plan.code, periodicite);
      notifier(`Plan changé pour "${plan.nom}".`);
      charger();
    } catch {
      notifier("Impossible de changer de plan.", "erreur");
    }
  };

  if (chargement) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-[24px] font-medium text-[#12181B] mb-6">Abonnement</h1>

      {abonnement && (
        <div className="bg-white border border-[#12181B]/10 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-[#12181B]/50">Plan actuel</p>
              <p className="text-[18px] font-medium text-[#12181B]">{abonnement.plan.nom}</p>
            </div>
            <span className={`text-[12px] font-medium rounded-full px-3 py-1 ${
              abonnement.statut === "essai" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
            }`}>
              {abonnement.statut === "essai" ? "Essai gratuit" : "Actif"}
            </span>
          </div>

          {abonnement.statut === "essai" && abonnement.jours_restants_essai !== null && (
            <div className="flex items-center gap-1.5 mt-3 text-[13px] text-[#12181B]/60">
              <Clock size={14} />
              {abonnement.jours_restants_essai > 0
                ? `${abonnement.jours_restants_essai} jour${abonnement.jours_restants_essai > 1 ? "s" : ""} restant${abonnement.jours_restants_essai > 1 ? "s" : ""} d'essai`
                : "Ton essai gratuit est terminé — choisis un plan pour continuer."}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => setPeriodicite("mensuel")}
          className={`text-[13px] font-medium rounded-full px-4 py-2 transition-colors ${
            periodicite === "mensuel" ? "bg-[#12181B] text-[#F6F7F2]" : "bg-[#12181B]/[0.06] text-[#12181B]/60"
          }`}
        >
          Mensuel
        </button>
        <button
          onClick={() => setPeriodicite("annuel")}
          className={`text-[13px] font-medium rounded-full px-4 py-2 transition-colors ${
            periodicite === "annuel" ? "bg-[#12181B] text-[#F6F7F2]" : "bg-[#12181B]/[0.06] text-[#12181B]/60"
          }`}
        >
          Annuel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const prix = periodicite === "annuel" ? plan.prix_annuel : plan.prix_mensuel;
          const estActuel = abonnement?.plan?.code === plan.code && abonnement?.periodicite === periodicite;
          return (
            <div
              key={plan.id}
              className={`rounded-xl border p-5 flex flex-col ${
                estActuel ? "border-[#12181B] bg-[#12181B]/[0.02]" : "border-[#12181B]/10 bg-white"
              }`}
            >
              <p className="text-[15px] font-medium text-[#12181B]">{plan.nom}</p>
              <p className="text-[24px] font-medium text-[#12181B] mt-2">
                {Number(prix).toLocaleString("fr-MG")} <span className="text-[13px] text-[#12181B]/50">Ar / {periodicite === "annuel" ? "an" : "mois"}</span>
              </p>
              {plan.description && <p className="text-[13px] text-[#12181B]/60 mt-2">{plan.description}</p>}

              <ul className="space-y-1.5 mt-4 flex-1">
                <li className="flex items-center gap-1.5 text-[13px] text-[#12181B]/70">
                  <Check size={14} className="text-[#0E7C66]" />
                  {plan.nombre_produits_max ? `${plan.nombre_produits_max} produits max` : "Produits illimités"}
                </li>
                <li className="flex items-center gap-1.5 text-[13px] text-[#12181B]/70">
                  <Check size={14} className="text-[#0E7C66]" />
                  {Number(plan.commission_transaction * 100).toFixed(0)}% de commission par vente
                </li>
                {plan.fonctionnalites?.badge_verifie_gratuit && (
                  <li className="flex items-center gap-1.5 text-[13px] text-[#12181B]/70">
                    <Check size={14} className="text-[#0E7C66]" /> Badge vérifié inclus
                  </li>
                )}
                {plan.fonctionnalites?.support_prioritaire && (
                  <li className="flex items-center gap-1.5 text-[13px] text-[#12181B]/70">
                    <Check size={14} className="text-[#0E7C66]" /> Support prioritaire
                  </li>
                )}
              </ul>

              <button
                onClick={() => choisirPlan(plan)}
                disabled={estActuel}
                className="mt-5 rounded-full text-[14px] font-medium px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[#12181B] text-[#F6F7F2] hover:bg-[#0E7C66]"
              >
                {estActuel ? "Plan actuel" : "Choisir ce plan"}
              </button>
            </div>
          );
        })}
      </div>

      {abonnement?.factures?.length > 0 && (
        <div className="mt-8">
          <p className="text-[14px] font-medium text-[#12181B] mb-3 flex items-center gap-1.5">
            <CreditCard size={15} /> Historique de facturation
          </p>
          <div className="bg-white border border-[#12181B]/10 rounded-xl overflow-hidden">
            {abonnement.factures.map((facture) => (
              <div key={facture.numero_facture} className="flex items-center justify-between px-4 py-3 border-b border-[#12181B]/[0.06] last:border-0">
                <div>
                  <p className="text-[13px] font-medium text-[#12181B]">{facture.numero_facture}</p>
                  <p className="text-[12px] text-[#12181B]/50">
                    {new Date(facture.date_emission).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <span className="text-[13px] text-[#12181B]/70">{Number(facture.montant).toLocaleString("fr-MG")} Ar</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}