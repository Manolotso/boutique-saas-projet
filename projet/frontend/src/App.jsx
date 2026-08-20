import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import RouteProtegee from "./components/auth/RouteProtegee";
import CommercantRootLayout from "./layouts/CommercantRootLayout";
import CommercantShell from "./layouts/CommercantShell";
import Onboarding from "./pages/commercant/Onboarding";
import DashboardHome from "./pages/commercant/DashboardHome";
import Produits from "./pages/commercant/Produits";
import Parametres from "./pages/commercant/Parametres";
import Categories from "./pages/commercant/Categories";
import BoutiquePubliqueLayout from "./layouts/BoutiquePubliqueLayout";
import AccueilBoutique from "./pages/boutique/Accueil";
import CatalogueBoutique from "./pages/boutique/Catalogue";
import FicheProduit from "./pages/boutique/FicheProduit";
import Panier from "./pages/boutique/Panier";
import TunnelCommande from "./pages/boutique/TunnelCommande";
import Confirmation from "./pages/boutique/Confirmation";
import Suivi from "./pages/boutique/Suivi";
import Commandes from "./pages/commercant/Commandes";
import MesCommandes from "./pages/MesCommandes";
import Paiement from "./pages/boutique/Paiement";
import AdminLayout from "./layouts/AdminLayout";
import Boutiques from "./pages/admin/Boutiques";
import Utilisateurs from "./pages/admin/Utilisateurs";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route
        element={
          <RouteProtegee rolesAutorises={["commercant"]}>
            <CommercantRootLayout />
          </RouteProtegee>
        }
      >
        <Route path="/commercant/onboarding" element={<Onboarding />} />

        <Route element={<CommercantShell />}>
          <Route path="/commercant" element={<DashboardHome />} />
          <Route path="/commercant/produits" element={<Produits />} />
          <Route path="/commercant/parametres" element={<Parametres />} />
          <Route path="/commercant/categories" element={<Categories />} />
          <Route path="/commercant/commandes" element={<Commandes />} />
        </Route>
      </Route>

      <Route
          element={
          <RouteProtegee rolesAutorises={["superadmin"]}>
          <AdminLayout />
          </RouteProtegee>
          }
        >
      <Route path="/admin" element={<Boutiques />} />
      <Route path="/admin/utilisateurs" element={<Utilisateurs />} />
      </Route>

      <Route path="/boutique/:sousDomaine" element={<BoutiquePubliqueLayout />}>
          <Route index element={<AccueilBoutique />} />
          <Route path="catalogue" element={<CatalogueBoutique />} />
          <Route path="produits/:slug" element={<FicheProduit />} />
          <Route path="panier" element={<Panier />} />
          <Route path="commande" element={<TunnelCommande />} />
          <Route path="commande/:numeroCommande/confirmation" element={<Confirmation />} />
          <Route path="commande/:numeroCommande/suivi" element={<Suivi />} />
          <Route path="commande/:numeroCommande/paiement" element={<Paiement />} />
      </Route>

        <Route
  path="/mes-commandes"
  element={
    <RouteProtegee rolesAutorises={["client", "commercant", "superadmin"]}>
      <MesCommandes />
    </RouteProtegee>
  }
/>
      
    </Routes>
  );
}