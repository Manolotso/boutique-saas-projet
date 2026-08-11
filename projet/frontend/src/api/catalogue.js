import apiClient from "./client";

export const catalogueApi = {
  listerProduits: () => apiClient.get("/api/catalogue/produits/"),
  creerProduit: (donnees) => apiClient.post("/api/catalogue/produits/", donnees),
  modifierProduit: (id, donnees) => apiClient.patch(`/api/catalogue/produits/${id}/`, donnees),
  supprimerProduit: (id) => apiClient.delete(`/api/catalogue/produits/${id}/`),
  listerCategories: () => apiClient.get("/api/catalogue/categories/"),

  // --- Images produit ---
  listerImagesProduit: (produitId) => apiClient.get(`/api/catalogue/produits/${produitId}/images/`),
  ajouterImageProduit: (produitId, formData) =>
    apiClient.post(`/api/catalogue/produits/${produitId}/images/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  definirImagePrincipale: (produitId, imageId) =>
    apiClient.post(`/api/catalogue/images/${imageId}/definir-principale/`),
  supprimerImageProduit: (imageId) => apiClient.delete(`/api/catalogue/images/${imageId}/`),
};