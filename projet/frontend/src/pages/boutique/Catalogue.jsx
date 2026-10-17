import { useEffect, useState } from "react";
import { Package, Search, SearchX, RotateCcw, X } from "lucide-react";
import { catalogueApi } from "../../api/catalogue";
import { useBoutiquePublique } from "../../context/BoutiquePubliqueContext";
import ProduitCarte from "../../components/boutique/ProduitCarte";
import Skeleton from "../../components/ui/Skeleton";
import ProduitQuickView from "../../components/boutique/ProduitQuickView";
import { enregistrerEvenement } from "../../api/suivi";

// Même largeur que le header, l'accueil et le footer
const CONTENEUR = "w-full px-4 sm:px-6 lg:px-8 2xl:px-12";

// La grille s'adapte à la largeur : 2 colonnes sur mobile, jusqu'à 6 sur grand écran
const GRILLE = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

function EtatVide({ icone: Icone, titre, texte, children }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center justify-center py-20 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#12181B]/5">
        <Icone size={24} className="text-[#12181B]/35" />
      </span>
      <p className="text-[15px] font-medium text-[#12181B]">{titre}</p>
      {texte && <p className="mt-1 text-[13px] leading-relaxed text-[#12181B]/50">{texte}</p>}
      {children}
    </div>
  );
}

function SectionRecommandations({ produits, onQuickView }) {
  if (!produits.length) return null;
  return (
    <section className="mt-12 border-t border-[#12181B]/10 pt-8 sm:mt-16">
      <h2 className="font-display text-[20px] font-medium text-[#12181B] sm:text-[22px]">
        Recommandations pour vous
      </h2>
      <p className="mb-5 mt-1 text-[13px] text-[#12181B]/50">
        D'autres produits qui pourraient vous plaire
      </p>
      <div className={GRILLE}>
        {produits.map((p) => (
          <ProduitCarte key={p.id} produit={p} onQuickView={onQuickView} />
        ))}
      </div>
    </section>
  );
}

export default function CatalogueBoutique() {
  const { sousDomaine } = useBoutiquePublique();
  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [produitQuickView, setProduitQuickView] = useState(null);

  // Recherche côté serveur : null = aucune réponse reçue pour la recherche en cours
  const [resultats, setResultats] = useState(null);
  const [recommandations, setRecommandations] = useState([]);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);

  const terme = recherche.trim();
  const rechercheActive = terme.length >= 2;

  const chargerProduits = () => {
    setChargement(true);
    setErreur(false);
    catalogueApi
      .listerProduitsPublics(sousDomaine)
      .then((res) => setProduits(res.data.results || res.data))
      .catch(() => setErreur(true))
      .finally(() => setChargement(false));
  };

  useEffect(chargerProduits, [sousDomaine]);

  useEffect(() => {
    if (!rechercheActive) {
      setResultats(null);
      setRecommandations([]);
      setRechercheEnCours(false);
      return;
    }
    let annule = false;
    setRechercheEnCours(true);
    const minuteur = setTimeout(() => {
      catalogueApi
        .rechercherProduits(sousDomaine, terme)
        .then((res) => {
          if (annule) return;
          setResultats(res.data.results || []);
          setRecommandations(res.data.recommandations || []);
          enregistrerEvenement(sousDomaine, { type: "recherche", requete: terme });
        })
        .catch(() => {
          if (annule) return;
          setResultats([]);
          setRecommandations([]);
        })
        .finally(() => !annule && setRechercheEnCours(false));
    }, 300);
    return () => {
      annule = true;
      clearTimeout(minuteur);
    };
  }, [terme, sousDomaine, rechercheActive]);

  const produitsTrouves = resultats ?? [];
  const rechercheEnAttente = rechercheActive && (rechercheEnCours || resultats === null);
  const aDesProduits = !chargement && !erreur && produits.length > 0;

  const compteur = rechercheActive
    ? rechercheEnAttente
      ? "Recherche en cours…"
      : `${produitsTrouves.length} résultat${produitsTrouves.length > 1 ? "s" : ""}`
    : `${produits.length} produit${produits.length > 1 ? "s" : ""}`;

  return (
    <div className={`${CONTENEUR} py-6 sm:py-10`}>
      {/* En-tête de page */}
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[24px] font-medium text-[#12181B] sm:text-[28px]">Catalogue</h1>
          {aDesProduits && <p className="mt-1 text-[13px] text-[#12181B]/50">{compteur}</p>}
        </div>

        {aDesProduits && (
          <div className="relative w-full sm:w-80">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#12181B]/35" />
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un produit"
              aria-label="Rechercher un produit"
              className="h-11 w-full rounded-full border border-[#12181B]/10 bg-white pl-11 pr-10 text-[14px] text-[#12181B] transition-shadow placeholder:text-[#12181B]/35 focus:outline-none focus:ring-2 focus:ring-[#12181B]/20 [&::-webkit-search-cancel-button]:hidden"
            />
            {recherche && (
              <button
                onClick={() => setRecherche("")}
                aria-label="Effacer la recherche"
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#12181B]/40 transition-colors hover:bg-[#12181B]/5 hover:text-[#12181B]"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Contenu */}
      {chargement ? (
        <div className={GRILLE}>
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      ) : erreur ? (
        <EtatVide icone={Package} titre="Impossible de charger le catalogue" texte="Vérifie ta connexion et réessaie.">
          <button
            onClick={chargerProduits}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-[#12181B] px-5 text-[13px] font-medium text-[#F6F7F2] transition-colors hover:bg-[#12181B]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12181B] focus-visible:ring-offset-2"
          >
            <RotateCcw size={14} />
            Réessayer
          </button>
        </EtatVide>
      ) : produits.length === 0 ? (
        <EtatVide icone={Package} titre="Aucun produit pour l'instant" texte="Repasse bientôt, la boutique vient de démarrer." />
      ) : rechercheActive ? (
        <>
          {rechercheEnAttente ? (
            <div className={GRILLE}>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full" />
              ))}
            </div>
          ) : produitsTrouves.length === 0 ? (
            <EtatVide
              icone={SearchX}
              titre={`Aucun résultat pour « ${terme} »`}
              texte="Essaie avec un autre mot ou vérifie l'orthographe."
            >
              <button
                onClick={() => setRecherche("")}
                className="mt-5 inline-flex h-10 items-center rounded-full border border-[#12181B]/15 px-5 text-[13px] font-medium text-[#12181B] transition-colors hover:bg-[#12181B]/5"
              >
                Effacer la recherche
              </button>
            </EtatVide>
          ) : (
            <section>
              <h2 className="mb-5 font-display text-[20px] font-medium text-[#12181B] sm:text-[22px]">
                Résultats pour « {terme} »
              </h2>
              <div className={GRILLE}>
                {produitsTrouves.map((p) => (
                  <ProduitCarte key={p.id} produit={p} onQuickView={setProduitQuickView} />
                ))}
              </div>
            </section>
          )}

          {!rechercheEnAttente && (
            <SectionRecommandations produits={recommandations} onQuickView={setProduitQuickView} />
          )}
        </>
      ) : (
        <div className={GRILLE}>
          {produits.map((p) => (
            <ProduitCarte key={p.id} produit={p} onQuickView={setProduitQuickView} />
          ))}
        </div>
      )}

      {produitQuickView && (
        <ProduitQuickView produit={produitQuickView} onFermer={() => setProduitQuickView(null)} />
      )}
    </div>
  );
}