import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Settings, HelpCircle, LogOut, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function ProfileMenu({ boutique }) {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef(null);
  const { seDeconnecter, utilisateur } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClicExterieur = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOuvert(false);
    };
    document.addEventListener("mousedown", handleClicExterieur);
    return () => document.removeEventListener("mousedown", handleClicExterieur);
  }, []);

  const handleDeconnexion = () => {
    seDeconnecter();
    navigate("/");
  };

  const initiale = (utilisateur?.username || boutique.nom_boutique || "?").charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOuvert((o) => !o)}
        className="flex items-center gap-2 rounded-full pl-1 pr-2.5 py-1 hover:bg-[#12181B]/[0.05] transition-colors"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--boutique-primary,#12181B)] text-[#F6F7F2] text-[12px] font-medium">
          {initiale}
        </span>
        <span className="text-[13px] text-[#12181B]/80">{utilisateur?.username || boutique.nom_boutique}</span>
        <ChevronDown size={14} className={`text-[#12181B]/40 transition-transform ${ouvert ? "rotate-180" : ""}`} />
      </button>

      {ouvert && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white border border-[#12181B]/10 shadow-lg py-1.5 z-50">
          <div className="px-3.5 py-2 border-b border-[#12181B]/10 mb-1">
            <p className="text-[13px] font-medium text-[#12181B] truncate">{utilisateur?.username}</p>
            <p className="text-[12px] text-[#12181B]/50 truncate">{utilisateur?.email}</p>
          </div>
          <button
            onClick={() => { setOuvert(false); navigate("/commercant/parametres"); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#12181B]/80 hover:bg-[#12181B]/[0.05]"
          >
            <Settings size={15} /> Paramètres
          </button>
          <button className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#12181B]/80 hover:bg-[#12181B]/[0.05]">
            <HelpCircle size={15} /> Aide
          </button>
          <button
            onClick={handleDeconnexion}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-600 hover:bg-red-50"
          >
            <LogOut size={15} /> Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}