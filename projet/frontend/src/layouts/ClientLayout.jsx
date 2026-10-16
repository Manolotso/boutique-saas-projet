import { NavLink, Outlet } from "react-router-dom";
import { User, ShoppingBag } from "lucide-react";

const MENU = [
  { to: "/mon-compte", label: "Profil", icon: User, fin: true },
  { to: "/mon-compte/commandes", label: "Mes commandes", icon: ShoppingBag },
];

export default function ClientLayout() {
  return (
    <div className="min-h-screen bg-[#FBFAF6]">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-display text-[24px] font-medium text-[#12181B] mb-6">Mon compte</h1>

        <div className="flex items-center gap-1 border-b border-[#12181B]/10 mb-6">
          {MENU.map(({ to, label, icon: Icon, fin }) => (
            <NavLink
              key={to}
              to={to}
              end={fin}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-4 py-2.5 text-[14px] font-medium border-b-2 -mb-px transition-colors ${
                  isActive ? "border-[#12181B] text-[#12181B]" : "border-transparent text-[#12181B]/50 hover:text-[#12181B]/80"
                }`
              }
            >
              <Icon size={15} /> {label}
            </NavLink>
          ))}
        </div>

        <Outlet />
      </div>
    </div>
  );
}