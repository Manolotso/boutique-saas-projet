  import { useState } from "react";
  import { Outlet, Navigate, NavLink } from "react-router-dom";
  import {
    LayoutDashboard, Package, FolderTree, ShoppingBag, Settings, CreditCard,
    History, PanelLeftClose, PanelLeftOpen, Store, Menu, X, Search,
  } from "lucide-react";
  import { useBoutique } from "../context/BoutiqueContext";
  import ProfileMenu from "../components/commercant/ProfileMenu";
  import CommandPalette from "../components/ui/CommandPalette";

  const MENU = [
    { to: "/commercant", label: "Tableau de bord", icon: LayoutDashboard, fin: true },
    { to: "/commercant/produits", label: "Produits", icon: Package },
    { to: "/commercant/categories", label: "Catégories", icon: FolderTree },
    { to: "/commercant/commandes", label: "Commandes", icon: ShoppingBag },
    { to: "/commercant/historique", label: "Historique", icon: History },
    { to: "/commercant/parametres", label: "Paramètres", icon: Settings },
    { to: "/commercant/abonnement", label: "Abonnement", icon: CreditCard },
  ];

  function ContenuSidebar({ reduit, toggleReduit, boutique, surMobile, fermerMobile }) {
    return (
      <>
        <div className={`h-16 flex items-center border-b border-[#12181B]/10 ${reduit && !surMobile ? "justify-center px-2" : "justify-between px-4"}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            {boutique.logo ? (
              <img src={boutique.logo} alt={boutique.nom_boutique} className="h-8 w-8 rounded-lg object-cover shrink-0" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--boutique-primary,#12181B)] text-[#F6F7F2] shrink-0">
                <Store size={16} />
              </span>
            )}
            {(!reduit || surMobile) && <span className="text-[14px] font-medium text-[#12181B] truncate">{boutique.nom_boutique}</span>}
          </div>

          {surMobile ? (
            <button onClick={fermerMobile} className="p-1.5 text-[#12181B]/50 hover:text-[#12181B]">
              <X size={18} />
            </button>
          ) : (
            !reduit && (
              <button onClick={toggleReduit} aria-label="Réduire le menu" className="p-1.5 rounded-lg text-[#12181B]/50 hover:text-[#12181B] hover:bg-[#12181B]/[0.05] transition-colors shrink-0">
                <PanelLeftClose size={17} />
              </button>
            )
          )}
        </div>

        {!surMobile && reduit && (
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
              onClick={surMobile ? fermerMobile : undefined}
              title={reduit && !surMobile ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors ${
                  isActive ? "bg-[var(--boutique-primary,#12181B)] text-[#F6F7F2]" : "text-[#12181B]/70 hover:bg-[#12181B]/[0.05]"
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              {(!reduit || surMobile) && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>
      </>
    );
  }

  export default function CommercantShell() {
    const [reduit, setReduit] = useState(() => localStorage.getItem("sidebar_reduite") === "true");
    const [mobileOuvert, setMobileOuvert] = useState(false);
    const { boutique, chargement } = useBoutique();

    const toggleReduit = () => {
      setReduit((r) => {
        localStorage.setItem("sidebar_reduite", String(!r));
        return !r;
      });
    };

    if (chargement) {
      return (
        <div className="min-h-screen bg-[#FBFAF6] flex items-center justify-center">
          <p className="text-[#12181B]/60 text-[14px]">Chargement...</p>
        </div>
      );
    }

    if (!boutique) {
      return (
        <div className="min-h-screen bg-[#FBFAF6] flex items-center justify-center">
          <p className="text-[#12181B]/60 text-[14px]">Impossible de charger ta boutique.</p>
        </div>
      );
    }

    if (boutique.etape_onboarding !== "termine") {
      return <Navigate to="/commercant/onboarding" replace />;
    }

    return (
      <div
        className="min-h-screen bg-[#FBFAF6] flex"
        style={{ "--boutique-primary": boutique.couleur_primaire, "--boutique-accent": boutique.couleur_secondaire }}
      >
        {/* Sidebar desktop */}
        <aside className={`${reduit ? "w-[76px]" : "w-64"} hidden md:flex shrink-0 border-r border-[#12181B]/10 bg-white flex-col transition-all duration-300`}>
          <ContenuSidebar reduit={reduit} toggleReduit={toggleReduit} boutique={boutique} surMobile={false} />
        </aside>

        {/* Sidebar mobile (drawer) */}
        {mobileOuvert && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOuvert(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-xl">
              <ContenuSidebar reduit={false} boutique={boutique} surMobile fermerMobile={() => setMobileOuvert(false)} />
            </aside>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-[#12181B]/10 bg-white flex items-center justify-between px-4 md:px-6 gap-4">
            <button onClick={() => setMobileOuvert(true)} className="md:hidden p-1.5 text-[#12181B]/70">
              <Menu size={20} />
            </button>

            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
              className="hidden md:flex items-center gap-2 text-[13px] text-[#12181B]/40 border border-[#12181B]/10 rounded-lg px-3 py-1.5 hover:border-[#12181B]/20 transition-colors"
            >
              <Search size={14} /> Rechercher...
              <span className="text-[11px] border border-[#12181B]/15 rounded px-1.5 py-0.5 ml-2">Ctrl K</span>
            </button>

            <div className="flex-1 md:hidden" />

            <ProfileMenu boutique={boutique} />
          </header>

          <main className="flex-1 p-5 md:p-8 overflow-y-auto">
            <Outlet />
          </main>
        </div>

        <CommandPalette />
      </div>
    );
  }