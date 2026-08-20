import { useEffect, useMemo, useState } from "react";
import { Users, Shield, Store, ShoppingBag, Trash2 } from "lucide-react";
import { comptesApi } from "../../api/comptes";
import Skeleton from "../../components/ui/Skeleton";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import { useAuth } from "../../context/AuthContext";

const ROLES = [
  ["client", "Client", ShoppingBag],
  ["commercant", "Commerçant", Store],
  ["superadmin", "Super administrateur", Shield],
];

const COULEUR_ROLE = {
  client: "bg-[#12181B]/[0.06] text-[#12181B]/60",
  commercant: "bg-blue-50 text-blue-600",
  superadmin: "bg-[#0E7C66]/10 text-[#0E7C66]",
};

export default function Utilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtreRole, setFiltreRole] = useState("");

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

  const utilisateursFiltres = useMemo(
    () => (filtreRole ? utilisateurs.filter((u) => u.role === filtreRole) : utilisateurs),
    [utilisateurs, filtreRole]
  );

  const changerRole = async (utilisateurCible, nouveauRole) => {
    if (utilisateurCible.email === moi?.email) {
      notifier("Tu ne peux pas modifier ton propre rôle.", "erreur");
      return;
    }
    try {
      await comptesApi.modifierUtilisateurAdmin(utilisateurCible.id, { role: nouveauRole });
      notifier("Rôle mis à jour.");
      charger();
    } catch {
      notifier("Impossible de modifier le rôle.", "erreur");
    }
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-[24px] font-medium text-[#12181B]">Utilisateurs</h1>
        <select
          value={filtreRole}
          onChange={(e) => setFiltreRole(e.target.value)}
          className="rounded-lg border border-[#12181B]/10 px-3 py-2 text-[13px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
        >
          <option value="">Tous les rôles</option>
          {ROLES.map(([valeur, label]) => (
            <option key={valeur} value={valeur}>{label}</option>
          ))}
        </select>
      </div>

      {chargement ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : utilisateursFiltres.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center bg-white border border-dashed border-[#12181B]/15 rounded-xl py-16">
          <Users size={28} className="text-[#12181B]/25 mb-3" />
          <p className="text-[14px] text-[#12181B]/60">Aucun utilisateur.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#12181B]/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#12181B]/10">
                <th className="text-left py-3 pl-4"><span className="text-[12px] font-medium text-[#12181B]/50 uppercase tracking-wide">Utilisateur</span></th>
                <th className="text-left py-3"><span className="text-[12px] font-medium text-[#12181B]/50 uppercase tracking-wide">Rôle</span></th>
                <th className="text-left py-3"><span className="text-[12px] font-medium text-[#12181B]/50 uppercase tracking-wide">Statut</span></th>
                <th className="text-left py-3 pr-4"><span className="text-[12px] font-medium text-[#12181B]/50 uppercase tracking-wide">Inscrit le</span></th>
              </tr>
            </thead>
            <tbody>
              {utilisateursFiltres.map((u) => (
                <tr key={u.id} className="border-b border-[#12181B]/[0.06] last:border-0 hover:bg-[#12181B]/[0.015]">
                  <td className="py-3 pl-4">
                    <p className="text-[13px] font-medium text-[#12181B]">{u.username}</p>
                    <p className="text-[12px] text-[#12181B]/50">{u.email}</p>
                  </td>
                  <td className="py-3">
                    <select
                      value={u.role}
                      onChange={(e) => changerRole(u, e.target.value)}
                      disabled={u.email === moi?.email}
                      className={`text-[12px] font-medium rounded-full px-2.5 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-[#12181B]/20 disabled:opacity-50 disabled:cursor-not-allowed ${COULEUR_ROLE[u.role]}`}
                    >
                      {ROLES.map(([valeur, label]) => (
                        <option key={valeur} value={valeur}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => toggleActivation(u)}
                      disabled={u.email === moi?.email}
                      className={`text-[12px] font-medium rounded-full px-2.5 py-1 disabled:opacity-50 disabled:cursor-not-allowed ${
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}