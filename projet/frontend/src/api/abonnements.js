import apiClient from "./client";

export const abonnementsApi = {
  listerPlans: () => apiClient.get("/api/abonnements/plans/"),
  obtenirMonAbonnement: () => apiClient.get("/api/abonnements/mon-abonnement/"),
  changerPlan: (planCode, periodicite) =>
    apiClient.post("/api/abonnements/mon-abonnement/changer-plan/", { plan_code: planCode, periodicite }),
};