import apiClient from "./client";

export const livraisonApi = {
  /** Estime distance et frais de livraison pour un point cliqué sur la carte (route publique). */
  estimer: (sousDomaine, { lat, lng, montantSousTotal }) =>
    apiClient.post(`/api/tenants/boutiques/${sousDomaine}/livraison/estimer/`, {
      lat,
      lng,
      ...(montantSousTotal !== undefined && { montant_sous_total: montantSousTotal }),
    }),
};