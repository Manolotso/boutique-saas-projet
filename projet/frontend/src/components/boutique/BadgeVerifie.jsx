import { Check } from "lucide-react";

export default function BadgeVerifie({ couleur = "#0E7C66", taille = 18 }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{ backgroundColor: couleur, width: taille, height: taille }}
      title="Boutique vérifiée"
      aria-label="Boutique vérifiée"
    >
      <Check size={taille * 0.65} strokeWidth={3} className="text-white" />
    </span>
  );
}