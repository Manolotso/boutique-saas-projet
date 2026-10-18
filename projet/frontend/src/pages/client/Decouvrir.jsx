import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { User } from "lucide-react";
import { catalogueApi } from "../../api/catalogue";
import { useAuth } from "../../context/AuthContext";
import { ProduitCarteMarketplace } from "../../components/boutique/ProduitCarte";
import Skeleton from "../../components/ui/Skeleton";

const GRILLE = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

function Section({ titre, sousTitre, produits }) {
  if (!produits.length) return null;
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="font-display text-[20px] font-medium text-[#12181B] sm:text-[22px]">{titre}</h2>
      {sousTitre && <p className="mb-5 mt-1 text-[13px] text-[#12181B]/50">{sousTitre}</p>}
      <div className={`${GRILLE} ${sousTitre ? "" : "mt-5"}`}>
        {produits.map((p) => <ProduitCarteMarketplace key={p.id} produit={p} />)}
      </div>
    </section>
  );
}

export default function Decouvrir() {
  const { utilisateur } = useAuth();
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    catalogueApi.decouvrir().then((res) => setDonnees(res.data)).catch(() => setErreur(true));
  }, []);

  return (
    <div className="min-h-screen bg-[#FBFAF6]">
      <header className="border-b border-[#12181B]/10 bg-white">
        <div className="flex w-full items-center justify-between px-4 py-4 sm:px-6 lg:px-8 2xl:px-12">
          <span className="font-display text-[19px] font-medium text-[#12181B]">Varotra</span>
          <Link to="/mon-compte" className="inline-flex items-center gap-1.5 text-[14px] text-[#12181B]/70 hover:text-[#12181B]">
            <User size={15} /> {utilisateur?.username || "Mon compte"}
          </Link>
        </div>
      </header>

      <main className="w-full px-4 py-8 sm:px-6 lg:px-8 2xl:px-12">
        {erreur ? (
          <p className="py-20 text-center text-[14px] text-[#12181B]/60">Impossible de charger les produits.</p>
        ) : !donnees ? (
          <div className={GRILLE}>
            {[...Array(12)].map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}
          </div>
        ) : (
          <>
            <Section
              titre={donnees.personnalise ? "Pour vous" : "Sélection du moment"}
              sousTitre={donnees.personnalise ? "Basé sur ce que vous avez regardé ou acheté" : "Les produits les plus appréciés"}
              produits={donnees.pour_vous}
            />
            <Section titre="Nouveautés" produits={donnees.nouveautes} />
            <Section titre="Les plus vendus" produits={donnees.populaires} />
          </>
        )}
      </main>
    </div>
  );
}