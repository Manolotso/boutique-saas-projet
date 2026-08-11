import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, FolderTree, ShoppingBag, Settings, CreditCard, Plus, History, Search } from "lucide-react";
import Modal from "./Modal";

const ACTIONS = [
  { label: "Tableau de bord", to: "/commercant", icon: LayoutDashboard },
  { label: "Produits", to: "/commercant/produits", icon: Package },
  { label: "Catégories", to: "/commercant/categories", icon: FolderTree },
  { label: "Commandes", to: "/commercant/commandes", icon: ShoppingBag },
  { label: "Historique", to: "/commercant/historique", icon: History },
  { label: "Paramètres", to: "/commercant/parametres", icon: Settings },
  { label: "Abonnement", to: "/commercant/abonnement", icon: CreditCard },
];

export default function CommandPalette() {
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOuvert((o) => !o);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const resultats = useMemo(
    () => ACTIONS.filter((a) => a.label.toLowerCase().includes(recherche.toLowerCase())),
    [recherche]
  );

  const aller = (to) => {
    navigate(to);
    setOuvert(false);
    setRecherche("");
  };

  return (
    <Modal isOpen={ouvert} onClose={() => setOuvert(false)} maxWidth="max-w-lg">
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 border-b border-[#12181B]/10 pb-3">
          <Search size={16} className="text-[#12181B]/40 shrink-0" />
          <input
            autoFocus
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une action... (Ctrl+K)"
            className="w-full text-[14px] text-[#12181B] placeholder:text-[#12181B]/30 focus:outline-none"
          />
        </div>
        <div className="max-h-72 overflow-y-auto">
          {resultats.length === 0 && (
            <p className="text-[13px] text-[#12181B]/40 px-1 py-4 text-center">Aucun résultat.</p>
          )}
          {resultats.map(({ label, to, icon: Icon }) => (
            <button
              key={to}
              onClick={() => aller(to)}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-[#12181B]/80 hover:bg-[#12181B]/[0.05] transition-colors text-left"
            >
              <Icon size={16} className="text-[#12181B]/50" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}