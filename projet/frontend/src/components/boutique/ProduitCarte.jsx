import { Link } from "react-router-dom";
import { Package, Eye } from "lucide-react";
import { useBoutiquePublique } from "../../context/BoutiquePubliqueContext";
import { formaterPrixAriary } from "../../api/formatage";

// Seuils ajustables selon votre activité
const SEUIL_STOCK_FAIBLE = 5;
const SEUIL_POPULAIRE = 10;
const SEUIL_NOUVEAU_JOURS = 14;

function estNouveau(produit) {
  if (!produit.date_publication) return false;
  const diffJours = (Date.now() - new Date(produit.date_publication)) / (1000 * 60 * 60 * 24);
  return diffJours <= SEUIL_NOUVEAU_JOURS;
}

function calculerBadges(produit) {
  const badges = [];
  const enPromo = produit.prix_promo && Number(produit.prix_actuel) < Number(produit.prix);

  if (!produit.en_stock) {
    badges.push({ label: "Rupture de stock", type: "rupture" });
  }
  if (enPromo) {
    const pourcentage = Math.round(
      (1 - Number(produit.prix_actuel) / Number(produit.prix)) * 100
    );
    badges.push({ label: `-${pourcentage}%`, type: "promo" });
  }
  if (produit.est_mis_en_avant) {
    badges.push({ label: "Coup de cœur", type: "avant" });
  }
  if (estNouveau(produit)) {
    badges.push({ label: "Nouveau", type: "nouveau" });
  }
  if (Number(produit.nombre_ventes) >= SEUIL_POPULAIRE) {
    badges.push({ label: "Populaire", type: "populaire" });
  }
  if (produit.en_stock && Number(produit.stock) <= SEUIL_STOCK_FAIBLE) {
    badges.push({ label: `Plus que ${produit.stock} en stock`, type: "stock" });
  }

  // Priorité d'affichage, max 2 badges
  const ordrePriorite = ["rupture", "promo", "avant", "nouveau", "populaire", "stock"];
  return badges
    .sort((a, b) => ordrePriorite.indexOf(a.type) - ordrePriorite.indexOf(b.type))
    .slice(0, 2);
}

const stylesBadge = {
  rupture: "bg-[#12181B] text-white",
  promo: "bg-red-500 text-white",
  avant: "bg-amber-400 text-[#12181B]",
  nouveau: "bg-emerald-500 text-white",
  populaire: "bg-[#12181B]/90 text-white",
  stock: "bg-orange-100 text-orange-700",
};

export default function ProduitCarte({ produit, onQuickView }) {
  const { sousDomaine } = useBoutiquePublique();
  const imagePrincipale = produit.images?.find((img) => img.est_principale) || produit.images?.[0];
  const enPromo = produit.prix_promo && Number(produit.prix_actuel) < Number(produit.prix);
  const badges = calculerBadges(produit);

  return (
    <Link
      to={`/boutique/${sousDomaine}/produits/${produit.slug}`}
      className="group block bg-white border border-[#12181B]/10 rounded-xl overflow-hidden hover:border-[#12181B]/20 transition-colors"
    >
      <div className="relative aspect-square bg-[#12181B]/[0.04] flex items-center justify-center overflow-hidden">
        {imagePrincipale ? (
          <img
            src={imagePrincipale.image}
            alt={produit.nom}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Package size={28} className="text-[#12181B]/20" />
        )}

        {badges.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
            {badges.map((badge) => (
              <span
                key={badge.type}
                className={`text-[10px] font-semibold px-2 py-1 rounded-full ${stylesBadge[badge.type]}`}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}

        {/* Bouton Quick View */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onQuickView?.(produit);
          }}
          className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          aria-label="Aperçu rapide"
        >
          <Eye size={14} className="text-[#12181B]" />
        </button>
      </div>

      <div className="p-3.5">
        <p className="text-[14px] font-medium text-[#12181B] truncate">{produit.nom}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[14px] font-medium text-[#12181B]">
            {Number(produit.prix_actuel).toLocaleString("fr-MG")} Ar
          </span>
          {enPromo && (
            <span className="text-[12px] text-[#12181B]/40 line-through">
              {Number(produit.prix).toLocaleString("fr-MG")} Ar
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}