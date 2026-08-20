// src/utils/formatage.js

/**
 * Formate un montant en Ariary avec séparateur de milliers,
 * ex : formaterPrixAriary(12000) -> "12 000 Ar"
 */
export function formaterPrixAriary(montant) {
  if (montant === null || montant === undefined) return "";
  const nombre = Math.round(Number(montant));
  return `${nombre.toLocaleString("fr-FR")} Ar`;
}