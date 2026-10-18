import { useEffect, useMemo, useRef, useState } from "react";
import { Package, Search, SearchX, RotateCcw, X, SlidersHorizontal } from "lucide-react";
import { catalogueApi } from "../../api/catalogue";
import { useBoutiquePublique } from "../../context/BoutiquePubliqueContext";
import ProduitCarte from "../../components/boutique/ProduitCarte";
import PanneauFiltres from "../../components/boutique/PanneauFiltres";
import Skeleton from "../../components/ui/Skeleton";
import ProduitQuickView from "../../components/boutique/ProduitQuickView";
import { enregistrerEvenement } from "../../api/suivi";

const CONTENEUR = "w-full px-4 sm:px-6 lg:px-8 2xl:px-12";
const GRILLE = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";
const SANS_BARRE = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

const TRIS = [
  { valeur: "pertinence", label: "Pertinence" },
  { valeur: "nouveau", label: "Nouveautés" },
  { valeur: "populaire", label: "Les plus vendus" },
  { valeur: "prix_asc", label: "Prix croissant" },
  { valeur: "prix_desc", label: "Prix décroissant" },
];

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
      <h2 className="font-display text-[20px] font-medium text-[#12181B] sm:text-[22px]">Recommandations pour vous</h2>
      <p className="mb-5 mt-1 text-[13px] text-[#12181B]/50">D'autres produits qui pourraient vous plaire</p>
      <div className={GRILLE}>
        {produits.map((p) => <ProduitCarte key={p.id} produit={p} onQuickView={onQuickView} />)}
      </div>
    </section>
  );
}

export default function CatalogueBoutique() {
  const { sousDomaine } = useBoutiquePublique();

  // Recherche et filtres (indépendants)
  const [recherche, setRecherche] = useState("");
  const [categories, setCategories] = useState([]);
  const [prixMin, setPrixMin] = useState("");
  const [prixMax, setPrixMax] = useState("");
  const [promo, setPromo] = useState(false);
  const [enStock, setEnStock] = useState(false);
  const [tri, setTri] = useState("pertinence");

  // Données
  const [resultats, setResultats] = useState([]);
  const [recommandations, setRecommandations] = useState([]);
  const [categoriesDispo, setCategoriesDispo] = useState([]);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(false);
  const [essai, setEssai] = useState(0);

  const [tiroir, setTiroir] = useState(false);
  const [produitQuickView, setProduitQuickView] = useState(null);
  const premier = useRef(true);

  const terme = recherche.trim();
  const rechercheActive = terme.length >= 2;
  const nombreActifs = categories.length + (prixMin ? 1 : 0) + (prixMax ? 1 : 0) + (promo ? 1 : 0) + (enStock ? 1 : 0);
  const filtreActif = rechercheActive || nombreActifs > 0;
  // Sans recherche, "Pertinence" n'a pas de sens : on affiche les plus récents
  const triEffectif = !rechercheActive && tri === "pertinence" ? "nouveau" : tri;

  const basculerCategorie = (nom) =>
    setCategories((l) => (l.includes(nom) ? l.filter((c) => c !== nom) : [...l, nom]));

  const reinitialiserFiltres = () => {
    setCategories([]);
    setPrixMin("");
    setPrixMax("");
    setPromo(false);
    setEnStock(false);
  };

  const reinitialiser = () => {
    setRecherche("");
    reinitialiserFiltres();
    setTri("pertinence");
  };

  useEffect(() => {
    let annule = false;
    setEnCours(true);
    const minuteur = setTimeout(() => {
      const params = { tri: triEffectif };
      if (rechercheActive) params.q = terme;
      if (categories.length) params.categories = categories.join(",");
      if (prixMin) params.prix_min = prixMin;
      if (prixMax) params.prix_max = prixMax;
      if (promo) params.promo = 1;
      if (enStock) params.en_stock = 1;

      catalogueApi
        .catalogueBoutique(sousDomaine, params)
        .then((res) => {
          if (annule) return;
          setResultats(res.data.results || []);
          setRecommandations(res.data.recommandations || []);
          setCategoriesDispo(res.data.categories || []);
          setErreur(false);
        })
        .catch(() => !annule && setErreur(true))
        .finally(() => {
          if (annule) return;
          premier.current = false;
          setEnCours(false);
          setChargementInitial(false);
        });
    }, premier.current ? 0 : 300);
    return () => {
      annule = true;
      clearTimeout(minuteur);
    };
  }, [sousDomaine, terme, rechercheActive, categories, prixMin, prixMax, promo, enStock, triEffectif, essai]);

  // Événement "recherche" : seulement quand la saisie est stable
  useEffect(() => {
    if (!rechercheActive) return;
    const minuteur = setTimeout(() => {
      enregistrerEvenement(sousDomaine, { type: "recherche", requete: terme });
    }, 1500);
    return () => clearTimeout(minuteur);
  }, [terme, sousDomaine, rechercheActive]);

  const f = {
    categories, basculerCategorie, prixMin, setPrixMin, prixMax, setPrixMax,
    promo, setPromo, enStock, setEnStock, nombreActifs, reinitialiserFiltres,
  };

  const pastilles = useMemo(() => {
    const liste = categories.map((c) => ({ cle: `cat-${c}`, label: c, retirer: () => basculerCategorie(c) }));
    if (prixMin) liste.push({ cle: "pmin", label: `Dès ${Number(prixMin).toLocaleString("fr-MG")} Ar`, retirer: () => setPrixMin("") });
    if (prixMax) liste.push({ cle: "pmax", label: `Jusqu'à ${Number(prixMax).toLocaleString("fr-MG")} Ar`, retirer: () => setPrixMax("") });
    if (promo) liste.push({ cle: "promo", label: "En promotion", retirer: () => setPromo(false) });
    if (enStock) liste.push({ cle: "stock", label: "En stock", retirer: () => setEnStock(false) });
    return liste;
  }, [categories, prixMin, prixMax, promo, enStock]);

  const boutiqueVide = !chargementInitial && !erreur && !filtreActif && !enCours && resultats.length === 0;
  const afficherOutils = !chargementInitial && !erreur && !boutiqueVide;

  const titre = rechercheActive
    ? `Résultats pour « ${terme} »`
    : categories.length === 1 ? categories[0] : "Tous les produits";

  const boutonFiltres = (
    <button
      onClick={() => setTiroir(true)}
      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-[#12181B]/15 bg-white px-4 text-[13px] font-medium text-[#12181B] hover:bg-[#12181B]/5"
    >
      <SlidersHorizontal size={15} />
      Filtres
      {nombreActifs > 0 && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#12181B] px-1 text-[11px] text-white">
          {nombreActifs}
        </span>
      )}
    </button>
  );

  return (
    <div className={`${CONTENEUR} py-6 sm:py-10`}>
      {/* En-tête */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[24px] font-medium text-[#12181B] sm:text-[28px]">Catalogue</h1>
          {afficherOutils && !enCours && (
            <p className="mt-1 text-[13px] text-[#12181B]/50">
              {resultats.length} produit{resultats.length > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {afficherOutils && (
          <div className="relative w-full sm:w-80">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#12181B]/35" />
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un produit"
              aria-label="Rechercher un produit"
              className="h-11 w-full rounded-full border border-[#12181B]/10 bg-white pl-11 pr-10 text-[14px] text-[#12181B] placeholder:text-[#12181B]/35 focus:outline-none focus:ring-2 focus:ring-[#12181B]/20 [&::-webkit-search-cancel-button]:hidden"
            />
            {recherche && (
              <button
                onClick={() => setRecherche("")}
                aria-label="Effacer la recherche"
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#12181B]/40 hover:bg-[#12181B]/5 hover:text-[#12181B]"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Contenu */}
      {chargementInitial ? (
        <div className={GRILLE}>
          {[...Array(12)].map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}
        </div>
      ) : erreur ? (
        <EtatVide icone={Package} titre="Impossible de charger le catalogue" texte="Vérifie ta connexion et réessaie.">
          <button
            onClick={() => setEssai((n) => n + 1)}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-[#12181B] px-5 text-[13px] font-medium text-[#F6F7F2] hover:bg-[#12181B]/90"
          >
            <RotateCcw size={14} />
            Réessayer
          </button>
        </EtatVide>
      ) : boutiqueVide ? (
        <EtatVide icone={Package} titre="Aucun produit pour l'instant" texte="Repasse bientôt, la boutique vient de démarrer." />
      ) : (
        <>
          {/* Bouton Filtres (toujours visible) + pastilles de catégories */}
          <div className="mb-5 flex items-center gap-2">
            {boutonFiltres}
            {categoriesDispo.length > 0 && (
              <div className={`flex min-w-0 flex-1 gap-2 overflow-x-auto ${SANS_BARRE}`}>
                {[{ nom: "" }, ...categoriesDispo].map((c) => {
                  const actif = c.nom === "" ? categories.length === 0 : categories.includes(c.nom);
                  return (
                    <button
                      key={c.nom || "tout"}
                      onClick={() => (c.nom === "" ? setCategories([]) : basculerCategorie(c.nom))}
                      aria-pressed={actif}
                      className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
                        actif ? "bg-[#12181B] text-[#F6F7F2]" : "bg-[#12181B]/[0.05] text-[#12181B]/70 hover:bg-[#12181B]/10"
                      }`}
                    >
                      {c.nom || "Tout"}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-[18px] font-medium text-[#12181B] sm:text-[20px]">{titre}</h2>
              <div className="flex items-center gap-2">
                <label htmlFor="tri" className="text-[13px] text-[#12181B]/50">Trier par</label>
                <select
                  id="tri"
                  value={triEffectif}
                  onChange={(e) => setTri(e.target.value)}
                  className="h-10 rounded-full border border-[#12181B]/10 bg-white px-3 text-[13px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
                >
                  {TRIS.filter((t) => t.valeur !== "pertinence" || rechercheActive).map((t) => (
                    <option key={t.valeur} value={t.valeur}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {pastilles.length > 0 && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {pastilles.map((p) => (
                  <button
                    key={p.cle}
                    onClick={p.retirer}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#12181B]/[0.06] py-1 pl-3 pr-2 text-[12px] font-medium text-[#12181B]/80 hover:bg-[#12181B]/10"
                  >
                    {p.label} <X size={12} />
                  </button>
                ))}
                <button onClick={reinitialiserFiltres} className="px-2 text-[12px] font-medium text-[#12181B]/55 hover:text-[#12181B]">
                  Tout effacer
                </button>
              </div>
            )}

            {enCours ? (
              <div className={GRILLE}>
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}
              </div>
            ) : resultats.length === 0 ? (
              <EtatVide
                icone={SearchX}
                titre={rechercheActive ? `Aucun résultat pour « ${terme} »` : "Aucun produit ne correspond"}
                texte="Essaie avec un autre mot ou retire un filtre."
              >
                <button
                  onClick={reinitialiser}
                  className="mt-5 inline-flex h-10 items-center rounded-full border border-[#12181B]/15 px-5 text-[13px] font-medium text-[#12181B] hover:bg-[#12181B]/5"
                >
                  Tout afficher
                </button>
              </EtatVide>
            ) : (
              <div className={GRILLE}>
                {resultats.map((p) => <ProduitCarte key={p.id} produit={p} onQuickView={setProduitQuickView} />)}
              </div>
            )}
          </section>

          {rechercheActive && !enCours && (
            <SectionRecommandations produits={recommandations} onQuickView={setProduitQuickView} />
          )}
        </>
      )}

      {/* Tiroir de filtres */}
      {tiroir && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-[#12181B]/40" onClick={() => setTiroir(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-80 max-w-[88%] flex-col bg-white shadow-xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#12181B]/10 px-4">
              <p className="text-[15px] font-medium text-[#12181B]">Filtres</p>
              <button onClick={() => setTiroir(false)} aria-label="Fermer" className="rounded-lg p-1.5 text-[#12181B]/50 hover:bg-[#12181B]/5">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4">
              <PanneauFiltres categories={categoriesDispo} f={f} />
            </div>
            <div className="shrink-0 border-t border-[#12181B]/10 p-4">
              <button onClick={() => setTiroir(false)} className="h-11 w-full rounded-full bg-[#12181B] text-[14px] font-medium text-[#F6F7F2]">
                Voir les résultats
              </button>
            </div>
          </aside>
        </div>
      )}

      {produitQuickView && (
        <ProduitQuickView produit={produitQuickView} onFermer={() => setProduitQuickView(null)} />
      )}
    </div>
  );
}