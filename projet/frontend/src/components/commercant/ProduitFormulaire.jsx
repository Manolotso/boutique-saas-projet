import { useState } from "react";
import { X, ChevronRight, ChevronLeft, TrendingUp, TrendingDown } from "lucide-react";
import { catalogueApi } from "../../api/catalogue";
import apiClient from "../../api/client";
import GeminiIcon from "../../assets/icons/google-gemini.svg";
import GalerieProduit from "./GalerieProduit";

// Convertit une date ISO (venant de l'API) au format attendu par <input type="datetime-local">
function formatDateInput(dateISO) {
  if (!dateISO) return "";
  const d = new Date(dateISO);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Métadonnées des options avancées : titre + description affichés dans le menu et l'en-tête de détail
const OPTIONS_AVANCEES = {
  tarification: { titre: "Tarification", description: "Prix promotionnel et fenêtre de validité" },
  identite: { titre: "Identité", description: "Catégorie, marque et étiquettes" },
  stock: { titre: "Stock avancé", description: "Référence, suivi de stock et poids" },
  seo: { titre: "SEO", description: "Comment ton produit apparaît sur Google" },
  galerie: { titre: "Galerie", description: "Photos du produit" },
};

export default function ProduitFormulaire({ produit, categories = [], onSauvegarde }) {
  const estEdition = Boolean(produit);

  // --- Navigation interne : 'principal' | 'menu' | 'tarification' | 'identite' | 'stock' | 'seo' | 'galerie' | 'galerie-post-creation' ---
  const [vue, setVue] = useState("principal");

  // --- Champs essentiels (toujours visibles) ---
  const [nom, setNom] = useState(produit?.nom || "");
  const [description, setDescription] = useState(produit?.description || "");
  const [prix, setPrix] = useState(produit?.prix || "");
  const [stock, setStock] = useState(produit?.stock ?? 0);

  // --- Groupe Identité ---
  const [categorie, setCategorie] = useState(produit?.categorie || "");
  const [marque, setMarque] = useState(produit?.marque || "");
  const [tags, setTags] = useState(produit?.tags || []);
  const [saisieTag, setSaisieTag] = useState("");

  // --- Groupe Tarification ---
  const [prixPromo, setPrixPromo] = useState(produit?.prix_promo || "");
  const [promoDebut, setPromoDebut] = useState(formatDateInput(produit?.promo_debut));
  const [promoFin, setPromoFin] = useState(formatDateInput(produit?.promo_fin));
  const [prixAchat, setPrixAchat] = useState(produit?.prix_achat || "");

  // --- Groupe Stock avancé ---
  const [sku, setSku] = useState(produit?.sku || "");
  const [gestionStock, setGestionStock] = useState(produit?.gestion_stock ?? true);
  const [seuilAlerteStock, setSeuilAlerteStock] = useState(produit?.seuil_alerte_stock ?? 5);
  const [poids, setPoids] = useState(produit?.poids || "");

  // --- Statut & visibilité (toujours visible) ---
  const [statut, setStatut] = useState(produit?.statut || "brouillon");
  const [estMisEnAvant, setEstMisEnAvant] = useState(produit?.est_mis_en_avant ?? false);

  // --- Groupe SEO ---
  const [metaDescription, setMetaDescription] = useState(produit?.meta_description || "");

  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);

  // --- IA générative --
  const [isGenerating, setIsGenerating] = useState(false);

  // Rempli uniquement après la création réussie d'un NOUVEAU produit,
  // pour pouvoir afficher l'étape "Ajoute des photos" avec un id valide.
  const [produitCree, setProduitCree] = useState(null);
  const [imagesAjoutees, setImagesAjoutees] = useState([]);

  // Indique si une option contient déjà des données, pour afficher un repère visuel dans le menu
  const optionEstRemplie = {
    tarification: Boolean(prixPromo || prixAchat),
    identite: Boolean(categorie || marque || tags.length > 0),
    stock: Boolean(sku || poids || !gestionStock),
    seo: Boolean(metaDescription),
    galerie: Boolean(produit?.images?.length),
  };

  const ajouterTag = (e) => {
    e.preventDefault();
    const valeur = saisieTag.trim();
    if (!valeur || tags.includes(valeur)) {
      setSaisieTag("");
      return;
    }
    setTags([...tags, valeur]);
    setSaisieTag("");
  };

  const retirerTag = (tagASupprimer) => {
    setTags(tags.filter((t) => t !== tagASupprimer));
  };

  // Retour : d'un détail -> menu ; du menu -> formulaire principal
  const retour = () => {
    if (vue === "menu") {
      setVue("principal");
    } else {
      setVue("menu");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      const donnees = {
        nom,
        description,
        prix,
        stock,
        categorie: categorie || null,
        marque,
        tags,
        prix_promo: prixPromo || null,
        promo_debut: prixPromo && promoDebut ? promoDebut : null,
        promo_fin: prixPromo && promoFin ? promoFin : null,
        prix_achat: prixAchat || null,
        sku,
        gestion_stock: gestionStock,
        seuil_alerte_stock: gestionStock ? seuilAlerteStock : null,
        poids: poids || null,
        statut,
        est_mis_en_avant: estMisEnAvant,
        meta_description: metaDescription,
      };
      const response = estEdition
        ? await catalogueApi.modifierProduit(produit.id, donnees)
        : await catalogueApi.creerProduit(donnees);

      if (estEdition) {
        onSauvegarde(response.data);
      } else {
        // Le produit existe maintenant en base (il a un id) : on peut proposer la galerie.
        setProduitCree(response.data);
        setVue("galerie-post-creation");
      }
    } catch (err) {
      const messages = err.response?.data;
      const premierMessage = messages ? Object.values(messages)[0] : null;
      setErreur(
        Array.isArray(premierMessage) ? premierMessage[0] : premierMessage || "Une erreur est survenue."
      );
    } finally {
      setChargement(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20";
  const labelClass = "block text-[13px] font-medium text-[#12181B]/70";

  // --- IA générative : génération de description ---

const genererDescriptionIA = async () => {
  if (!nom) {
    alert("Merci de renseigner le nom du produit d'abord.");
    return;
  }

  setIsGenerating(true);
  try {
    const response = await apiClient.post("/api/catalogue/generate-description/", { nom });
    setDescription(response.data.description);
  } catch (error) {
    console.error(error);
    alert("Impossible de générer la description pour le moment.");
  } finally {
    setIsGenerating(false);
  }
};

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* --- En-tête --- */}
      <div>
        {vue === "principal" && (
          <h2 className="font-display text-[20px] font-medium text-[#12181B]">
            {estEdition ? "Modifier le produit" : "Nouveau produit"}
          </h2>
        )}
        {vue === "galerie-post-creation" && (
          <div>
            <h2 className="font-display text-[20px] font-medium text-[#12181B]">Produit créé 🎉</h2>
            <p className="text-[13px] text-[#12181B]/50 mt-0.5">Ajoute quelques photos pour finaliser.</p>
          </div>
        )}
        {vue !== "principal" && vue !== "galerie-post-creation" && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={retour}
              className="flex items-center gap-1 text-[13px] font-medium text-[#12181B]/60 hover:text-[#12181B] transition-colors duration-200 -ml-1 px-1 py-1 rounded-lg hover:bg-[#12181B]/5"
            >
              <ChevronLeft size={16} />
              Retour
            </button>
            <span className="text-[#12181B]/20">/</span>
            <h2 className="font-display text-[16px] font-medium text-[#12181B]">
              {vue === "menu" ? "Options avancées" : OPTIONS_AVANCEES[vue].titre}
            </h2>
          </div>
        )}
      </div>

      {/* --- Contenu de la vue active --- */}
      <div className="space-y-5">
        {vue === "principal" && (
          <>
            {/* --- Statut & visibilité --- */}
            <div className="rounded-xl border border-[#12181B]/10 p-4 space-y-4 bg-[#12181B]/[0.02]">
              <div className="space-y-1.5">
                <label className={labelClass}>Statut</label>
                <div className="flex gap-2">
                  {[
                    { valeur: "brouillon", libelle: "Brouillon" },
                    { valeur: "publie", libelle: "Publié" },
                    { valeur: "archive", libelle: "Archivé" },
                  ].map((option) => (
                    <button
                      key={option.valeur}
                      type="button"
                      onClick={() => setStatut(option.valeur)}
                      className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors duration-200 ${
                        statut === option.valeur
                          ? "bg-[#12181B] text-[#F6F7F2]"
                          : "bg-white border border-[#12181B]/10 text-[#12181B]/60 hover:text-[#12181B]"
                      }`}
                    >
                      {option.libelle}
                    </button>
                  ))}
                </div>
                {statut === "brouillon" && (
                  <p className="text-[12px] text-[#12181B]/40">Invisible pour les clients tant qu'il n'est pas publié.</p>
                )}
                {statut === "archive" && (
                  <p className="text-[12px] text-[#12181B]/40">Retiré de la boutique, mais conservé dans ton historique.</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#12181B]/10">
                <div>
                  <p className="text-[13px] font-medium text-[#12181B]">Produit vedette</p>
                  <p className="text-[12px] text-[#12181B]/50">L'épingler en page d'accueil de ta boutique.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={estMisEnAvant}
                  onClick={() => setEstMisEnAvant((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
                    estMisEnAvant ? "bg-[#0E7C66]" : "bg-[#12181B]/15"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      estMisEnAvant ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* --- Champs essentiels --- */}
            <div className="space-y-1.5">
              <label className={labelClass}>Nom du produit</label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Description</label>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className={`${inputClass} pb-9`}
                />
                <button
                  type="button"
                  onClick={genererDescriptionIA}
                  disabled={isGenerating}
                  className="absolute bottom-2 right-2 text-xs px-2.5 py-1.5 rounded-md
                             bg-white/40 backdrop-blur-md border border-white/50
                             text-indigo-700 shadow-sm
                             hover:bg-white/60 hover:shadow-md
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-200
                             flex items-center gap-1.5"
                >
                  {isGenerating ? (
                    <>
                      <span className="animate-spin h-3 w-3 border-2 border-indigo-600 border-t-transparent rounded-full"></span>
                      Génération...
                    </>
                  ) : (
                    <>
                      <img src={GeminiIcon} alt="" className="h-3.5 w-3.5" />
                      Complétion IA
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelClass}>Prix (Ar)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={prix}
                  onChange={(e) => setPrix(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Stock</label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {/* --- Lien vers le menu des options avancées --- */}
            <button
              type="button"
              onClick={() => setVue("menu")}
              className="w-full flex items-center justify-between rounded-xl border border-[#12181B]/10 px-4 py-3 hover:bg-[#12181B]/[0.02] transition-colors duration-200"
            >
              <div className="text-left">
                <p className="text-[14px] font-medium text-[#12181B]">Options avancées de création</p>
                <p className="text-[12px] text-[#12181B]/50">
                  Tarification, identité, stock, SEO
                  {Object.values(optionEstRemplie).some(Boolean) && (
                    <span className="text-[#0E7C66]"> · {Object.values(optionEstRemplie).filter(Boolean).length} configurée(s)</span>
                  )}
                </p>
              </div>
              <ChevronRight size={18} className="text-[#12181B]/40" />
            </button>
          </>
        )}

        {vue === "menu" && (
          <div className="space-y-2">
            {Object.entries(OPTIONS_AVANCEES)
              .filter(([cle]) => cle !== "galerie" || estEdition)
              .map(([cle, meta]) => (
                <button
                  key={cle}
                  type="button"
                  onClick={() => setVue(cle)}
                  className="w-full flex items-center justify-between rounded-xl border border-[#12181B]/10 px-4 py-3 hover:bg-[#12181B]/[0.02] transition-colors duration-200"
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-medium text-[#12181B]">{meta.titre}</p>
                      {optionEstRemplie[cle] && <span className="h-1.5 w-1.5 rounded-full bg-[#0E7C66]" />}
                    </div>
                    <p className="text-[12px] text-[#12181B]/50">{meta.description}</p>
                  </div>
                  <ChevronRight size={18} className="text-[#12181B]/40" />
                </button>
              ))}
          </div>
        )}

        {vue === "tarification" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className={labelClass}>Prix promo (Ar)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={prixPromo}
                onChange={(e) => setPrixPromo(e.target.value)}
                placeholder="Laisser vide si pas de promo"
                className={inputClass}
              />
              {prixPromo && Number(prixPromo) >= Number(prix) && (
                <p className="text-[12px] text-amber-600">
                  Le prix promo devrait être inférieur au prix normal ({prix} Ar).
                </p>
              )}
            </div>

            {prixPromo && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={labelClass}>Début</label>
                  <input
                    type="datetime-local"
                    value={promoDebut}
                    onChange={(e) => setPromoDebut(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Fin</label>
                  <input
                    type="datetime-local"
                    value={promoFin}
                    onChange={(e) => setPromoFin(e.target.value)}
                    min={promoDebut || undefined}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5 pt-1 border-t border-[#12181B]/5">
              <label className={labelClass}>Prix d'achat (Ar)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={prixAchat}
                onChange={(e) => setPrixAchat(e.target.value)}
                placeholder="Optionnel"
                className={inputClass}
              />
              <p className="text-[12px] text-[#12181B]/40">
                Usage interne uniquement — jamais visible côté client, sert au calcul de ta marge.
              </p>
            </div>

            {/* --- Statistique bénéfice / perte --- */}
            {prixAchat && Number(prixAchat) > 0 && (
              (() => {
                const prixVente = prixPromo && Number(prixPromo) > 0 ? Number(prixPromo) : Number(prix) || 0;
                const achat = Number(prixAchat) || 0;
                const quantite = Number(stock) || 0;
                const margeUnitaire = prixVente - achat;
                const margeTotale = margeUnitaire * quantite;
                const estBenefice = margeUnitaire >= 0;
                const pourcentage = achat > 0 ? (margeUnitaire / achat) * 100 : 0;

                return (
                  <div
                    className={`rounded-xl border p-4 ${
                      estBenefice ? "border-[#0E7C66]/20 bg-[#0E7C66]/[0.04]" : "border-red-200 bg-red-50/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {estBenefice ? (
                          <TrendingUp size={16} className="text-[#0E7C66]" />
                        ) : (
                          <TrendingDown size={16} className="text-red-500" />
                        )}
                        <p className={`text-[13px] font-medium ${estBenefice ? "text-[#0E7C66]" : "text-red-600"}`}>
                          {estBenefice ? "Bénéfice estimé" : "Perte estimée"}
                        </p>
                      </div>
                      <p className={`text-[13px] font-medium ${estBenefice ? "text-[#0E7C66]" : "text-red-600"}`}>
                        {margeUnitaire >= 0 ? "+" : ""}
                        {margeUnitaire.toLocaleString("fr-FR")} Ar / unité
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#12181B]/5 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] text-[#12181B]/40 uppercase tracking-wide">Sur stock ({quantite})</p>
                        <p className={`font-display text-[18px] font-medium ${estBenefice ? "text-[#0E7C66]" : "text-red-600"}`}>
                          {margeTotale >= 0 ? "+" : ""}
                          {margeTotale.toLocaleString("fr-FR")} Ar
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-[#12181B]/40 uppercase tracking-wide">Marge</p>
                        <p className={`font-display text-[18px] font-medium ${estBenefice ? "text-[#0E7C66]" : "text-red-600"}`}>
                          {pourcentage >= 0 ? "+" : ""}
                          {pourcentage.toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    {prixPromo && Number(prixPromo) > 0 && (
                      <p className="text-[11px] text-[#12181B]/40 mt-2">
                        Calculé sur le prix promo ({Number(prixPromo).toLocaleString("fr-FR")} Ar)
                      </p>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        )}

        {vue === "identite" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className={labelClass}>Catégorie</label>
              <select
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                className={`${inputClass} bg-white`}
              >
                <option value="">Aucune catégorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Marque</label>
              <input
                type="text"
                value={marque}
                onChange={(e) => setMarque(e.target.value)}
                placeholder="Optionnel"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Étiquettes</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={saisieTag}
                  onChange={(e) => setSaisieTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") ajouterTag(e);
                  }}
                  placeholder="ex: fait main"
                  className={`flex-1 ${inputClass}`}
                />
                <button
                  type="button"
                  onClick={ajouterTag}
                  className="rounded-full bg-[#12181B]/5 text-[#12181B] text-[13px] font-medium px-4 hover:bg-[#12181B]/10 transition-colors duration-200"
                >
                  Ajouter
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-[#0E7C66]/10 text-[#0E7C66] text-[13px] px-3 py-1"
                    >
                      {tag}
                      <button type="button" onClick={() => retirerTag(tag)} className="hover:text-[#0E7C66]/70">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {vue === "stock" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className={labelClass}>Référence (SKU)</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="ex: SAC-001"
                className={inputClass}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#12181B]/10 px-3.5 py-2.5">
              <div>
                <p className="text-[13px] font-medium text-[#12181B]">Suivre le stock</p>
                <p className="text-[12px] text-[#12181B]/50">
                  Si désactivé, le produit reste toujours disponible à l'achat.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={gestionStock}
                onClick={() => setGestionStock((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
                  gestionStock ? "bg-[#0E7C66]" : "bg-[#12181B]/15"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    gestionStock ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {gestionStock && (
              <div className="space-y-1.5">
                <label className={labelClass}>Seuil d'alerte stock bas</label>
                <input
                  type="number"
                  min="0"
                  value={seuilAlerteStock}
                  onChange={(e) => setSeuilAlerteStock(e.target.value)}
                  className={inputClass}
                />
                <p className="text-[12px] text-[#12181B]/40">
                  Une alerte se déclenche quand le stock descend en dessous de ce seuil.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className={labelClass}>Poids (kg)</label>
              <input
                type="number"
                min="0"
                step="0.001"
                value={poids}
                onChange={(e) => setPoids(e.target.value)}
                placeholder="Optionnel — utilisé pour la livraison"
                className={inputClass}
              />
            </div>
          </div>
        )}

        {vue === "seo" && (
          <div className="space-y-1.5">
            <label className={labelClass}>Description pour les moteurs de recherche</label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value.slice(0, 160))}
              rows={3}
              placeholder={description || "Résumé accrocheur affiché sous le lien dans les résultats Google"}
              className={inputClass}
            />
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-[#12181B]/40">
                Si laissé vide, Google affichera un extrait de la description du produit.
              </p>
              <p className={`text-[12px] shrink-0 ml-2 ${metaDescription.length > 155 ? "text-amber-600" : "text-[#12181B]/40"}`}>
                {metaDescription.length}/160
              </p>
            </div>
          </div>
        )}

        {vue === "galerie" && (
          <GalerieProduit produitId={produit.id} imagesInitiales={produit.images || []} />
        )}

        {vue === "galerie-post-creation" && produitCree && (
          <GalerieProduit
            produitId={produitCree.id}
            imagesInitiales={[]}
            onImagesChange={setImagesAjoutees}
          />
        )}
      </div>

      {/* --- Pied --- */}
      <div className="space-y-3">
        {erreur && (
          <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-[13px] text-red-600">
            {erreur}
          </div>
        )}
        {vue === "galerie-post-creation" ? (
          <button
            type="button"
            onClick={() => onSauvegarde({ ...produitCree, images: imagesAjoutees })}
            className="w-full rounded-full bg-[#12181B] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[var(--boutique-accent,#0E7C66)] transition-colors duration-300"
          >
            {imagesAjoutees.length > 0 ? "Terminé" : "Passer pour l'instant"}
          </button>
        ) : (
          <button
            type="submit"
            disabled={chargement}
            className="w-full rounded-full bg-[#12181B] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[var(--boutique-accent,#0E7C66)] transition-colors duration-300 disabled:opacity-50"
          >
            {chargement ? "Enregistrement..." : estEdition ? "Enregistrer les modifications" : "Créer le produit"}
          </button>
        )}
      </div>
    </form>
  );
}