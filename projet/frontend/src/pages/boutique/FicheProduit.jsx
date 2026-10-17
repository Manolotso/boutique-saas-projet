import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Package, ArrowLeftRight, ChevronDown, ChevronLeft, ChevronRight,
  Minus, Plus, Check, Truck,
} from "lucide-react";
import { catalogueApi } from "../../api/catalogue";
import { useBoutiquePublique } from "../../context/BoutiquePubliqueContext";
import Skeleton from "../../components/ui/Skeleton";
import { formaterPrixAriary } from "../../api/formatage";
import { paiementsApi } from "../../api/paiements";
import { usePanier } from "../../context/PanierContext";
import { useToast } from "../../context/ToastContext";
import { enregistrerEvenement } from "../../api/suivi";
import ProduitsSimilaires from "../../components/boutique/ProduitsSimilaires";

// Même largeur que le header, l'accueil, le catalogue et le footer
const CONTENEUR = "w-full px-4 sm:px-6 lg:px-8 2xl:px-12";

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
      setTaux(await obtenirTauxChange());
    } catch {
      setErreur(true);
    } finally {
      setChargement(false);
    }
  };

  const devisesDisponibles = taux ? Object.keys(taux).sort() : [];
  const montantConverti = taux?.[deviseCible] ? montantAriary * taux[deviseCible] : null;

  return (
    <div className="mt-3">
      <button
        onClick={ouvrirConvertisseur}
        aria-expanded={ouvert}
        className="inline-flex items-center gap-1.5 text-[13px] text-[#12181B]/55 transition-colors hover:text-[#12181B]"
      >
        <ArrowLeftRight size={13} />
        Voir en autre devise
        <ChevronDown size={13} className={`transition-transform ${ouvert ? "rotate-180" : ""}`} />
      </button>

      {ouvert && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {chargement && <p className="text-[12px] text-[#12181B]/45">Chargement des taux…</p>}
          {erreur && <p className="text-[12px] text-[#12181B]/45">Conversion indisponible pour l'instant.</p>}
          {taux && (
            <>
              <select
                value={deviseCible}
                onChange={(e) => setDeviseCible(e.target.value)}
                aria-label="Devise"
                className="h-9 rounded-full border border-[#12181B]/10 bg-white px-3 text-[13px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
              >
                {devisesDisponibles.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              {montantConverti !== null && (
                <span className="text-[14px] font-medium text-[#12181B]/80">
                  ≈ {formaterMontantDevise(montantConverti, deviseCible)}
                </span>
              )}
            </>
          )}
        </div>
      )}

      <p className="mt-1.5 text-[11px] text-[#12181B]/40">
        Conversion indicative. Le paiement se fait uniquement en Ariary.
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
  const departTouche = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setChargement(true);
    setChargement(true);
    setErreur(false);
    setImageActive(0);
    setVarianteChoisie(null);
    setQuantite(1);
    catalogueApi
      .obtenirProduitPublic(sousDomaine, slug)
      .then((res) => setProduit(res.data))
      .catch(() => setErreur(true))
      .finally(() => setChargement(false));
  }, [sousDomaine, slug]);

  // Flèches du clavier ← → (hook placé avant les return anticipés)
  const nbImages = produit?.images?.length || 0;
  useEffect(() => {
    if (nbImages < 2) return;
    const onKey = (e) => {
      // Ne pas intercepter les flèches dans un champ ou le sélecteur de devise
      if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "ArrowLeft") setImageActive((i) => (i - 1 + nbImages) % nbImages);
      if (e.key === "ArrowRight") setImageActive((i) => (i + 1) % nbImages);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nbImages]);

    useEffect(() => {
    if (produit?.id) enregistrerEvenement(sousDomaine, { type: "vue", produit_id: produit.id });
  }, [produit?.id, sousDomaine]);

  if (chargement) {
    return (
      <div className={`${CONTENEUR} py-6 sm:py-10`}>
        <div className="mb-6 h-4 w-48 animate-pulse rounded-full bg-[#12181B]/10" />
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="space-y-3">
            <div className="h-3 w-20 animate-pulse rounded-full bg-[#12181B]/10" />
            <div className="h-8 w-3/4 animate-pulse rounded-full bg-[#12181B]/10" />
            <div className="mt-2 h-7 w-36 animate-pulse rounded-full bg-[#12181B]/10" />
            <div className="mt-6 h-12 w-full animate-pulse rounded-full bg-[#12181B]/10" />
          </div>
        </div>
      </div>
    );
  }

  if (erreur || !produit) {
    return (
      <div className={`${CONTENEUR} flex justify-center py-16`}>
        <div className="w-full max-w-sm rounded-3xl border border-[#12181B]/10 bg-white p-10 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#12181B]/5">
            <Package size={22} className="text-[#12181B]/40" />
          </span>
          <p className="mt-4 text-[14px] text-[#12181B]/60">
            {erreur ? "Impossible de charger ce produit." : "Ce produit n'existe pas ou n'est plus disponible."}
          </p>
          <Link
            to={`/boutique/${sousDomaine}/catalogue`}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-[#12181B] px-5 text-[13px] font-medium text-[#F6F7F2] transition-colors hover:bg-[#12181B]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12181B]"
          >
            Retour au catalogue
          </Link>
        </div>
      </div>
    );
  }

  const images = produit.images?.length ? produit.images : [null];
  const aPlusieursImages = images.length > 1;
  const imageSuivante = () => setImageActive((i) => (i + 1) % images.length);
  const imagePrecedente = () => setImageActive((i) => (i - 1 + images.length) % images.length);

  // Balayage du doigt sur mobile
  const debutToucher = (e) => {
    departTouche.current = e.touches[0].clientX;
  };
  const finToucher = (e) => {
    if (departTouche.current === null) return;
    const ecart = e.changedTouches[0].clientX - departTouche.current;
    departTouche.current = null;
    if (Math.abs(ecart) < 50) return; // simple tap, pas un balayage
    if (ecart < 0) imageSuivante();
    else imagePrecedente();
  };

  const enPromo = produit.prix_promo && Number(produit.prix_actuel) < Number(produit.prix);
  const pourcentagePromo = enPromo
    ? Math.round((1 - Number(produit.prix_actuel) / Number(produit.prix)) * 100)
    : 0;

  const aVariantes = produit.variantes?.length > 0;
  const optionAChoisir = aVariantes && !varianteChoisie;
  const stockEffectif = varianteChoisie ? varianteChoisie.stock : produit.stock;
  const stockBas = !optionAChoisir && stockEffectif > 0 && stockEffectif <= 5;

  const choisirVariante = (v) => {
    setVarianteChoisie(v);
    setQuantite((q) => Math.max(1, Math.min(q, v.stock)));
  };

  const gererIncrement = () => {
    if (quantite >= stockEffectif) {
      notifier(`Stock maximum atteint (${stockEffectif} disponible${stockEffectif > 1 ? "s" : ""}).`, "info");
      return;
    }
    setQuantite(quantite + 1);
  };

  const ajouterAuPanier = () => {
    const resultat = ajouterArticle(produit, varianteChoisie, quantite);
    setQuantite(1);
    if (resultat.limitee) {
      notifier(`Quantité limitée au stock disponible (${resultat.stockDisponible}).`, "info");
    } else {
      notifier("Ajouté au panier.");
    }
  };

  return (
    <div className={`${CONTENEUR} py-6 sm:py-10`}>
      {/* Fil d'Ariane */}
      <nav aria-label="Fil d'Ariane" className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] text-[#12181B]/45">
        <Link to={`/boutique/${sousDomaine}`} className="transition-colors hover:text-[#12181B]">Accueil</Link>
        <ChevronRight size={13} />
        <Link to={`/boutique/${sousDomaine}/catalogue`} className="transition-colors hover:text-[#12181B]">Catalogue</Link>
        <ChevronRight size={13} />
        <span className="max-w-[220px] truncate text-[#12181B]/70">{produit.nom}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Galerie (reste visible pendant le défilement sur ordinateur) */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          {/* Image principale : suit la taille réelle de l'image */}
          <div
            className="relative select-none overflow-hidden rounded-2xl border border-[#12181B]/10 bg-white"
            onTouchStart={debutToucher}
            onTouchEnd={finToucher}
          >
            {images[imageActive] ? (
              <img
                src={images[imageActive].image}
                alt={produit.nom}
                draggable={false}
                className="mx-auto block h-auto max-h-[75vh] w-full object-contain"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center">
                <Package size={48} className="text-[#12181B]/20" />
              </div>
            )}

            {enPromo && (
              <span className="absolute left-3 top-3 z-10 rounded-full bg-red-600 px-3 py-1 text-[12px] font-medium text-white">
                -{pourcentagePromo}%
              </span>
            )}

            {aPlusieursImages && (
              <>
                {/* Zone cliquable à gauche */}
                <button
                  onClick={imagePrecedente}
                  aria-label="Image précédente"
                  className="group absolute inset-y-0 left-0 flex w-1/3 cursor-pointer items-center justify-start pl-3 focus-visible:outline-none"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#12181B] shadow transition-opacity group-hover:opacity-100 group-focus-visible:ring-2 group-focus-visible:ring-[#12181B] md:opacity-0">
                    <ChevronLeft size={20} />
                  </span>
                </button>

                {/* Zone cliquable à droite */}
                <button
                  onClick={imageSuivante}
                  aria-label="Image suivante"
                  className="group absolute inset-y-0 right-0 flex w-1/3 cursor-pointer items-center justify-end pr-3 focus-visible:outline-none"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#12181B] shadow transition-opacity group-hover:opacity-100 group-focus-visible:ring-2 group-focus-visible:ring-[#12181B] md:opacity-0">
                    <ChevronRight size={20} />
                  </span>
                </button>

                {/* Compteur */}
                <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-[#12181B]/70 px-2.5 py-1 text-[12px] font-medium text-white">
                  {imageActive + 1} / {images.length}
                </span>
              </>
            )}
          </div>

          {/* Miniatures */}
          {aPlusieursImages && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={img?.id || i}
                  onClick={() => setImageActive(i)}
                  aria-label={`Voir l'image ${i + 1}`}
                  aria-current={i === imageActive}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-all ${
                    i === imageActive
                      ? "border-[var(--boutique-primary,#12181B)]"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img.image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informations et achat */}
        <div className="min-w-0">
          {produit.categorie_nom && (
            <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-[#12181B]/45">
              {produit.categorie_nom}
            </p>
          )}
          <h1 className="font-display text-[26px] font-medium leading-tight text-[#12181B] sm:text-[32px]">
            {produit.nom}
          </h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-[26px] font-medium text-[#12181B]">
              {formaterPrixAriary(produit.prix_actuel)}
            </span>
            {enPromo && (
              <span className="text-[16px] text-[#12181B]/40 line-through">
                {formaterPrixAriary(produit.prix)}
              </span>
            )}
          </div>

          <ConvertisseurDevise montantAriary={Number(produit.prix_actuel)} />

          <hr className="my-6 border-[#12181B]/10" />

          {/* Options */}
          {aVariantes && (
            <div className="mb-6">
              <p className="mb-2.5 text-[13px] font-medium text-[#12181B]/70">
                Option
                {varianteChoisie && (
                  <span className="ml-2 font-normal text-[#12181B]/50">
                    {[varianteChoisie.taille, varianteChoisie.couleur].filter(Boolean).join(" / ")}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {produit.variantes.map((v) => {
                  const label = [v.taille, v.couleur].filter(Boolean).join(" / ");
                  const selectionnee = varianteChoisie?.id === v.id;
                  const epuisee = v.stock === 0;
                  return (
                    <button
                      key={v.id}
                      onClick={() => choisirVariante(v)}
                      disabled={epuisee}
                      aria-pressed={selectionnee}
                      className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-4 py-2 text-[14px] transition-colors ${
                        selectionnee
                          ? "border-[var(--boutique-primary,#12181B)] bg-[#12181B]/[0.04] font-medium text-[#12181B]"
                          : "border-[#12181B]/15 text-[#12181B]/80 hover:border-[#12181B]/40"
                      } ${epuisee ? "cursor-not-allowed opacity-40" : ""}`}
                    >
                      {selectionnee && <Check size={14} />}
                      <span className={epuisee ? "line-through" : ""}>{label}</span>
                      {epuisee && <span className="text-[11px]">(épuisé)</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock */}
          {produit.en_stock ? (
            !optionAChoisir && (
              <p className={`mb-4 flex items-center gap-2 text-[13px] font-medium ${stockBas ? "text-amber-600" : "text-emerald-600"}`}>
                <span className={`h-2 w-2 rounded-full ${stockBas ? "bg-amber-500" : "bg-emerald-500"}`} />
                {stockBas ? `Plus que ${stockEffectif} en stock` : "En stock"}
              </p>
            )
          ) : (
            <p className="mb-4 rounded-xl bg-[#12181B]/[0.04] px-4 py-3 text-[14px] text-[#12181B]/60">
              Ce produit est momentanément indisponible.
            </p>
          )}

          {/* Quantité + ajout au panier */}
          {produit.en_stock && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex h-12 items-center self-start rounded-full border border-[#12181B]/15 bg-white">
                <button
                  onClick={() => setQuantite((q) => Math.max(1, q - 1))}
                  disabled={quantite <= 1}
                  aria-label="Diminuer la quantité"
                  className="flex h-12 w-12 items-center justify-center text-[#12181B]/60 transition-colors hover:text-[#12181B] disabled:opacity-30"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center text-[15px] font-medium text-[#12181B]" aria-live="polite">
                  {quantite}
                </span>
                <button
                  onClick={gererIncrement}
                  aria-label="Augmenter la quantité"
                  className="flex h-12 w-12 items-center justify-center text-[#12181B]/60 transition-colors hover:text-[#12181B]"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                onClick={ajouterAuPanier}
                disabled={optionAChoisir}
                className="h-12 flex-1 rounded-full bg-[var(--boutique-primary,#12181B)] px-6 text-[15px] font-medium text-[#F6F7F2] transition-colors hover:bg-[var(--boutique-accent,#0E7C66)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12181B] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {optionAChoisir ? "Choisis une option" : "Ajouter au panier"}
              </button>
            </div>
          )}

          {/* Livraison */}
          {boutique?.livraison_active && (
            <p className="mt-5 flex items-center gap-2.5 rounded-xl bg-[#12181B]/[0.03] px-4 py-3 text-[13px] text-[#12181B]/70">
              <Truck size={16} className="shrink-0 text-[#12181B]/50" />
              Livraison à domicile disponible. Les frais sont calculés au moment de la commande.
            </p>
          )}

          {/* Description */}
          {produit.description && (
            <section className="mt-8">
              <h2 className="mb-2 text-[15px] font-medium text-[#12181B]">Description</h2>
              <p className="whitespace-pre-line text-[14px] leading-relaxed text-[#12181B]/70 sm:text-[15px]">
                {produit.description}
              </p>
            </section>
          )}
        </div>
      </div>
      <ProduitsSimilaires sousDomaine={sousDomaine} slug={produit.slug} />
    </div>
  );
}