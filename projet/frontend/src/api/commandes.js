import apiClient from "./client";

export const commandesApi = {
  creerCommande: (sousDomaine, donnees) =>
    apiClient.post(`/api/commandes/boutiques/${sousDomaine}/commander/`, donnees),
  obtenirCommande: (numeroCommande) => apiClient.get(`/api/commandes/suivi/${numeroCommande}/`),
  listerMesCommandes: () => apiClient.get("/api/commandes/mes-commandes/"),

  // --- Côté commerçant ---
  listerCommandesGestion: () => apiClient.get("/api/commandes/gestion/"),
  obtenirCommandeGestion: (id) => apiClient.get(`/api/commandes/gestion/${id}/`),
  changerStatutCommande: (id, statut, commentaire = "") =>
    apiClient.post(`/api/commandes/gestion/${id}/changer-statut/`, { statut, commentaire }),
};