import apiClient from "./client";

export const comptesApi = {
  envoyerCode: (email, role) =>
    apiClient.post("/api/comptes/inscription/envoyer-code/", { email, role }),
  verifierCode: (email, code) =>
    apiClient.post("/api/comptes/inscription/verifier-code/", { email, code }),
  finaliser: (email, code, username, password, nomBoutique) =>
    apiClient.post("/api/comptes/inscription/finaliser/", { email, code, username, password, nom_boutique: nomBoutique }),

  // --- Admin ---
  listerUtilisateursAdmin: () => apiClient.get("/api/comptes/utilisateurs/"),
  modifierUtilisateurAdmin: (id, donnees) => apiClient.patch(`/api/comptes/utilisateurs/${id}/`, donnees),
  supprimerUtilisateurAdmin: (id) => apiClient.delete(`/api/comptes/utilisateurs/${id}/`),
};