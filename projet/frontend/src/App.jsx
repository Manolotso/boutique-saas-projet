import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AdminDashboard from "./pages/admin/Dashboard";
import RouteProtegee from "./components/auth/RouteProtegee";
import CommercantRootLayout from "./layouts/CommercantRootLayout";
import CommercantShell from "./layouts/CommercantShell";
import Onboarding from "./pages/commercant/Onboarding";
import DashboardHome from "./pages/commercant/DashboardHome";
import Produits from "./pages/commercant/Produits";
import Parametres from "./pages/commercant/Parametres";

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
        </Route>
      </Route>

      <Route
        path="/admin"
        element={
          <RouteProtegee rolesAutorises={["superadmin"]}>
            <AdminDashboard />
          </RouteProtegee>
        }
      />
    </Routes>
  );
}