import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Package, ArrowLeft, ArrowLeftRight, ChevronDown } from "lucide-react";
import { catalogueApi } from "../../api/catalogue";
import { useBoutiquePublique } from "../../context/BoutiquePubliqueContext";
import Skeleton from "../../components/ui/Skeleton";
import { formaterPrixAriary } from "../../api/formatage";
import { paiementsApi } from "../../api/paiements"
import { usePanier } from "../../context/PanierContext";
import { useToast } from "../../context/ToastContext";

const CLE_CACHE_TAUX = "tauxChangeMGA";
const DUREE_CACHE_MS = 24 * 60 * 60 * 1000; // 24h — les taux ne bougent pas assez vite pour re-fetcher plus souvent

async function obtenirTauxChange() {
  const reponse = await paiementsApi.obtenirTauxChange();
  return reponse.data.taux;
}

function formaterMontantDevise(montant, codeDevise) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: codeDevise }).format(montant);
  } catch {
    return `${montant.toFixed(2)} ${codeDevise}`;
  }
}



function ConvertisseurDevise({ montantAriary }) {
  const [ouvert, setOuvert] = useState(false);
  const [taux, setTaux] = useState(null);
  const [deviseCible, setDeviseCible] = useState("USD");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(false);


  

  const ouvrirConvertisseur = async () => {
    setOuvert((v) => !v);
    if (taux || chargement) return;
    setChargement(true);
    setErreur(false);
    try {
      const resultat = await obtenirTauxChange();
      setTaux(resultat);
    } catch {
      setErreur(true);
    } finally {
      setChargement(false);
    }
  };

  const devisesDisponibles = taux ? Object.keys(taux).sort() : [];
  const montantConverti = taux?.[deviseCible] ? montantAriary * taux[deviseCible] : null;

  return (
    <div className="mt-2">
      <button
        onClick={ouvrirConvertisseur}
        className="inline-flex items-center gap-1.5 text-[12px] text-[#12181B]/50 hover:text-[#12181B] transition-colors"
      >
        <ArrowLeftRight size={12} />
        Voir en autre devise
        <ChevronDown size={12} className={`transition-transform ${ouvert ? "rotate-180" : ""}`} />
      </button>

      {ouvert && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {chargement && <p className="text-[12px] text-[#12181B]/40">Chargement des taux…</p>}

          {erreur && <p className="text-[12px] text-[#12181B]/40">Conversion indisponible pour l'instant.</p>}

          {taux && (
            <>
              <select
                value={deviseCible}
                onChange={(e) => setDeviseCible(e.target.value)}
                className="h-8 rounded-full border border-[#12181B]/10 bg-white text-[12px] text-[#12181B] px-3 focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
              >
                {devisesDisponibles.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
              {montantConverti !== null && (
                <span className="text-[13px] text-[#12181B]/70">
                  ≈ {formaterMontantDevise(montantConverti, deviseCible)}
                </span>
              )}
            </>
          )}
        </div>
      )}

      <p className="text-[11px] text-[#12181B]/30 mt-1">
        Conversion indicative — le paiement se fait uniquement en Ariary.
      </p>
    </div>
  );
}

export default function FicheProduit() {
  const { slug } = useParams();
  const { sousDomaine, boutique } = useBoutiquePublique();
  const [produit, setProduit] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(false);
  const [imageActive, setImageActive] = useState(0);
  const { ajouterArticle } = usePanier();
  const [varianteChoisie, setVarianteChoisie] = useState(null);
  const [quantite, setQuantite] = useState(1);
  const { notifier } = useToast();

  useEffect(() => {
    setChargement(true);
    setErreur(false);
    catalogueApi
      .obtenirProduitPublic(sousDomaine, slug)
      .then((res) => setProduit(res.data))
      .catch(() => setErreur(true))
      .finally(() => setChargement(false));
  }, [sousDomaine, slug]);

  if (chargement) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="h-4 w-40 rounded-full bg-[#12181B]/8 animate-pulse mb-6" />
        <div className="grid md:grid-cols-2 gap-10">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="space-y-3">
            <div className="h-3 w-20 rounded-full bg-[#12181B]/8 animate-pulse" />
            <div className="h-7 w-3/4 rounded-full bg-[#12181B]/8 animate-pulse" />
            <div className="h-6 w-32 rounded-full bg-[#12181B]/8 animate-pulse mt-2" />
            <div className="h-11 w-40 rounded-full bg-[#12181B]/8 animate-pulse mt-6" />
          </div>
        </div>
      </div>
    );
  }

  if (erreur || !produit) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 flex justify-center">
        <div className="max-w-sm w-full text-center rounded-3xl border border-[#12181B]/10 bg-white shadow-sm p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#12181B]/5">
            <Package size={22} className="text-[#12181B]/40" />
          </span>
          <p className="text-[14px] text-[#12181B]/60 mt-4">
            {erreur ? "Impossible de charger ce produit." : "Ce produit n'existe pas ou n'est plus disponible."}
          </p>
          <Link
            to={`/boutique/${sousDomaine}`}
            className="inline-flex items-center justify-center mt-6 h-10 px-5 rounded-full bg-[#12181B] text-[#F6F7F2] text-[13px] font-medium hover:bg-[#12181B]/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12181B]"
          >
            Retour à la boutique
          </Link>
        </div>
      </div>
    );
  }

  const images = produit.images?.length ? produit.images : [null];
  const enPromo = produit.prix_promo && Number(produit.prix_actuel) < Number(produit.prix);
  const stockEffectif = varianteChoisie ? varianteChoisie.stock : produit.stock;

  const gererIncrement = () => {
  if (quantite >= stockEffectif) {
    notifier(`Stock maximum atteint (${stockEffectif} disponible${stockEffectif > 1 ? "s" : ""}).`, "info");
    return;
  }
  setQuantite(quantite + 1);
};

  

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <nav className="flex items-center gap-1.5 text-[13px] text-[#12181B]/40 mb-6 flex-wrap">
        <Link to={`/boutique/${sousDomaine}`} className="hover:text-[#12181B]/70 transition-colors">
          Accueil
        </Link>
        <span>/</span>
        <Link to={`/boutique/${sousDomaine}/catalogue`} className="hover:text-[#12181B]/70 transition-colors">
          Catalogue
        </Link>
        <span>/</span>
        <span className="text-[#12181B]/60 truncate max-w-[200px]">{produit.nom}</span>
      </nav>

      <Link
        to={`/boutique/${sousDomaine}/catalogue`}
        className="flex items-center gap-1 text-[13px] text-[#12181B]/50 hover:text-[#12181B] mb-6 md:hidden"
      >
        <ArrowLeft size={14} /> Retour au catalogue
      </Link>

      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <div className="aspect-square bg-[#12181B]/[0.04] rounded-xl overflow-hidden flex items-center justify-center">
            {images[imageActive] ? (
              <img src={images[imageActive].image} alt={produit.nom} className="h-full w-full object-cover" />
            ) : (
              <Package size={40} className="text-[#12181B]/20" />
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3">
              {images.map((img, i) => (
                <button
                  key={img?.id || i}
                  onClick={() => setImageActive(i)}
                  aria-label={`Voir l'image ${i + 1}`}
                  className={`h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === imageActive ? "border-[var(--boutique-primary,#12181B)]" : "border-transparent"
                  }`}
                >
                  <img src={img.image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {produit.categorie_nom && (
            <p className="text-[12px] font-medium text-[#12181B]/40 uppercase tracking-wide mb-1.5">
              {produit.categorie_nom}
            </p>
          )}
          <h1 className="font-display text-[24px] font-medium text-[#12181B]">{produit.nom}</h1>

          <div className="flex items-center gap-2.5 mt-3">
            <span className="text-[20px] font-medium text-[#12181B]">
              {formaterPrixAriary(produit.prix_actuel)}
            </span>
            {enPromo && (
              <span className="text-[15px] text-[#12181B]/40 line-through">
                {formaterPrixAriary(produit.prix)}
              </span>
            )}
          </div>

          <ConvertisseurDevise montantAriary={Number(produit.prix_actuel)} />

          {produit.variantes?.length > 0 && (
  <div className="mt-5">
    <p className="text-[13px] font-medium text-[#12181B]/70 mb-2">Choisir une option</p>
    <div className="flex flex-wrap gap-2">
      {produit.variantes.map((v) => {
        const label = [v.taille, v.couleur].filter(Boolean).join(" / ");
        const selectionnee = varianteChoisie?.id === v.id;
        return (
          <button
            key={v.id}
            onClick={() => setVarianteChoisie(v)}
            disabled={v.stock === 0}
            className={`text-[13px] rounded-lg border px-3.5 py-2 transition-colors ${
              selectionnee
                ? "border-[var(--boutique-primary,#12181B)] bg-[#12181B]/[0.03]"
                : "border-[#12181B]/10 hover:bg-[#12181B]/[0.02]"
            } ${v.stock === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            {label} {v.stock === 0 && "(épuisé)"}
          </button>
        );
      })}
    </div>
  </div>
)}

{produit.en_stock && (
  <p className="text-[12px] text-emerald-600 font-medium mt-4">
    {stockEffectif <= 5 ? `Plus que ${stockEffectif} en stock` : "En stock"}
  </p>
)}

{produit.en_stock && (
  <div className="flex items-center gap-3 mt-6">
    <div className="flex items-center border border-[#12181B]/10 rounded-full">
      <button onClick={() => setQuantite((q) => Math.max(1, q - 1))} className="w-9 h-9 text-[#12181B]/60 hover:text-[#12181B]">−</button>
      <span className="w-8 text-center text-[14px] text-[#12181B]">{quantite}</span>
      <button onClick={gererIncrement} className="w-9 h-9 text-[#12181B]/60 hover:text-[#12181B]">+</button>
    </div>

    <button
      onClick={() => {
  const resultat = ajouterArticle(produit, varianteChoisie, quantite);
  setQuantite(1);
  if (resultat.limitee) {
    notifier(`Quantité limitée au stock disponible (${resultat.stockDisponible}).`, "info");
  } else {
    notifier("Ajouté au panier.");
  }
}}
      disabled={produit.variantes?.length > 0 && !varianteChoisie}
      className="flex-1 rounded-full bg-[var(--boutique-primary,#12181B)] text-[#F6F7F2] text-[14px] font-medium px-6 py-3 hover:bg-[var(--boutique-accent,#0E7C66)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      Ajouter au panier
    </button>
  </div>
)}

          {produit.description && (
            <p className="text-[14px] text-[#12181B]/70 mt-6 leading-relaxed">{produit.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}