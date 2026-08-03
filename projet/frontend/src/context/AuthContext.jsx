import { createContext, useContext, useState } from "react";
import apiClient from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);

  const seConnecter = async (username, password) => {
    setChargement(true);
    setErreur(null);
    try {
      const response = await apiClient.post("/api/auth/token/", { username, password });
      const { access, refresh } = response.data;

      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);

      setUtilisateur({ username });
    } catch (err) {
      setErreur("Identifiants incorrects.");
      throw err;
    } finally {
      setChargement(false);
    }
  };

  const seDeconnecter = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUtilisateur(null);
  };

  return (
    <AuthContext.Provider value={{ utilisateur, chargement, erreur, seConnecter, seDeconnecter }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexte = useContext(AuthContext);
  if (!contexte) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un <AuthProvider>");
  }
  return contexte;
}