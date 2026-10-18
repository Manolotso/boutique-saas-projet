import { useEffect, useMemo, useState } from "react";
import { Store, CheckCircle2, ShieldOff, ShieldCheck, Search, X } from "lucide-react";
import { tenantsApi } from "../../api/tenants";
import Skeleton from "../../components/ui/Skeleton";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";

const COULEUR_STATUT = {
  actif: "bg-emerald-50 text-emerald-600",
  en_essai: "bg-blue-50 text-blue-600",
  suspendu: "bg-red-50 text-red-500",
};

const LABEL_STATUT = { actif: "Actif", en_essai: "En essai", suspendu: "Suspendu" };

// Minuscules et sans accents
const normaliser = (texte) =>
  (texte || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const CLASSE_FILTRE =
  "h-10 rounded-lg border border-[#12181B]/10 bg-white px-3 text-[13px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20";

export default function Boutiques() {
  const [boutiques, setBoutiques] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [filtreVerif, setFiltreVerif] = useState("");

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

  const boutiquesFiltrees = useMemo(() => {
    const terme = normaliser(recherche.trim());
    return boutiques.filter((b) => {
      if (filtreStatut && b.statut !== filtreStatut) return false;
      if (filtreVerif === "verifiee" && !b.est_verifie) return false;
      if (filtreVerif === "non_verifiee" && b.est_verifie) return false;
      if (!terme) return true;
      return normaliser(`${b.nom_boutique} ${b.commercant_email}`).includes(terme);
    });
  }, [boutiques, recherche, filtreStatut, filtreVerif]);

  const filtreActif = recherche.trim() !== "" || filtreStatut !== "" || filtreVerif !== "";

  const reinitialiser = () => {
    setRecherche("");
    setFiltreStatut("");
    setFiltreVerif("");
  };

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
      <div className="mb-6">
        <h1 className="font-display text-[24px] font-medium text-[#12181B]">Boutiques</h1>
        <p className="mt-1 text-[13px] text-[#12181B]/50">
          {boutiquesFiltrees.length} boutique{boutiquesFiltrees.length > 1 ? "s" : ""}
          {filtreActif && ` sur ${boutiques.length}`}
        </p>
      </div>

      {/* Recherche et filtres */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#12181B]/35" />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher par boutique ou email"
            aria-label="Rechercher une boutique"
            className="h-10 w-full rounded-lg border border-[#12181B]/10 bg-white pl-10 pr-9 text-[13px] text-[#12181B] placeholder:text-[#12181B]/35 focus:outline-none focus:ring-2 focus:ring-[#12181B]/20 [&::-webkit-search-cancel-button]:hidden"
          />
          {recherche && (
            <button
              onClick={() => setRecherche("")}
              aria-label="Effacer la recherche"
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#12181B]/40 hover:bg-[#12181B]/5 hover:text-[#12181B]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} aria-label="Filtrer par statut" className={CLASSE_FILTRE}>
            <option value="">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="en_essai">En essai</option>
            <option value="suspendu">Suspendu</option>
          </select>

          <select value={filtreVerif} onChange={(e) => setFiltreVerif(e.target.value)} aria-label="Filtrer par vérification" className={CLASSE_FILTRE}>
            <option value="">Vérifiées ou non</option>
            <option value="verifiee">Vérifiées</option>
            <option value="non_verifiee">Non vérifiées</option>
          </select>

          {filtreActif && (
            <button
              onClick={reinitialiser}
              className="h-10 rounded-lg px-3 text-[13px] font-medium text-[#12181B]/60 hover:bg-[#12181B]/5 hover:text-[#12181B]"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {chargement ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : boutiquesFiltrees.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#12181B]/15 bg-white py-16 text-center">
          <Store size={28} className="mb-3 text-[#12181B]/25" />
          <p className="text-[14px] text-[#12181B]/60">
            {filtreActif ? "Aucune boutique ne correspond à votre recherche." : "Aucune boutique."}
          </p>
          {filtreActif && (
            <button
              onClick={reinitialiser}
              className="mt-4 h-9 rounded-full border border-[#12181B]/15 px-4 text-[13px] font-medium text-[#12181B] hover:bg-[#12181B]/5"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#12181B]/10 bg-white">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-[#12181B]/10">
                {["Boutique", "Commerçant", "Produits", "Commandes", "Statut"].map((t) => (
                  <th key={t} className="py-3 pl-4 text-left first:pl-4">
                    <span className="text-[12px] font-medium uppercase tracking-wide text-[#12181B]/50">{t}</span>
                  </th>
                ))}
                <th className="py-3 pr-4 text-right">
                  <span className="text-[12px] font-medium uppercase tracking-wide text-[#12181B]/50">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {boutiquesFiltrees.map((boutique) => {
                const suspendue = boutique.statut === "suspendu";
                return (
                  <tr key={boutique.id} className="border-b border-[#12181B]/[0.06] last:border-0 hover:bg-[#12181B]/[0.015]">
                    <td className="py-3 pl-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-[#12181B]">{boutique.nom_boutique}</span>
                        {boutique.est_verifie && <CheckCircle2 size={14} className="text-[#0E7C66]" />}
                      </div>
                    </td>
                    <td className="py-3 pl-4 text-[13px] text-[#12181B]/70">{boutique.commercant_email}</td>
                    <td className="py-3 pl-4 text-[13px] text-[#12181B]/70">{boutique.nombre_produits}</td>
                    <td className="py-3 pl-4 text-[13px] text-[#12181B]/70">{boutique.nombre_commandes}</td>
                    <td className="py-3 pl-4">
                      <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${COULEUR_STATUT[boutique.statut]}`}>
                        {LABEL_STATUT[boutique.statut] || boutique.statut}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Vérification : vert quand la boutique est vérifiée */}
                        <button
                          onClick={() => toggleVerification(boutique)}
                          aria-pressed={boutique.est_verifie}
                          title={boutique.est_verifie ? "Retirer la vérification" : "Vérifier cette boutique"}
                          className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-colors ${
                            boutique.est_verifie
                              ? "border-[#0E7C66] bg-[#0E7C66] text-white hover:bg-[#0E7C66]/90"
                              : "border-[#12181B]/15 bg-white text-[#12181B]/60 hover:bg-[#12181B]/5 hover:text-[#12181B]"
                          }`}
                        >
                          <CheckCircle2 size={14} />
                          {boutique.est_verifie ? "Vérifiée" : "Vérifier"}
                        </button>

                        {/* Suspension : rouge quand la boutique est suspendue */}
                        <button
                          onClick={() => toggleSuspension(boutique)}
                          aria-pressed={suspendue}
                          title={suspendue ? "Réactiver cette boutique" : "Suspendre cette boutique"}
                          className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-colors ${
                            suspendue
                              ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
                              : "border-[#12181B]/15 bg-white text-[#12181B]/60 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          }`}
                        >
                          {suspendue ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                          {suspendue ? "Suspendue" : "Suspendre"}
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
    </div>
  );
}