import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { usePanier } from "../../context/PanierContext";

export default function MiniPanier({ isOpen, onClose, sousDomaine, devise, couleurAccent }) {
  const { articles, modifierQuantite, retirerArticle, montantTotal } = usePanier();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-[#12181B]/40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-[#FBFAF6] shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 h-16 border-b border-[#12181B]/10 shrink-0">
              <p className="text-[15px] font-display font-medium text-[#12181B]">Mon panier</p>
              <button
                onClick={onClose}
                aria-label="Fermer"
                className="flex items-center justify-center h-8 w-8 rounded-full text-[#12181B]/50 hover:text-[#12181B] hover:bg-[#12181B]/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {articles.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <ShoppingBag size={26} className="text-[#12181B]/20 mb-3" />
                <p className="text-[13px] text-[#12181B]/50">Ton panier est vide.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {articles.map((article) => (
                    <div
                      key={`${article.produitId}-${article.varianteId || "x"}`}
                      className="flex items-center gap-3 bg-white border border-[#12181B]/10 rounded-xl p-3"
                    >
                      <div className="h-14 w-14 rounded-lg bg-[#12181B]/[0.04] shrink-0 overflow-hidden">
                        {article.image && <img src={article.image} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#12181B] truncate">{article.nom}</p>
                        {article.varianteLabel && (
                          <p className="text-[11px] text-[#12181B]/50">{article.varianteLabel}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-center border border-[#12181B]/10 rounded-full">
                            <button
                              onClick={() => modifierQuantite(article.produitId, article.varianteId, article.quantite - 1)}
                              className="w-6 h-6 flex items-center justify-center text-[#12181B]/60 hover:text-[#12181B]"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="w-5 text-center text-[12px] text-[#12181B]">{article.quantite}</span>
                            <button
                              onClick={() => modifierQuantite(article.produitId, article.varianteId, article.quantite + 1)}
                              className="w-6 h-6 flex items-center justify-center text-[#12181B]/60 hover:text-[#12181B]"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                          <span className="text-[12px] text-[#12181B]/70">
                            {(article.prix * article.quantite).toLocaleString("fr-MG")} {devise}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => retirerArticle(article.produitId, article.varianteId)}
                        aria-label="Retirer"
                        className="text-red-500/50 hover:text-red-600 shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#12181B]/10 px-5 py-4 space-y-3 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-medium text-[#12181B]">Total</span>
                    <span className="text-[16px] font-medium text-[#12181B]">
                      {montantTotal.toLocaleString("fr-MG")} {devise}
                    </span>
                  </div>
                  <Link
                    to={`/boutique/${sousDomaine}/commande`}
                    onClick={onClose}
                    className="block text-center w-full rounded-full text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 transition-colors"
                    style={{ backgroundColor: "var(--boutique-primary, #12181B)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = couleurAccent)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--boutique-primary, #12181B)")}
                  >
                    Passer la commande
                  </Link>
                  <Link
                    to={`/boutique/${sousDomaine}/panier`}
                    onClick={onClose}
                    className="block text-center w-full text-[13px] text-[#12181B]/60 hover:text-[#12181B]"
                  >
                    Voir le panier complet
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}