import apiClient from "./client";

export const adminApi = {
  statistiques: () => apiClient.get("/api/admin/statistiques/"),
};