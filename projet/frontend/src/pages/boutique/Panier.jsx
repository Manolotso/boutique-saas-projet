import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, AlertTriangle } from "lucide-react";
import { usePanier } from "../../context/PanierContext";
import { useBoutiquePublique } from "../../context/BoutiquePubliqueContext";

export default function Panier() {
  const { articles, modifierQuantite, retirerArticle, montantTotal, verifierArticles, verification } = usePanier();
  const { boutique, sousDomaine } = useBoutiquePublique();
  const [changementsAffiches, setChangementsAffiches] = useState([]);

  // Revérifie le panier auprès du backend à chaque ouverture de la page
  // (détecte prix modifié, stock insuffisant, produit dépublié/supprimé depuis l'ajout).
  useEffect(() => {
    if (articles.length > 0) {
      verifierArticles().then((changements) => {
        if (changements.length > 0) setChangementsAffiches(changements);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (articles.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <ShoppingBag size={28} className="text-[#12181B]/20 mx-auto mb-3" />
        <p className="text-[14px] text-[#12181B]/50 mb-4">Ton panier est vide.</p>
        <Link
          to={`/boutique/${sousDomaine}/catalogue`}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--boutique-primary,#12181B)] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[var(--boutique-accent,#0E7C66)] transition-colors"
        >
          Découvrir les produits
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-[22px] font-medium text-[#12181B] mb-6">Mon panier</h1>

      {verification.enCours && (
        <p className="text-[12px] text-[#12181B]/40 mb-4">Vérification des disponibilités...</p>
      )}

      {changementsAffiches.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 mb-5">
          <div className="flex items-start gap-2">
            <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              {changementsAffiches.map((message, i) => (
                <p key={i} className="text-[13px] text-amber-700">{message}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {articles.map((article) => (
          <div
            key={`${article.produitId}-${article.varianteId || "x"}`}
            className="flex items-center gap-4 bg-white border border-[#12181B]/10 rounded-xl p-4"
          >
            <div className="h-16 w-16 rounded-lg bg-[#12181B]/[0.04] shrink-0 overflow-hidden">
              {article.image && <img src={article.image} alt="" className="h-full w-full object-cover" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-[#12181B] truncate">{article.nom}</p>
              {article.varianteLabel && (
                <p className="text-[12px] text-[#12181B]/50">{article.varianteLabel}</p>
              )}
              <p className="text-[13px] text-[#12181B]/70 mt-0.5">
                {Number(article.prix).toLocaleString("fr-MG")} {boutique.devise}
              </p>
            </div>

            <div className="flex items-center border border-[#12181B]/10 rounded-full shrink-0">
              <button
                onClick={() => modifierQuantite(article.produitId, article.varianteId, article.quantite - 1)}
                className="w-8 h-8 flex items-center justify-center text-[#12181B]/60 hover:text-[#12181B]"
              >
                <Minus size={13} />
              </button>
              <span className="w-6 text-center text-[13px] text-[#12181B]">{article.quantite}</span>
              <button
                onClick={() => modifierQuantite(article.produitId, article.varianteId, article.quantite + 1)}
                className="w-8 h-8 flex items-center justify-center text-[#12181B]/60 hover:text-[#12181B]"
              >
                <Plus size={13} />
              </button>
            </div>

            <button
              onClick={() => retirerArticle(article.produitId, article.varianteId)}
              aria-label="Retirer"
              className="text-red-500/60 hover:text-red-600 shrink-0"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#12181B]/10">
        <span className="text-[15px] font-medium text-[#12181B]">Total</span>
        <span className="text-[18px] font-medium text-[#12181B]">
          {montantTotal.toLocaleString("fr-MG")} {boutique.devise}
        </span>
      </div>

      <Link
        to={`/boutique/${sousDomaine}/commande`}
        className="block text-center w-full mt-5 rounded-full bg-[var(--boutique-primary,#12181B)] text-[#F6F7F2] text-[14px] font-medium px-6 py-3 hover:bg-[var(--boutique-accent,#0E7C66)] transition-colors"
      >
        Passer la commande
      </Link>
    </div>
  );
}