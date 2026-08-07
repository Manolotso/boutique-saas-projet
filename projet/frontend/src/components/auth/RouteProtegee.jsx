import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RouteProtegee({ rolesAutorises, children }) {
  const { utilisateur, chargementInitial } = useAuth();

  if (chargementInitial) {
    return null; // ou un petit spinner, le temps de vérifier le token
  }

  if (!utilisateur) {
    return <Navigate to="/" replace />;
  }

  if (!rolesAutorises.includes(utilisateur.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}