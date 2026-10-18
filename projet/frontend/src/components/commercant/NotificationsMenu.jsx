import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ShoppingBag } from "lucide-react";
import { commandesApi } from "../../api/commandes";
import { useToast } from "../../context/ToastContext";

const INTERVALLE_MS = 30000; // le serveur est interrogé toutes les 30 secondes

const LABEL_STATUT = {
  en_attente: "En attente",
  confirmee: "Confirmée",
  payee: "Payée",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
};

function depuis(dateIso) {
  const minutes = Math.floor((Date.now() - new Date(dateIso).getTime()) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  return new Date(dateIso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function NotificationsMenu() {
  const [ouvert, setOuvert] = useState(false);
  const [donnees, setDonnees] = useState({ non_lues: 0, commandes: [] });
  const ref = useRef(null);
  const nonLuesPrecedent = useRef(null); // null tant que le premier chargement n'a pas eu lieu
  const navigate = useNavigate();
  const { notifier } = useToast();

  // Actualisation régulière, en pause quand l'onglet est caché.
  useEffect(() => {
    let annule = false;

    const actualiser = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const { data } = await commandesApi.listerNotifications();
        if (annule) return;
        if (nonLuesPrecedent.current !== null && data.non_lues > nonLuesPrecedent.current) {
          const nouvelles = data.non_lues - nonLuesPrecedent.current;
          notifier(nouvelles > 1 ? `${nouvelles} nouvelles commandes reçues.` : "Nouvelle commande reçue !");
        }
        nonLuesPrecedent.current = data.non_lues;
        setDonnees(data);
      } catch {
        // Erreur réseau passagère : on réessaiera au prochain tour.
      }
    };

    const auRetourSurLOnglet = () => {
      if (document.visibilityState === "visible") actualiser();
    };

    actualiser();
    const intervalle = setInterval(actualiser, INTERVALLE_MS);
    document.addEventListener("visibilitychange", auRetourSurLOnglet);

    return () => {
      annule = true;
      clearInterval(intervalle);
      document.removeEventListener("visibilitychange", auRetourSurLOnglet);
    };
  }, []);

  // Fermeture au clic à l'extérieur, comme le menu profil.
  useEffect(() => {
    const handleClicExterieur = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOuvert(false);
    };
    document.addEventListener("mousedown", handleClicExterieur);
    return () => document.removeEventListener("mousedown", handleClicExterieur);
  }, []);

  const toutMarquerLu = async () => {
    try {
      const { data } = await commandesApi.marquerNotificationsLues(donnees.commandes[0]?.date_commande);
      nonLuesPrecedent.current = data.non_lues;
      setDonnees((d) => ({
        non_lues: data.non_lues,
        commandes: d.commandes.map((c) => ({ ...c, nouvelle: false })),
      }));
    } catch {
      notifier("Impossible de marquer les notifications comme lues.", "erreur");
    }
  };

  const ouvrirCommande = (commande) => {
    setOuvert(false);
    navigate(`/commercant/commandes?commande=${encodeURIComponent(commande.numero_commande)}`);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOuvert((o) => !o)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#12181B]/60 hover:bg-[#12181B]/[0.05] hover:text-[#12181B] transition-colors"
      >
        <Bell size={18} />
        {donnees.non_lues > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--boutique-accent,#0E7C66)] px-1 text-[10.5px] font-medium text-white">
            {donnees.non_lues > 9 ? "9+" : donnees.non_lues}
          </span>
        )}
      </button>

      {ouvert && (
        <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl bg-white border border-[#12181B]/10 shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#12181B]/10">
            <p className="text-[13px] font-medium text-[#12181B]">Notifications</p>
            {donnees.non_lues > 0 && (
              <button
                onClick={toutMarquerLu}
                className="text-[12px] font-medium text-[var(--boutique-accent,#0E7C66)] hover:underline"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {donnees.commandes.length === 0 ? (
              <p className="px-3.5 py-6 text-center text-[13px] text-[#12181B]/45">Aucune commande pour l'instant.</p>
            ) : (
              donnees.commandes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => ouvrirCommande(c)}
                  className={`w-full text-left flex gap-3 px-3.5 py-2.5 hover:bg-[#12181B]/[0.04] ${
                    c.nouvelle ? "bg-[var(--boutique-accent,#0E7C66)]/[0.06]" : ""
                  }`}
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#12181B]/[0.06] text-[#12181B]/60">
                    <ShoppingBag size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-[#12181B] truncate">{c.numero_commande}</span>
                      <span className="text-[11.5px] text-[#12181B]/40 shrink-0">{depuis(c.date_commande)}</span>
                    </span>
                    <span className="block text-[12.5px] text-[#12181B]/60 truncate">
                      {c.nom_destinataire || "Client"} · {Number(c.montant_total).toLocaleString("fr-MG")} Ar
                    </span>
                    <span className="block text-[11.5px] text-[#12181B]/40">{LABEL_STATUT[c.statut] || c.statut}</span>
                  </span>
                  {c.nouvelle && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--boutique-accent,#0E7C66)]" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}