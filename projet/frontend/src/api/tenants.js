import apiClient from "./client";

export const tenantsApi = {
  obtenirMaBoutique: () => apiClient.get("/api/tenants/ma-boutique/"),
  modifierMaBoutique: (donnees) => apiClient.patch("/api/tenants/ma-boutique/", donnees),
};