import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Store, Users, LogOut, PanelLeftClose, PanelLeftOpen, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const MENU = [
  { to: "/admin", label: "Boutiques", icon: Store, fin: true },
  { to: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
];

export default function AdminLayout() {
  const [reduit, setReduit] = useState(() => localStorage.getItem("admin_sidebar_reduite") === "true");
  const { utilisateur, seDeconnecter } = useAuth();
  const navigate = useNavigate();

  const toggleReduit = () => {
    setReduit((r) => {
      localStorage.setItem("admin_sidebar_reduite", String(!r));
      return !r;
    });
  };

  const handleDeconnexion = () => {
    seDeconnecter();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#FBFAF6] flex">
      <aside className={`${reduit ? "w-[76px]" : "w-64"} shrink-0 border-r border-[#12181B]/10 bg-white flex flex-col transition-all duration-300`}>
        <div className={`h-16 flex items-center border-b border-[#12181B]/10 ${reduit ? "justify-center px-2" : "justify-between px-4"}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#12181B] text-[#F6F7F2] shrink-0">
              <ShieldCheck size={16} />
            </span>
            {!reduit && <span className="text-[14px] font-medium text-[#12181B] truncate">Administration</span>}
          </div>
          {!reduit && (
            <button onClick={toggleReduit} aria-label="Réduire le menu" className="p-1.5 rounded-lg text-[#12181B]/50 hover:text-[#12181B] hover:bg-[#12181B]/[0.05] transition-colors shrink-0">
              <PanelLeftClose size={17} />
            </button>
          )}
        </div>

        {reduit && (
          <button onClick={toggleReduit} aria-label="Étendre le menu" className="flex items-center justify-center py-2.5 text-[#12181B]/50 hover:text-[#12181B] hover:bg-[#12181B]/[0.05] transition-colors border-b border-[#12181B]/10">
            <PanelLeftOpen size={17} />
          </button>
        )}

        <nav className="flex-1 py-4 px-3 space-y-1">
          {MENU.map(({ to, label, icon: Icon, fin }) => (
            <NavLink
              key={to}
              to={to}
              end={fin}
              title={reduit ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors ${
                  isActive ? "bg-[#12181B] text-[#F6F7F2]" : "text-[#12181B]/70 hover:bg-[#12181B]/[0.05]"
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              {!reduit && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-[#12181B]/10 bg-white flex items-center justify-end px-6 gap-4">
          <span className="text-[13px] text-[#12181B]/60">{utilisateur?.username}</span>
          <button
            onClick={handleDeconnexion}
            className="flex items-center gap-1.5 text-[13px] font-medium text-[#12181B]/70 hover:text-red-600 transition-colors"
          >
            <LogOut size={15} /> Déconnexion
          </button>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}