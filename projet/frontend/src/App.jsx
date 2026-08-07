import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CommercantDashboard from "./pages/commercant/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import RouteProtegee from "./components/auth/RouteProtegee";
import Produits from "./pages/commercant/Produits";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/commercant"
        element={
          <RouteProtegee rolesAutorises={["commercant"]}>
            <CommercantDashboard />
          </RouteProtegee>
        }
      />
      <Route
        path="/admin"
        element={
          <RouteProtegee rolesAutorises={["superadmin"]}>
            <AdminDashboard />
          </RouteProtegee>
        }
      />
      <Route
        path="/commercant/produits"
        element={
          <RouteProtegee rolesAutorises={["commercant"]}>
      <     Produits />
          </RouteProtegee>
        }
      />
    </Routes>
  );
}