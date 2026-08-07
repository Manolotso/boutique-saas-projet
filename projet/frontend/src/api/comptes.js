import apiClient from "./client";

export const comptesApi = {
  envoyerCode: (email, role) =>
    apiClient.post("/api/comptes/inscription/envoyer-code/", { email, role }),
  verifierCode: (email, code) =>
    apiClient.post("/api/comptes/inscription/verifier-code/", { email, code }),
  finaliser: (email, code, username, password, nomBoutique) =>
    apiClient.post("/api/comptes/inscription/finaliser/", { email, code, username, password, nom_boutique: nomBoutique }),
};