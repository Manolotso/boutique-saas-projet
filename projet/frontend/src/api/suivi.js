import apiClient from "./client";

// Identifiant anonyme, propre à ce navigateur. Ne contient aucune donnée personnelle.
export function obtenirVisiteurId() {
  try {
    let id = localStorage.getItem("visiteur_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("visiteur_id", id);
    }
    return id;
  } catch {
    return "";
  }
}

export const enteteVisiteur = () => ({ "X-Visiteur-Id": obtenirVisiteurId() });

// Envoi discret : un échec de suivi ne doit jamais gêner le visiteur.
export function enregistrerEvenement(sousDomaine, donnees) {
  apiClient
    .post(`/api/recherche/${sousDomaine}/evenements/`, donnees, { headers: enteteVisiteur() })
    .catch(() => {});
}