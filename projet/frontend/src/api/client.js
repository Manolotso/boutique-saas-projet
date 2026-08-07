import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

const ROUTES_PUBLIQUES = ["/api/auth/token/", "/api/comptes/inscription/"];

// Ajoute automatiquement le token JWT, sauf sur les routes publiques (connexion/inscription)
apiClient.interceptors.request.use((config) => {
  const estRoutePublique = ROUTES_PUBLIQUES.some((route) => config.url.startsWith(route));

  if (!estRoutePublique) {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default apiClient;