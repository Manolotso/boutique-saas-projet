import apiClient from "./client";

export const paiementsApi = {
  obtenirTauxChange: () => apiClient.get("/api/paiements/taux-change/"),
  initierPaiement: (numeroCommande, operateur, telephone) =>
    apiClient.post(`/api/paiements/commandes/${numeroCommande}/initier/`, {
      operateur,
      ...(telephone && { telephone }),
    }),
  confirmerPaiement: (numeroCommande, code) =>
    apiClient.post(`/api/paiements/commandes/${numeroCommande}/confirmer/`, { code }),
  statutPaiement: (numeroCommande) =>
    apiClient.get(`/api/paiements/commandes/${numeroCommande}/statut/`),
};