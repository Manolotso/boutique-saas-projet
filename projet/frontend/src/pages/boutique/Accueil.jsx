import { Link } from "react-router-dom";
import { Store } from "lucide-react";
import { useBoutiquePublique } from "../../context/BoutiquePubliqueContext";
import BadgeVerifie from "../../components/boutique/BadgeVerifie";


export default function AccueilBoutique() {
  const { boutique, sousDomaine } = useBoutiquePublique();
  const couleurAccent = boutique.couleur_secondaire || "#0E7C66";
  const couleurPrimaire = boutique.couleur_primaire || "#12181B";

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Bandeau de bienvenue */}
      <div
        className="rounded-2xl px-6 py-10 sm:px-10 sm:py-12"
        style={{
          background: `linear-gradient(135deg, ${couleurPrimaire}0D, ${couleurAccent}12)`,
        }}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="font-display text-[28px] sm:text-[32px] font-medium text-[#12181B]">
            {boutique.nom_boutique}
          </h1>
          {boutique.est_verifie && <BadgeVerifie couleur={couleurAccent} taille={22} />}
        </div>

        {boutique.slogan && (
          <p
            className="text-[18px] sm:text-[20px] font-display mt-2"
            style={{ color: couleurAccent }}
          >
            {boutique.slogan}
          </p>
        )}

        {boutique.description && (
          <p className="text-[14px] text-[#12181B]/70 mt-4 max-w-2xl leading-relaxed">
            {boutique.description}
          </p>
        )}

        <div className="mt-7">
          <Link
            to={`/boutique/${sousDomaine}/catalogue`}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full text-white text-[14px] font-medium shadow-sm hover:shadow-md hover:scale-[1.02] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: "var(--boutique-accent, #0E7C66)" }}
          >
            <Store size={16} />
            Voir le catalogue
          </Link>
        </div>
      </div>
    </div>
  );
}