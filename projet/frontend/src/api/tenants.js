import apiClient from "./client";

export const tenantsApi = {
  obtenirMaBoutique: () => apiClient.get("/api/tenants/ma-boutique/"),
  modifierMaBoutique: (donnees) => apiClient.patch("/api/tenants/ma-boutique/", donnees),
  obtenirBoutiquePublique: (sousDomaine) => apiClient.get(`/api/tenants/boutiques/${sousDomaine}/`),

  // --- Admin ---
  listerBoutiquesAdmin: () => apiClient.get("/api/tenants/admin/boutiques/"),
  suspendreBoutique: (id) => apiClient.post(`/api/tenants/admin/boutiques/${id}/suspendre/`),
  reactiverBoutique: (id) => apiClient.post(`/api/tenants/admin/boutiques/${id}/reactiver/`),
  verifierBoutique: (id) => apiClient.post(`/api/tenants/admin/boutiques/${id}/verifier/`),
  retirerVerificationBoutique: (id) => apiClient.post(`/api/tenants/admin/boutiques/${id}/retirer_verification/`),
};