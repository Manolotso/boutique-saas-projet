import { useEffect, useMemo, useState } from "react";
import { Store, CheckCircle2, ShieldOff, ShieldCheck } from "lucide-react";
import { tenantsApi } from "../../api/tenants";
import Skeleton from "../../components/ui/Skeleton";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";

const COULEUR_STATUT = {
  actif: "bg-emerald-50 text-emerald-600",
  en_essai: "bg-blue-50 text-blue-600",
  suspendu: "bg-red-50 text-red-500",
};

export default function Boutiques() {
  const [boutiques, setBoutiques] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtre, setFiltre] = useState("");

  const { notifier } = useToast();
  const confirmer = useConfirm();

  const charger = () => {
    setChargement(true);
    tenantsApi
      .listerBoutiquesAdmin()
      .then((res) => setBoutiques(res.data.results || res.data))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    charger();
  }, []);

  const boutiquesFiltrees = useMemo(
    () => (filtre ? boutiques.filter((b) => b.statut === filtre) : boutiques),
    [boutiques, filtre]
  );

  const toggleSuspension = async (boutique) => {
    const suspendre = boutique.statut !== "suspendu";
    const ok = await confirmer({
      titre: suspendre ? "Suspendre cette boutique ?" : "Réactiver cette boutique ?",
      message: suspendre
        ? `"${boutique.nom_boutique}" ne sera plus visible publiquement tant qu'elle est suspendue.`
        : `"${boutique.nom_boutique}" redeviendra visible publiquement.`,
      texteConfirmer: suspendre ? "Suspendre" : "Réactiver",
      danger: suspendre,
    });
    if (!ok) return;

    try {
      if (suspendre) {
        await tenantsApi.suspendreBoutique(boutique.id);
        notifier("Boutique suspendue.", "info");
      } else {
        await tenantsApi.reactiverBoutique(boutique.id);
        notifier("Boutique réactivée.");
      }
      charger();
    } catch {
      notifier("Impossible de modifier le statut.", "erreur");
    }
  };

  const toggleVerification = async (boutique) => {
    try {
      if (boutique.est_verifie) {
        await tenantsApi.retirerVerificationBoutique(boutique.id);
        notifier("Badge de vérification retiré.", "info");
      } else {
        await tenantsApi.verifierBoutique(boutique.id);
        notifier("Boutique vérifiée.");
      }
      charger();
    } catch {
      notifier("Impossible de modifier la vérification.", "erreur");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-[24px] font-medium text-[#12181B]">Boutiques</h1>
        <select
          value={filtre}
          onChange={(e) => setFiltre(e.target.value)}
          className="rounded-lg border border-[#12181B]/10 px-3 py-2 text-[13px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="en_essai">En essai</option>
          <option value="suspendu">Suspendu</option>
        </select>
      </div>

      {chargement ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : boutiquesFiltrees.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center bg-white border border-dashed border-[#12181B]/15 rounded-xl py-16">
          <Store size={28} className="text-[#12181B]/25 mb-3" />
          <p className="text-[14px] text-[#12181B]/60">Aucune boutique.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#12181B]/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#12181B]/10">
                <th className="text-left py-3 pl-4"><span className="text-[12px] font-medium text-[#12181B]/50 uppercase tracking-wide">Boutique</span></th>
                <th className="text-left py-3"><span className="text-[12px] font-medium text-[#12181B]/50 uppercase tracking-wide">Commerçant</span></th>
                <th className="text-left py-3"><span className="text-[12px] font-medium text-[#12181B]/50 uppercase tracking-wide">Produits</span></th>
                <th className="text-left py-3"><span className="text-[12px] font-medium text-[#12181B]/50 uppercase tracking-wide">Commandes</span></th>
                <th className="text-left py-3"><span className="text-[12px] font-medium text-[#12181B]/50 uppercase tracking-wide">Statut</span></th>
                <th className="w-40 py-3" />
              </tr>
            </thead>
            <tbody>
              {boutiquesFiltrees.map((boutique) => (
                <tr key={boutique.id} className="border-b border-[#12181B]/[0.06] last:border-0 hover:bg-[#12181B]/[0.015]">
                  <td className="py-3 pl-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-[#12181B]">{boutique.nom_boutique}</span>
                      {boutique.est_verifie && <CheckCircle2 size={14} className="text-[#0E7C66]" />}
                    </div>
                  </td>
                  <td className="py-3 text-[13px] text-[#12181B]/70">{boutique.commercant_email}</td>
                  <td className="py-3 text-[13px] text-[#12181B]/70">{boutique.nombre_produits}</td>
                  <td className="py-3 text-[13px] text-[#12181B]/70">{boutique.nombre_commandes}</td>
                  <td className="py-3">
                    <span className={`text-[12px] font-medium rounded-full px-2.5 py-1 ${COULEUR_STATUT[boutique.statut]}`}>
                      {boutique.statut === "en_essai" ? "En essai" : boutique.statut === "actif" ? "Actif" : "Suspendu"}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => toggleVerification(boutique)}
                        title={boutique.est_verifie ? "Retirer la vérification" : "Vérifier"}
                        className="p-1.5 rounded-lg text-[#12181B]/50 hover:text-[#12181B] hover:bg-[#12181B]/[0.05]"
                      >
                        <CheckCircle2 size={15} />
                      </button>
                      <button
                        onClick={() => toggleSuspension(boutique)}
                        title={boutique.statut === "suspendu" ? "Réactiver" : "Suspendre"}
                        className={`p-1.5 rounded-lg hover:bg-[#12181B]/[0.05] ${
                          boutique.statut === "suspendu" ? "text-[#0E7C66]" : "text-red-500/70 hover:text-red-600"
                        }`}
                      >
                        {boutique.statut === "suspendu" ? <ShieldCheck size={15} /> : <ShieldOff size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}