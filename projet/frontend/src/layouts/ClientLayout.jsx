import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { User, ShoppingBag, Compass, LogOut, ArrowLeft, LayoutDashboard } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const CONTENEUR = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";

const MENU = [
  { to: "/mon-compte", label: "Mon profil", icon: User, fin: true },
  { to: "/mon-compte/commandes", label: "Mes commandes", icon: ShoppingBag },
];

// Destination de retour selon le rôle : seul un client a accès à /decouvrir
const RETOUR = {
  client: { to: "/decouvrir", label: "Découvrir", icon: Compass },
  commercant: { to: "/commercant", label: "Mon dashboard", icon: LayoutDashboard },
  superadmin: { to: "/admin", label: "Administration", icon: LayoutDashboard },
};

const classeLien = (actif) =>
  `flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-[14px] font-medium transition-colors ${
    actif ? "bg-[#12181B] text-[#F6F7F2]" : "text-[#12181B]/65 hover:bg-[#12181B]/5 hover:text-[#12181B]"
  }`;

export default function ClientLayout() {
  const { utilisateur, seDeconnecter } = useAuth();
  const navigate = useNavigate();

  const retour = RETOUR[utilisateur?.role] || RETOUR.client;
  const IconeRetour = retour.icon;
  const nom = utilisateur?.username || "Mon compte";
  const initiale = nom.charAt(0).toUpperCase();

  const deconnexion = () => {
    seDeconnecter();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#FBFAF6]">
      {/* En-tête */}
      <header className="sticky top-0 z-40 border-b border-[#12181B]/10 bg-white/95 backdrop-blur-md">
        <div className={`${CONTENEUR} flex h-16 items-center justify-between gap-3`}>
          <Link to={retour.to} className="font-display text-[19px] font-medium text-[#12181B]">
            Varotra
          </Link>
          <Link
            to={retour.to}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[#12181B]/10 bg-white px-4 text-[13px] font-medium text-[#12181B]/80 transition-colors hover:bg-[#12181B]/5 hover:text-[#12181B]"
          >
            <ArrowLeft size={15} />
            <IconeRetour size={16} className="hidden sm:block" />
            <span>{retour.label}</span>
          </Link>
        </div>
      </header>

      <div className={`${CONTENEUR} py-6 sm:py-10`}>
        <div className="grid gap-6 md:grid-cols-[250px_minmax(0,1fr)] md:gap-8">
          {/* Colonne de gauche */}
          <aside className="md:sticky md:top-24 md:self-start">
            {/* Carte d'identité */}
            <div className="flex items-center gap-3 rounded-2xl border border-[#12181B]/10 bg-white p-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#12181B] font-display text-[18px] font-medium text-[#F6F7F2]">
                {initiale}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium text-[#12181B]">{nom}</p>
                {utilisateur?.email && (
                  <p className="truncate text-[12px] text-[#12181B]/50">{utilisateur.email}</p>
                )}
              </div>
            </div>

            {/* Navigation : onglets défilants sur mobile, menu vertical sur ordinateur */}
            <nav
              aria-label="Menu du compte"
              className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] md:flex-col md:gap-1 md:overflow-visible md:rounded-2xl md:border md:border-[#12181B]/10 md:bg-white md:p-2 [&::-webkit-scrollbar]:hidden"
            >
              {MENU.map(({ to, label, icon: Icon, fin }) => (
                <NavLink key={to} to={to} end={fin} className={({ isActive }) => classeLien(isActive)}>
                  <Icon size={16} /> {label}
                </NavLink>
              ))}

              <button
                onClick={deconnexion}
                className="hidden items-center gap-2.5 rounded-xl px-4 py-2.5 text-left text-[14px] font-medium text-red-600 transition-colors hover:bg-red-50 md:mt-1 md:flex md:border-t md:border-[#12181B]/10 md:rounded-t-none"
              >
                <LogOut size={16} /> Se déconnecter
              </button>
            </nav>
          </aside>

          {/* Contenu de la page */}
          <main className="min-w-0">
            <Outlet />

            {/* Déconnexion sur mobile */}
            <button
              onClick={deconnexion}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-full border border-red-200 py-3 text-[14px] font-medium text-red-600 transition-colors hover:bg-red-50 md:hidden"
            >
              <LogOut size={16} /> Se déconnecter
            </button>
          </main>
        </div>
      </div>
    </div>
  );
}