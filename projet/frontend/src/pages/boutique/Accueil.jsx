import { Link } from "react-router-dom";
import { Store, Phone, MapPin, Truck } from "lucide-react";
import { useBoutiquePublique } from "../../context/BoutiquePubliqueContext";
import BadgeVerifie from "../../components/boutique/BadgeVerifie";

const VILLES = {
  antananarivo: "Antananarivo", toamasina: "Toamasina", antsirabe: "Antsirabe",
  fianarantsoa: "Fianarantsoa", mahajanga: "Mahajanga", toliara: "Toliara",
  antsiranana: "Antsiranana", nosy_be: "Nosy Be", autre: "Autre",
};

const formater = (n) => Number(n).toLocaleString("fr-MG");

function CarteInfo({ icone: Icone, titre, couleur, children }) {
  return (
    <section className="rounded-2xl border border-[#12181B]/10 bg-white p-5">
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${couleur}1A`, color: couleur }}
        >
          <Icone size={18} />
        </span>
        <h2 className="text-[15px] font-medium text-[#12181B]">{titre}</h2>
      </div>
      <div className="mt-4 space-y-2 text-[14px] text-[#12181B]/70">{children}</div>
    </section>
  );
}

export default function AccueilBoutique() {
  const { boutique, sousDomaine } = useBoutiquePublique();
  const couleurAccent = boutique.couleur_secondaire || "#0E7C66";
  const couleurPrimaire = boutique.couleur_primaire || "#12181B";
  const devise = boutique.devise || "Ar";

  const adresse = [boutique.adresse, VILLES[boutique.ville]].filter(Boolean).join(", ");
  const aContact = boutique.telephone || adresse;
  const aLivraison = boutique.livraison_active;

  return (
    <div className="w-full space-y-8 px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
      <header className="overflow-hidden rounded-2xl border border-[#12181B]/10 bg-white">
        {/* Bannière : ratio 3:1, hauteur plafonnée sur très grand écran */}
        <div
          className="aspect-[3/1] max-h-[420px] w-full"
          style={{ background: `linear-gradient(135deg, ${couleurPrimaire}, ${couleurAccent})` }}
        >
          {boutique.banniere && (
            <img
              src={boutique.banniere}
              alt={`Bannière de ${boutique.nom_boutique}`}
              className="h-full w-full object-cover"
              fetchPriority="high"
            />
          )}
        </div>

        <div className="px-5 pb-7 sm:px-8">
          <div className="-mt-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-sm sm:-mt-12 sm:h-24 sm:w-24">
            {boutique.logo ? (
              <img src={boutique.logo} alt={boutique.nom_boutique} className="h-full w-full object-cover" />
            ) : (
              <span
                className="flex h-full w-full items-center justify-center text-white"
                style={{ backgroundColor: couleurPrimaire }}
              >
                <Store size={32} />
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-[26px] font-medium leading-tight text-[#12181B] sm:text-[32px]">
              {boutique.nom_boutique}
            </h1>
            {boutique.est_verifie && <BadgeVerifie couleur={couleurAccent} taille={22} />}
          </div>

          {boutique.slogan && (
            <p className="mt-1.5 font-display text-[17px] sm:text-[20px]" style={{ color: couleurAccent }}>
              {boutique.slogan}
            </p>
          )}

          {boutique.description && (
            <p className="mt-4 max-w-4xl text-[14px] leading-relaxed text-[#12181B]/70 sm:text-[15px]">
              {boutique.description}
            </p>
          )}

          <div className="mt-6">
            <Link
              to={`/boutique/${sousDomaine}/catalogue`}
              className="inline-flex h-11 items-center gap-2 rounded-full px-6 text-[14px] font-medium text-white shadow-sm transition-all hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ backgroundColor: "var(--boutique-accent, #0E7C66)" }}
            >
              <Store size={16} />
              Voir le catalogue
            </Link>
          </div>
        </div>
      </header>

      {(aContact || aLivraison) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {aContact && (
            <CarteInfo icone={Phone} titre="Nous trouver" couleur={couleurAccent}>
              {boutique.telephone && (
                <p>
                  <a href={`tel:${boutique.telephone}`} className="hover:underline">
                    {boutique.telephone}
                  </a>
                </p>
              )}
              {adresse && (
                <p className="flex items-start gap-2">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-[#12181B]/40" />
                  {adresse}
                </p>
              )}
            </CarteInfo>
          )}

          {aLivraison && (
            <CarteInfo icone={Truck} titre="Livraison" couleur={couleurAccent}>
              <p>Livraison à domicile disponible.</p>
              {boutique.rayon_max_km && <p>Jusqu'à {Number(boutique.rayon_max_km)} km de la boutique.</p>}
              {Number(boutique.seuil_livraison_gratuite) > 0 && (
                <p className="font-medium" style={{ color: couleurAccent }}>
                  Offerte dès {formater(boutique.seuil_livraison_gratuite)} {devise}
                </p>
              )}
            </CarteInfo>
          )}
        </div>
      )}
    </div>
  );
}