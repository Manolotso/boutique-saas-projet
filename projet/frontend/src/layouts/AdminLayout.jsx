import { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Store, Users, LogOut, PanelLeftClose, PanelLeftOpen, ShieldCheck, Menu, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const MENU = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, fin: true },
  { to: "/admin/boutiques", label: "Boutiques", icon: Store },
  { to: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
];

function Navigation({ reduit, onNavigate }) {
  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {MENU.map(({ to, label, icon: Icon, fin }) => (
        <NavLink
          key={to}
          to={to}
          end={fin}
          title={reduit ? label : undefined}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors ${
              reduit ? "justify-center" : ""
            } ${isActive ? "bg-[#12181B] text-[#F6F7F2]" : "text-[#12181B]/70 hover:bg-[#12181B]/[0.05]"}`
          }
        >
          <Icon size={18} className="shrink-0" />
          {!reduit && <span className="truncate">{label}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

function Marque({ reduit }) {
  return (
    <div className="flex items-center gap-2.5 overflow-hidden">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#12181B] text-[#F6F7F2]">
        <ShieldCheck size={17} />
      </span>
      {!reduit && (
        <div className="min-w-0 leading-tight">
          <p className="truncate font-display text-[15px] font-medium text-[#12181B]">Varotra</p>
          <p className="text-[11px] text-[#12181B]/45">Administration</p>
        </div>
      )}
    </div>
  );
}

export default function AdminLayout() {
  const [reduit, setReduit] = useState(() => localStorage.getItem("admin_sidebar_reduite") === "true");
  const [tiroir, setTiroir] = useState(false);
  const { utilisateur, seDeconnecter } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => setTiroir(false), [location.pathname]);

  const toggleReduit = () => {
    setReduit((r) => {
      localStorage.setItem("admin_sidebar_reduite", String(!r));
      return !r;
    });
  };

  const deconnexion = () => {
    seDeconnecter();
    navigate("/");
  };

  const nom = utilisateur?.username || "Admin";

  return (
    <div className="flex min-h-screen bg-[#FBFAF6]">
      {/* Barre latérale : ordinateur */}
      <aside
        className={`${reduit ? "w-[76px]" : "w-64"} sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[#12181B]/10 bg-white transition-all duration-300 lg:flex`}
      >
        <div className={`flex h-16 items-center border-b border-[#12181B]/10 ${reduit ? "justify-center px-2" : "justify-between px-4"}`}>
          <Marque reduit={reduit} />
          {!reduit && (
            <button
              onClick={toggleReduit}
              aria-label="Réduire le menu"
              className="shrink-0 rounded-lg p-1.5 text-[#12181B]/50 transition-colors hover:bg-[#12181B]/[0.05] hover:text-[#12181B]"
            >
              <PanelLeftClose size={17} />
            </button>
          )}
        </div>
        {reduit && (
          <button
            onClick={toggleReduit}
            aria-label="Étendre le menu"
            className="flex items-center justify-center border-b border-[#12181B]/10 py-2.5 text-[#12181B]/50 transition-colors hover:bg-[#12181B]/[0.05] hover:text-[#12181B]"
          >
            <PanelLeftOpen size={17} />
          </button>
        )}
        <Navigation reduit={reduit} />
      </aside>

      {/* Tiroir : mobile et tablette */}
      {tiroir && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[#12181B]/40" onClick={() => setTiroir(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[85%] flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-[#12181B]/10 px-4">
              <Marque />
              <button
                onClick={() => setTiroir(false)}
                aria-label="Fermer le menu"
                className="rounded-lg p-1.5 text-[#12181B]/50 hover:bg-[#12181B]/[0.05]"
              >
                <X size={18} />
              </button>
            </div>
            <Navigation onNavigate={() => setTiroir(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#12181B]/10 bg-white/95 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setTiroir(true)}
            aria-label="Ouvrir le menu"
            className="rounded-lg p-2 text-[#12181B]/70 hover:bg-[#12181B]/[0.05] lg:hidden"
          >
            <Menu size={20} />
          </button>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#12181B] text-[13px] font-medium text-[#F6F7F2]">
                {nom.charAt(0).toUpperCase()}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="text-[13px] font-medium text-[#12181B]">{nom}</p>
                <p className="text-[11px] text-[#12181B]/45">Super administrateur</p>
              </div>
            </div>
            <button
              onClick={deconnexion}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#12181B]/10 px-3.5 text-[13px] font-medium text-[#12181B]/70 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}