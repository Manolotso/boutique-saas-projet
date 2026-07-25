import { Package, ReceiptText, Wallet } from "lucide-react";

// Aperçu de fiche stock affiché dans la section "Suivi de stock".
export const STOCK_PREVIEW_ROWS = [
  { icon: Package, label: "Robe wax bleue", meta: "Stock : 4 restantes" },
  { icon: ReceiptText, label: "12 ventes aujourd'hui", meta: "Total : 187 500 Ar" },
  { icon: Wallet, label: "Sac tressé raphia", meta: "Alerte : dernière pièce" },
];

// Arguments listés à côté de l'aperçu.
export const STOCK_POINTS = [
  "Chaque vente met à jour le stock, sans ressaisie manuelle",
  "Les catégories s'adaptent à votre activité : vêtements, alimentation, cosmétique, artisanat",
  "Une alerte vous prévient dès qu'un article est presque épuisé",
];
