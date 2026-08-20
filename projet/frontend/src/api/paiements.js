import apiClient from "./client";

export const paiementsApi = {
  obtenirTauxChange: () => apiClient.get("/api/paiements/taux-change/"),
  initierPaiement: (numeroCommande, operateur) =>
    apiClient.post(`/api/paiements/commandes/${numeroCommande}/initier/`, { operateur }),
  confirmerPaiement: (numeroCommande, code) =>
    apiClient.post(`/api/paiements/commandes/${numeroCommande}/confirmer/`, { code }),
};