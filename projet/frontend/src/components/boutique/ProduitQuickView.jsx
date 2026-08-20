import { useState } from "react";
import { Link } from "react-router-dom";
import { X, Package, Minus, Plus } from "lucide-react";
import { useBoutiquePublique } from "../../context/BoutiquePubliqueContext";
import { usePanier } from "../../context/PanierContext";
import { useToast } from "../../context/ToastContext";

export default function ProduitQuickView({ produit, onFermer }) {
  const { sousDomaine } = useBoutiquePublique();
  const { notifier } = useToast();
  const { ajouterArticle } = usePanier();
  const [imageActive, setImageActive] = useState(
    produit.images?.find((img) => img.est_principale) || produit.images?.[0]
  );
  const [quantite, setQuantite] = useState(1);

  const enPromo = produit.prix_promo && Number(produit.prix_actuel) < Number(produit.prix);

  const gererIncrement = () => {
  if (quantite >= produit.stock) {
    notifier(`Stock maximum atteint (${produit.stock} disponible${produit.stock > 1 ? "s" : ""}).`, "info");
    return;
  }
  setQuantite(quantite + 1);
};

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#12181B]/40 p-4"
      onClick={onFermer}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onFermer}
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 hover:bg-white transition-colors"
        >
          <X size={16} className="text-[#12181B]" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6">
          {/* Galerie image */}
          <div>
            <div className="aspect-square bg-[#12181B]/[0.04] rounded-xl flex items-center justify-center overflow-hidden">
              {imageActive ? (
                <img
                  src={imageActive.image}
                  alt={produit.nom}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Package size={32} className="text-[#12181B]/20" />
              )}
            </div>
            {produit.images?.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {produit.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setImageActive(img)}
                    className={`h-14 w-14 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      imageActive?.id === img.id ? "border-[#12181B]" : "border-transparent"
                    }`}
                  >
                    <img src={img.image} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Infos produit */}
          <div className="flex flex-col">
            {produit.marque && (
              <p className="text-[12px] text-[#12181B]/40 uppercase tracking-wide mb-1">
                {produit.marque}
              </p>
            )}
            <h2 className="font-display text-[20px] font-medium text-[#12181B]">{produit.nom}</h2>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-[18px] font-medium text-[#12181B]">
                {Number(produit.prix_actuel).toLocaleString("fr-MG")} Ar
              </span>
              {enPromo && (
                <span className="text-[14px] text-[#12181B]/40 line-through">
                  {Number(produit.prix).toLocaleString("fr-MG")} Ar
                </span>
              )}
            </div>

            {produit.description && (
              <p className="text-[13px] text-[#12181B]/60 mt-3 line-clamp-4">
                {produit.description}
              </p>
            )}

            <div className="mt-3">
              {produit.en_stock ? (
                <span className="text-[12px] text-emerald-600 font-medium">
                  {produit.stock <= 5 ? `Plus que ${produit.stock} en stock` : "En stock"}
                </span>
              ) : (
                <span className="text-[12px] text-red-500 font-medium">Rupture de stock</span>
              )}
            </div>

            {/* Sélecteur de quantité */}
            {produit.en_stock && (
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center border border-[#12181B]/10 rounded-full">
                  <button
                    onClick={() => setQuantite((q) => Math.max(1, q - 1))}
                    className="h-9 w-9 flex items-center justify-center hover:bg-[#12181B]/5 rounded-full transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-[14px]">{quantite}</span>

                  <button
                    onClick={gererIncrement}
                    className="h-9 w-9 flex items-center justify-center hover:bg-[#12181B]/5 rounded-full transition-colors"
                    >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 mt-5">
  <button
    onClick={() => {
  const resultat = ajouterArticle(produit, null, quantite);
  if (resultat.limitee) {
    notifier(`Quantité limitée au stock disponible (${resultat.stockDisponible}).`, "info");
  } else {
    notifier("Ajouté au panier.");
  }
  onFermer();
}}
    disabled={!produit.en_stock || produit.variantes?.length > 0}
    className="h-11 rounded-full bg-[#12181B] text-[#F6F7F2] text-[14px] font-medium hover:bg-[#12181B]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
  >
    {!produit.en_stock
      ? "Indisponible"
      : produit.variantes?.length > 0
      ? "Choisir une option sur la fiche"
      : "Ajouter au panier"}
  </button>
  <Link
    to={`/boutique/${sousDomaine}/produits/${produit.slug}`}
    className="text-[13px] text-center text-[#12181B]/50 underline underline-offset-2 hover:text-[#12181B]"
  >
    Voir la page complète du produit
  </Link>
</div>
          </div>
        </div>
      </div>
    </div>
  );
}