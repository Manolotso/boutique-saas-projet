import { useEffect, useMemo, useState } from "react";
import { Users, Shield, Store, ShoppingBag, Search, X } from "lucide-react";
import { comptesApi } from "../../api/comptes";
import Skeleton from "../../components/ui/Skeleton";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import { useAuth } from "../../context/AuthContext";

const ROLES = {
  client: { label: "Client", icone: ShoppingBag, classe: "bg-[#12181B]/[0.06] text-[#12181B]/60" },
  commercant: { label: "Commerçant", icone: Store, classe: "bg-blue-50 text-blue-600" },
  superadmin: { label: "Super administrateur", icone: Shield, classe: "bg-[#0E7C66]/10 text-[#0E7C66]" },
};

// Minuscules et sans accents : "Rabé" trouve "rabe"
const normaliser = (texte) =>
  (texte || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function Utilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtreRole, setFiltreRole] = useState("");
  const [recherche, setRecherche] = useState("");

  const { notifier } = useToast();
  const confirmer = useConfirm();
  const { utilisateur: moi } = useAuth();

  const charger = () => {
    setChargement(true);
    comptesApi
      .listerUtilisateursAdmin()
      .then((res) => setUtilisateurs(res.data.results || res.data))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    charger();
  }, []);

  const utilisateursFiltres = useMemo(() => {
    const terme = normaliser(recherche.trim());
    return utilisateurs.filter((u) => {
      if (filtreRole && u.role !== filtreRole) return false;
      if (!terme) return true;
      return normaliser(`${u.username} ${u.email}`).includes(terme);
    });
  }, [utilisateurs, filtreRole, recherche]);

  const filtreActif = recherche.trim() !== "" || filtreRole !== "";

  const reinitialiser = () => {
    setRecherche("");
    setFiltreRole("");
  };

  const toggleActivation = async (utilisateurCible) => {
    if (utilisateurCible.email === moi?.email) {
      notifier("Tu ne peux pas désactiver ton propre compte.", "erreur");
      return;
    }
    const desactiver = utilisateurCible.is_active;
    const ok = await confirmer({
      titre: desactiver ? "Désactiver ce compte ?" : "Réactiver ce compte ?",
      message: `${utilisateurCible.email} ne pourra ${desactiver ? "plus" : "de nouveau"} se connecter.`,
      texteConfirmer: desactiver ? "Désactiver" : "Réactiver",
      danger: desactiver,
    });
    if (!ok) return;

    try {
      await comptesApi.modifierUtilisateurAdmin(utilisateurCible.id, { is_active: !desactiver });
      notifier(desactiver ? "Compte désactivé." : "Compte réactivé.", desactiver ? "info" : "succes");
      charger();
    } catch {
      notifier("Impossible de modifier le compte.", "erreur");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[24px] font-medium text-[#12181B]">Utilisateurs</h1>
        <p className="mt-1 text-[13px] text-[#12181B]/50">
          {utilisateursFiltres.length} compte{utilisateursFiltres.length > 1 ? "s" : ""}
          {filtreActif && ` sur ${utilisateurs.length}`}
        </p>
      </div>

      {/* Recherche et filtre */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#12181B]/35" />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher par nom ou email"
            aria-label="Rechercher un utilisateur"
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

        <select
          value={filtreRole}
          onChange={(e) => setFiltreRole(e.target.value)}
          aria-label="Filtrer par rôle"
          className="h-10 rounded-lg border border-[#12181B]/10 bg-white px-3 text-[13px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
        >
          <option value="">Tous les rôles</option>
          {Object.entries(ROLES).map(([valeur, { label }]) => (
            <option key={valeur} value={valeur}>{label}</option>
          ))}
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

      {chargement ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : utilisateursFiltres.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#12181B]/15 bg-white py-16 text-center">
          <Users size={28} className="mb-3 text-[#12181B]/25" />
          <p className="text-[14px] text-[#12181B]/60">
            {filtreActif ? "Aucun utilisateur ne correspond à votre recherche." : "Aucun utilisateur."}
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
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-[#12181B]/10">
                <th className="py-3 pl-4 text-left"><span className="text-[12px] font-medium uppercase tracking-wide text-[#12181B]/50">Utilisateur</span></th>
                <th className="py-3 text-left"><span className="text-[12px] font-medium uppercase tracking-wide text-[#12181B]/50">Rôle</span></th>
                <th className="py-3 text-left"><span className="text-[12px] font-medium uppercase tracking-wide text-[#12181B]/50">Statut</span></th>
                <th className="py-3 pr-4 text-left"><span className="text-[12px] font-medium uppercase tracking-wide text-[#12181B]/50">Inscrit le</span></th>
              </tr>
            </thead>
            <tbody>
              {utilisateursFiltres.map((u) => {
                const role = ROLES[u.role] || { label: u.role, icone: Users, classe: "bg-[#12181B]/[0.06] text-[#12181B]/60" };
                const IconeRole = role.icone;
                const estMoi = u.email === moi?.email;
                return (
                  <tr key={u.id} className="border-b border-[#12181B]/[0.06] last:border-0 hover:bg-[#12181B]/[0.015]">
                    <td className="py-3 pl-4">
                      <p className="text-[13px] font-medium text-[#12181B]">
                        {u.username} {estMoi && <span className="font-normal text-[#12181B]/40">(vous)</span>}
                      </p>
                      <p className="text-[12px] text-[#12181B]/50">{u.email}</p>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${role.classe}`}>
                        <IconeRole size={12} />
                        {role.label}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => toggleActivation(u)}
                        disabled={estMoi}
                        className={`rounded-full px-2.5 py-1 text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                          u.is_active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                        }`}
                      >
                        {u.is_active ? "Actif" : "Désactivé"}
                      </button>
                    </td>
                    <td className="py-3 pr-4 text-[13px] text-[#12181B]/50">
                      {new Date(u.date_joined).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
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