import { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/client";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);

  const [chargementInitial, setChargementInitial] = useState(true);

useEffect(() => {
  const token = localStorage.getItem("access_token");
  if (token) {
    try {
      const payload = jwtDecode(token);
      const estExpire = payload.exp * 1000 < Date.now();
      if (estExpire) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      } else {
        setUtilisateur({ username: payload.username, role: payload.role });
      }
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }
  setChargementInitial(false);
}, []);

  const seConnecter = async (email, password) => {
  setChargement(true);
  setErreur(null);
  try {
    const response = await apiClient.post("/api/auth/token/", { email, password });
    const { access, refresh } = response.data;

    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);

    const payload = jwtDecode(access);
    const utilisateurConnecte = { email, username: payload.username, role: payload.role };
    setUtilisateur(utilisateurConnecte);

    return utilisateurConnecte;
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

  const seConnecterAvecTokens = ({ access, refresh }) => {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);

  const payload = jwtDecode(access);
  const utilisateurConnecte = { username: payload.username, role: payload.role };
  setUtilisateur(utilisateurConnecte);

  return utilisateurConnecte;
};

  return (
    <AuthContext.Provider value={{ utilisateur, chargement, erreur, seConnecter, seDeconnecter, seConnecterAvecTokens, chargementInitial }}>
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

