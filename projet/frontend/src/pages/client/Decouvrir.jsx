import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, X, User, ShoppingBag, LogOut, ChevronDown, ChevronLeft, ChevronRight,
  Store, CheckCircle2, SearchX,
} from "lucide-react";
import { catalogueApi } from "../../api/catalogue";
import { useAuth } from "../../context/AuthContext";
import { ProduitCarteMarketplace } from "../../components/boutique/ProduitCarte";
import Skeleton from "../../components/ui/Skeleton";

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

/* ---------- Rangée défilante avec flèches ---------- */
function Rangee({ titre, sousTitre, produits }) {
  const ref = useRef(null);
  if (!produits?.length) return null;

  const defiler = (sens) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: sens * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[20px] font-medium text-[#12181B] sm:text-[22px]">{titre}</h2>
          {sousTitre && <p className="mt-0.5 text-[13px] text-[#12181B]/50">{sousTitre}</p>}
        </div>
        <div className="hidden gap-2 sm:flex">
          {[[-1, ChevronLeft, "Précédent"], [1, ChevronRight, "Suivant"]].map(([sens, Icone, label]) => (
            <button
              key={label}
              onClick={() => defiler(sens)}
              aria-label={label}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#12181B]/15 bg-white text-[#12181B]/70 transition-colors hover:bg-[#12181B]/5"
            >
              <Icone size={18} />
            </button>
          ))}
        </div>
      </div>
      <div ref={ref} className={`-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 sm:gap-4 ${SANS_BARRE}`}>
        {produits.map((p) => (
          <div key={p.id} className="w-[44%] shrink-0 snap-start sm:w-[30%] md:w-[23%] lg:w-[18%] xl:w-[15.5%]">
            <ProduitCarteMarketplace produit={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Boutiques à découvrir ---------- */
function Boutiques({ boutiques }) {
  if (!boutiques?.length) return null;
  return (
    <section className="mt-10">
      <h2 className="font-display text-[20px] font-medium text-[#12181B] sm:text-[22px]">Boutiques à découvrir</h2>
      <div className={`mt-4 flex gap-5 overflow-x-auto pb-2 ${SANS_BARRE}`}>
        {boutiques.map((b) => (
          <Link
            key={b.sous_domaine}
            to={`/boutique/${b.sous_domaine}`}
            className="group flex w-24 shrink-0 flex-col items-center text-center"
          >
            <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[#12181B]/10 bg-white shadow-sm transition-transform group-hover:scale-105">
              {b.logo ? (
                <img src={b.logo} alt="" className="h-full w-full object-cover" />
              ) : (
                <Store size={26} className="text-[#12181B]/35" />
              )}
            </span>
            <span className="mt-2 flex max-w-full items-center gap-1 text-[13px] font-medium text-[#12181B]">
              <span className="truncate">{b.nom}</span>
              {b.verifie && <CheckCircle2 size={13} className="shrink-0 text-[#0E7C66]" />}
            </span>
            <span className="text-[11px] text-[#12181B]/45">
              {b.nombre_produits} produit{b.nombre_produits > 1 ? "s" : ""}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------- Menu du compte ---------- */
function MenuCompte() {
  const { utilisateur, seDeconnecter } = useAuth();
  const navigate = useNavigate();
  const [ouvert, setOuvert] = useState(false);
  const conteneur = useRef(null);

  useEffect(() => {
    const fermer = (e) => conteneur.current && !conteneur.current.contains(e.target) && setOuvert(false);
    document.addEventListener("mousedown", fermer);
    return () => document.removeEventListener("mousedown", fermer);
  }, []);

  return (
    <div ref={conteneur} className="relative">
      <button
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-[#12181B]/10 bg-white px-3 text-[13px] font-medium text-[#12181B]/80 transition-colors hover:bg-[#12181B]/5"
      >
        <User size={17} />
        <span className="hidden max-w-[110px] truncate sm:inline">{utilisateur?.username || "Mon compte"}</span>
        <ChevronDown size={14} className={`transition-transform ${ouvert ? "rotate-180" : ""}`} />
      </button>
      {ouvert && (
        <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-[#12181B]/10 bg-white py-1.5 shadow-lg">
          <Link to="/mon-compte" className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-[#12181B]/80 hover:bg-[#12181B]/5">
            <User size={15} /> Mon profil
          </Link>
          <Link to="/mon-compte/commandes" className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-[#12181B]/80 hover:bg-[#12181B]/5">
            <ShoppingBag size={15} /> Mes commandes
          </Link>
          <button
            onClick={() => { seDeconnecter(); navigate("/"); }}
            className="flex w-full items-center gap-2.5 border-t border-[#12181B]/10 px-4 py-2.5 text-left text-[14px] text-red-600 hover:bg-red-50"
          >
            <LogOut size={15} /> Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Bandeau d'accueil avec drapeau de Madagascar ---------- */
function BandeauAccueil({ utilisateur, personnalise }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#12181B]/10 bg-[#FBFAF6] px-6 py-8 sm:px-10 sm:py-12">
      {/* Drapeau de Madagascar en filigrane */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex opacity-[0.22]">
        <div className="h-full w-1/3 bg-white" />
        <div className="flex h-full w-2/3 flex-col">
          <div className="h-1/2 w-full bg-[#FC3D32]" />
          <div className="h-1/2 w-full bg-[#007E49]" />
        </div>
      </div>

      <div className="relative">
        <p className="text-[13px] text-[#12181B]/60">
          Bonjour{utilisateur?.username ? ` ${utilisateur.username}` : ""}
        </p>
        <h1 className="mt-1 max-w-xl font-display text-[24px] font-medium leading-tight text-[#12181B] sm:text-[34px]">
          Découvrez les produits des boutiques de <span className="italic text-[#0E7C66]">Madagascar</span>
        </h1>
        <p className="mt-2 max-w-lg text-[14px] text-[#12181B]/65">
          {personnalise
            ? "Une sélection construite d'après ce que vous avez regardé et acheté."
            : "Parcourez les produits de toutes les boutiques au même endroit."}
        </p>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function Decouvrir() {
  const { utilisateur } = useAuth();
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState(false);

  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("");
  const [tri, setTri] = useState("pertinence");
  const [resultats, setResultats] = useState(null);
  const [enCours, setEnCours] = useState(false);

  const terme = recherche.trim();
  const filtreActif = terme.length >= 2 || categorie !== "";

  useEffect(() => {
    catalogueApi.decouvrir().then((res) => setDonnees(res.data)).catch(() => setErreur(true));
  }, []);

  useEffect(() => {
    if (!filtreActif) {
      setResultats(null);
      setEnCours(false);
      return;
    }
    let annule = false;
    setEnCours(true);
    const minuteur = setTimeout(() => {
      const params = { tri };
      if (terme.length >= 2) params.q = terme;
      if (categorie) params.categorie = categorie;
      catalogueApi
        .rechercherDecouvrir(params)
        .then((res) => !annule && setResultats(res.data.results || []))
        .catch(() => !annule && setResultats([]))
        .finally(() => !annule && setEnCours(false));
    }, 300);
    return () => {
      annule = true;
      clearTimeout(minuteur);
    };
  }, [terme, categorie, tri, filtreActif]);

  const reinitialiser = () => {
    setRecherche("");
    setCategorie("");
    setTri("pertinence");
  };

  const titreResultats = terme.length >= 2
    ? `Résultats pour « ${terme} »${categorie ? ` dans ${categorie}` : ""}`
    : categorie;

  return (
    <div className="min-h-screen bg-[#FBFAF6]">
      {/* En-tête collant */}
      <header className="sticky top-0 z-40 border-b border-[#12181B]/10 bg-white/95 backdrop-blur-md">
        <div className={`${CONTENEUR} flex h-16 items-center gap-3 sm:gap-6`}>
          <button onClick={reinitialiser} className="shrink-0 font-display text-[19px] font-medium text-[#12181B]">
            Varotra
          </button>

          <div className="relative min-w-0 flex-1 sm:mx-auto sm:max-w-2xl">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#12181B]/35" />
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un produit dans toutes les boutiques"
              aria-label="Rechercher un produit"
              className="h-11 w-full rounded-full border border-[#12181B]/10 bg-[#12181B]/[0.03] pl-11 pr-10 text-[14px] text-[#12181B] placeholder:text-[#12181B]/35 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#12181B]/20 [&::-webkit-search-cancel-button]:hidden"
            />
            {recherche && (
              <button
                onClick={() => setRecherche("")}
                aria-label="Effacer la recherche"
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#12181B]/40 hover:bg-[#12181B]/5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <MenuCompte />
        </div>

        {/* Barre de catégories */}
        {donnees?.categories?.length > 0 && (
          <div className="border-t border-[#12181B]/[0.06]">
            <div className={`${CONTENEUR} flex gap-2 overflow-x-auto py-2.5 ${SANS_BARRE}`}>
              {[{ nom: "", label: "Tout" }, ...donnees.categories.map((c) => ({ nom: c.nom, label: c.nom }))].map((c) => {
                const actif = categorie === c.nom;
                return (
                  <button
                    key={c.label}
                    onClick={() => setCategorie(c.nom)}
                    aria-pressed={actif}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
                      actif ? "bg-[#12181B] text-[#F6F7F2]" : "bg-[#12181B]/[0.05] text-[#12181B]/70 hover:bg-[#12181B]/10"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <main className={`${CONTENEUR} pb-16 pt-6`}>
        {erreur ? (
          <p className="py-20 text-center text-[14px] text-[#12181B]/60">Impossible de charger les produits.</p>
        ) : !donnees ? (
          <div className={GRILLE}>
            {[...Array(12)].map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}
          </div>
        ) : filtreActif ? (
          /* ----- Mode résultats ----- */
          <section>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-[20px] font-medium text-[#12181B] sm:text-[24px]">{titreResultats}</h1>
                {!enCours && resultats && (
                  <p className="mt-0.5 text-[13px] text-[#12181B]/50">
                    {resultats.length} produit{resultats.length > 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="tri" className="text-[13px] text-[#12181B]/50">Trier par</label>
                <select
                  id="tri"
                  value={tri}
                  onChange={(e) => setTri(e.target.value)}
                  className="h-10 rounded-full border border-[#12181B]/10 bg-white px-3 text-[13px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
                >
                  {TRIS.filter((t) => t.valeur !== "pertinence" || terme.length >= 2).map((t) => (
                    <option key={t.valeur} value={t.valeur}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {enCours || resultats === null ? (
              <div className={GRILLE}>
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}
              </div>
            ) : resultats.length === 0 ? (
              <div className="mx-auto flex max-w-sm flex-col items-center py-20 text-center">
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#12181B]/5">
                  <SearchX size={24} className="text-[#12181B]/35" />
                </span>
                <p className="text-[15px] font-medium text-[#12181B]">Aucun résultat</p>
                <p className="mt-1 text-[13px] text-[#12181B]/50">Essaie avec un autre mot ou une autre catégorie.</p>
                <button
                  onClick={reinitialiser}
                  className="mt-5 h-10 rounded-full border border-[#12181B]/15 px-5 text-[13px] font-medium text-[#12181B] hover:bg-[#12181B]/5"
                >
                  Tout afficher
                </button>
              </div>
            ) : (
              <div className={GRILLE}>
                {resultats.map((p) => <ProduitCarteMarketplace key={p.id} produit={p} />)}
              </div>
            )}
          </section>
        ) : (
          /* ----- Mode accueil ----- */
          <>
            <BandeauAccueil utilisateur={utilisateur} personnalise={donnees.personnalise} />

            <Rangee
              titre={donnees.personnalise ? "Pour vous" : "Sélection du moment"}
              sousTitre={donnees.personnalise ? "Basé sur ce que vous avez regardé ou acheté" : "Les produits les plus appréciés"}
              produits={donnees.pour_vous}
            />
            <Rangee titre="Promotions" sousTitre="Des prix réduits en ce moment" produits={donnees.promotions} />
            <Boutiques boutiques={donnees.boutiques} />
            <Rangee titre="Nouveautés" produits={donnees.nouveautes} />
            <Rangee titre="Les plus vendus" produits={donnees.populaires} />
          </>
        )}
      </main>
    </div>
  );
}