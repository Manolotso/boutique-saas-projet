import apiClient from "./client";

export const catalogueApi = {
  listerProduits: () => apiClient.get("/api/catalogue/produits/"),
  creerProduit: (donnees) => apiClient.post("/api/catalogue/produits/", donnees),
  modifierProduit: (id, donnees) => apiClient.patch(`/api/catalogue/produits/${id}/`, donnees),
  supprimerProduit: (id) => apiClient.delete(`/api/catalogue/produits/${id}/`),
  listerCategories: () => apiClient.get("/api/catalogue/categories/"),
};