import { useState, useEffect } from "react";
import { Outlet, Link, NavLink, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  Store,
  Menu,
  X,
  CheckCircle2,
  Star,
  Clock,
  MessageCircle,
  Share2,
  Check,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { BoutiquePubliqueProvider, useBoutiquePublique } from "../context/BoutiquePubliqueContext";

import { Smartphone, Truck, } from "lucide-react";
import MiniPanier from "../components/boutique/MiniPanier";
import { PanierProvider, usePanier } from "../context/PanierContext";


const STYLES_PAIEMENT = {
  mvola: { bg: "#FFF4CC", texte: "#8A6D00", bordure: "#F5D547", Icone: Smartphone },
  orange_money: { bg: "#FFE8D9", texte: "#C24E00", bordure: "#FF7900", Icone: Smartphone },
  airtel_money: { bg: "#FDE2E2", texte: "#B91C1C", bordure: "#ED1C24", Icone: Smartphone },
  livraison: { bg: "#F1F1EF", texte: "#4B5150", bordure: "#12181B1A", Icone: Truck },
};

const JOURS_FR = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

const LABELS_PAIEMENT = {
  livraison: "Paiement à la livraison",
  mvola: "Mvola",
  orange_money: "Orange Money",
  airtel_money: "Airtel Money",
};

const LABELS_RESEAUX = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
};

function calculerStatutOuverture(horaires) {
  if (!horaires) return null;
  const maintenant = new Date();
  const jour = JOURS_FR[maintenant.getDay()];
  const infosJour = horaires[jour];
  if (!infosJour || !infosJour.ouvert) return { ouvert: false };

  const [hDebut, mDebut] = infosJour.debut.split(":").map(Number);
  const [hFin, mFin] = infosJour.fin.split(":").map(Number);
  const minutesActuelles = maintenant.getHours() * 60 + maintenant.getMinutes();
  const ouvert = minutesActuelles >= hDebut * 60 + mDebut && minutesActuelles <= hFin * 60 + mFin;
  return { ouvert, horaireDuJour: `${infosJour.debut} – ${infosJour.fin}` };
}

// Convertit un numéro local malgache (032/033/034/038 xx xxx xx) en lien wa.me au format international.
function lienWhatsApp(numero) {
  if (!numero) return null;
  const chiffres = numero.replace(/[^\d]/g, "");
  const sansZeroInitial = chiffres.startsWith("0") ? chiffres.slice(1) : chiffres;
  const avecIndicatif = sansZeroInitial.startsWith("261") ? sansZeroInitial : `261${sansZeroInitial}`;
  return `https://wa.me/${avecIndicatif}`;
}

// Insère ou met à jour une balise <meta> par attribut (property ou name).
function definirMeta(attribut, cle, contenu) {
  if (!contenu) return;
  let balise = document.querySelector(`meta[${attribut}="${cle}"]`);
  if (!balise) {
    balise = document.createElement("meta");
    balise.setAttribute(attribut, cle);
    document.head.appendChild(balise);
  }
  balise.setAttribute("content", contenu);
}



function BoutonPartage({ couleurAccent, className = "" }) {
  const [copie, setCopie] = useState(false);

  const partager = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: document.title });
      } catch {}
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {}
  };

  return (
    <button
      onClick={partager}
      className={`relative flex items-center justify-center h-10 w-10 rounded-full text-[#12181B]/80 bg-[#12181B]/[0.04] hover:text-[#12181B] hover:bg-[#12181B]/10 border border-[#12181B]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12181B] ${className}`}
      aria-label="Partager la boutique"
    >
      {copie ? <Check size={18} style={{ color: couleurAccent }} /> : <Share2 size={18} />}
      {copie && (
        <span className="absolute -bottom-8 right-0 text-[11px] whitespace-nowrap bg-[#12181B] text-white rounded-full px-2.5 py-1">
          Lien copié
        </span>
      )}
    </button>
  );
}

// Ito ilay tsy ilaina.
function IconePanier({ sousDomaine }) {
  const { nombreArticles } = usePanier();
  return (
    <Link
      to={`/boutique/${sousDomaine}/panier`}
      className="relative flex items-center gap-1.5 text-[14px] text-[#12181B]/70 hover:text-[#12181B]"
    >
      <ShoppingCart size={18} />
      {nombreArticles > 0 && (
        <span className="absolute -top-2 -right-2.5 bg-[var(--boutique-accent,#0E7C66)] text-white text-[10px] min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
          {nombreArticles}
        </span>
      )}
    </Link>
  );
}

function ShellBoutique() {
  const { boutique, chargement, introuvable, sousDomaine } = useBoutiquePublique();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [miniPanierOuvert, setMiniPanierOuvert] = useState(false);
  const location = useLocation();
  const { nombreArticles } = usePanier();

  useEffect(() => {
    const onResize = () => window.innerWidth >= 768 && setMenuOuvert(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Meta tags Open Graph — essentiel puisque le partage se fait surtout via lien
  // Facebook/WhatsApp : sans ça, le lien partagé n'a ni titre ni vignette.
  useEffect(() => {
    if (!boutique) return;
    const titre = boutique.slogan
      ? `${boutique.nom_boutique} — ${boutique.slogan}`
      : boutique.nom_boutique;
    document.title = titre;
    definirMeta("property", "og:title", titre);
    definirMeta("property", "og:description", boutique.description || `Boutique en ligne à ${boutique.ville || "Madagascar"}`);
    definirMeta("property", "og:image", boutique.banniere || boutique.logo);
    definirMeta("property", "og:type", "website");
    definirMeta("name", "twitter:card", "summary_large_image");
  }, [boutique]);



  if (chargement) {
    return (
      <div className="min-h-screen bg-[#FBFAF6]">
        <div className="border-b border-[#12181B]/10 bg-white">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-12 w-12 rounded-xl bg-[#12181B]/8 animate-pulse" />
              <div className="h-3 w-28 rounded-full bg-[#12181B]/8 animate-pulse" />
            </div>
            <div className="hidden md:flex items-center gap-6">
              <div className="h-3 w-16 rounded-full bg-[#12181B]/8 animate-pulse" />
              <div className="h-8 w-8 rounded-full bg-[#12181B]/8 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 py-16 space-y-4">
          <div className="h-5 w-48 rounded-full bg-[#12181B]/6 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-square rounded-2xl bg-[#12181B]/5 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (introuvable || !boutique) {
    return (
      <div className="min-h-screen bg-[#FBFAF6] flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-sm w-full rounded-3xl border border-[#12181B]/10 bg-white shadow-sm p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#12181B]/5">
            <Store size={24} className="text-[#12181B]/40" />
          </span>
          <p className="text-[17px] font-display font-medium text-[#12181B] mt-4">
            Boutique introuvable
          </p>
          <p className="text-[14px] text-[#12181B]/50 mt-1.5 leading-relaxed">
            « {sousDomaine} » n'existe pas ou n'est plus disponible.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center mt-6 h-10 px-5 rounded-full bg-[#12181B] text-[#F6F7F2] text-[13px] font-medium hover:bg-[#12181B]/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12181B]"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  const couleurPrimaire = boutique.couleur_primaire || "#12181B";
  const couleurAccent = boutique.couleur_secondaire || "#0E7C66";
  const statutOuverture = calculerStatutOuverture(boutique.horaires_ouverture);
  const reseauxActifs = Object.entries(boutique.reseaux_sociaux || {}).filter(([, url]) => url);
  const moyensPaiement = boutique.moyens_paiement_actifs || [];
  const urlWhatsApp = lienWhatsApp(boutique.whatsapp);

  const estEntreprise = boutique.infos_legales?.type_entite === "entreprise";
  const afficherMentionsLegales = estEntreprise && (boutique.numero_nif || boutique.numero_stat);

  const cheminAccueil = `/boutique/${boutique.sous_domaine}`;
  const estAccueilVitrine =
    location.pathname === cheminAccueil || location.pathname === `${cheminAccueil}/`;
  const afficherBanniere = estAccueilVitrine && boutique.banniere;

  const lienActifClasses = ({ isActive }) =>
    `relative text-[14px] transition-colors ${
      isActive ? "text-[#12181B] font-medium" : "text-[#12181B]/60 hover:text-[#12181B]"
    }`;

  return (
    <div
      className="min-h-screen bg-[#FBFAF6]"
      style={{ "--boutique-primary": couleurPrimaire, "--boutique-accent": couleurAccent }}
    >
      <div
        className="h-[3px] w-full"
        style={{ background: `linear-gradient(90deg, ${couleurPrimaire}, ${couleurAccent})` }}
      />

      <header className="sticky top-0 z-40 border-b border-[#12181B]/10 bg-white/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to={cheminAccueil} className="flex items-center gap-2.5 shrink-0 min-w-0">
            {boutique.logo ? (
              <img
                src={boutique.logo}
                alt={boutique.nom_boutique}
                className="h-12 w-12 rounded-xl object-cover ring-1 ring-[#12181B]/10 shrink-0"
              />
            ) : (
              <span
                className="flex h-12 w-12 items-center justify-center rounded-xl text-[#F6F7F2] shrink-0"
                style={{ backgroundColor: couleurPrimaire }}
              >
                <Store size={20} />
              </span>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-display font-medium text-[#12181B] truncate">
                  {boutique.nom_boutique}
                </span>
                {boutique.est_verifie && (
                  <span
                    className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 shrink-0"
                    style={{ backgroundColor: `${couleurAccent}1A`, color: couleurAccent }}
                  >
                    <CheckCircle2 size={12} strokeWidth={2.5} />
                    Vérifiée
                  </span>
                )}
              </div>
              {boutique.slogan && (
                <p className="hidden sm:block text-[12px] text-[#12181B]/45 truncate">{boutique.slogan}</p>
              )}
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {boutique.nombre_avis > 0 && (
              <span className="flex items-center gap-1 text-[13px] text-[#12181B]/60">
                <Star size={13} className="fill-[#12181B]/60 text-[#12181B]/60" />
                {Number(boutique.note_moyenne).toFixed(1)}
                <span className="text-[#12181B]/35">({boutique.nombre_avis})</span>
              </span>
            )}

            

            <BoutonPartage couleurAccent={couleurAccent} />

            <button
  onClick={() => setMiniPanierOuvert(true)}
  className="relative flex items-center justify-center h-9 w-9 rounded-full text-[#12181B]/70 hover:text-[#12181B] hover:bg-[#12181B]/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12181B]"
  aria-label="Voir le panier"
>
  <ShoppingCart size={18} />
  {nombreArticles > 0 && (
    <span
      className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-medium text-white"
      style={{ backgroundColor: couleurAccent }}
    >
      {nombreArticles > 9 ? "9+" : nombreArticles}
    </span>
  )}
</button>
          </nav>

          <div className="flex md:hidden items-center gap-1">
            <button
  onClick={() => setMiniPanierOuvert(true)}
  className="relative flex items-center justify-center h-9 w-9 rounded-full text-[#12181B]/70 hover:bg-[#12181B]/5 transition-colors"
  aria-label="Voir le panier"
>
  <ShoppingCart size={18} />
  {nombreArticles > 0 && (
    <span
      className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-medium text-white"
      style={{ backgroundColor: couleurAccent }}
    >
      {nombreArticles > 9 ? "9+" : nombreArticles}
    </span>
  )}
</button>
            <button
              onClick={() => setMenuOuvert((v) => !v)}
              className="flex items-center justify-center h-9 w-9 rounded-full text-[#12181B]/70 hover:bg-[#12181B]/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12181B]"
              aria-label={menuOuvert ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={menuOuvert}
            >
              {menuOuvert ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOuvert && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="md:hidden overflow-hidden border-t border-[#12181B]/10 bg-white"
            >
              <nav className="max-w-5xl mx-auto px-6 py-4 flex flex-col gap-2">
                {boutique.slogan && <p className="text-[12px] text-[#12181B]/45 -mt-1 mb-1">{boutique.slogan}</p>}
                <NavLink
                  to={`${cheminAccueil}/catalogue`}
                  onClick={() => setMenuOuvert(false)}
                  className={({ isActive }) =>
                    `text-[14px] py-2 ${isActive ? "text-[#12181B] font-medium" : "text-[#12181B]/60"}`
                  }
                >
                  Catalogue
                </NavLink>
                {boutique.nombre_avis > 0 && (
                  <span className="flex items-center gap-1 text-[13px] text-[#12181B]/60 py-1">
                    <Star size={13} className="fill-[#12181B]/60 text-[#12181B]/60" />
                    {Number(boutique.note_moyenne).toFixed(1)} ({boutique.nombre_avis} avis)
                  </span>
                )}
                {boutique.est_verifie && (
                  <span
                    className="inline-flex sm:hidden items-center gap-1 w-fit text-[11px] font-medium rounded-full px-2 py-0.5 mt-1"
                    style={{ backgroundColor: `${couleurAccent}1A`, color: couleurAccent }}
                  >
                    <CheckCircle2 size={12} strokeWidth={2.5} />
                    Boutique vérifiée
                  </span>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {afficherBanniere && (
        <div className="relative w-full h-40 sm:h-56 md:h-72 overflow-hidden">
          <img
            src={boutique.banniere}
            alt={`Bannière de ${boutique.nom_boutique}`}
            className="absolute inset-0 w-full h-full object-cover"
            fetchpriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FBFAF6] via-transparent to-transparent" />
        </div>
      )}

     

{estAccueilVitrine && moyensPaiement.length > 0 && (
  <div className="bg-[#12181B]/[0.03] border-b border-[#12181B]/10">
    <div className="max-w-5xl mx-auto px-6 py-2.5 flex items-center gap-2 overflow-x-auto">
      <span className="text-[11px] text-[#12181B]/40 shrink-0">Moyen de paiement :</span>
      {moyensPaiement.map((moyen) => {
  const style = STYLES_PAIEMENT[moyen] || {
    bg: "#FFFFFF",
    texte: "#12181B99",
    bordure: "#12181B1A",
    Icone: null,
  };
  const Icone = style.Icone;
  return (
    <span
      key={moyen}
      className="inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-1 shrink-0 border"
      style={{
        backgroundColor: style.bg,
        color: style.texte,
        borderColor: style.bordure,
      }}
    >
      {Icone && <Icone size={12} strokeWidth={2.5} />}
      {LABELS_PAIEMENT[moyen] || moyen}
    </span>
  );
})}
    </div>
  </div>
)}

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-[#12181B]/10 mt-16 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
          <div className="space-y-2">
            <p className="text-[14px] font-display font-medium text-[#12181B]">{boutique.nom_boutique}</p>
            <p className="text-[13px] text-[#12181B]/50">
              {[boutique.adresse, boutique.ville].filter(Boolean).join(", ") || "Madagascar"}
            </p>
            {statutOuverture && (
              <p className="flex items-center gap-1.5 text-[13px]">
                <Clock size={13} className="text-[#12181B]/40" />
                <span className={statutOuverture.ouvert ? "text-[#0E7C66]" : "text-[#12181B]/50"}>
                  {statutOuverture.ouvert ? "Ouvert maintenant" : "Fermé actuellement"}
                </span>
                {statutOuverture.horaireDuJour && (
                  <span className="text-[#12181B]/35">({statutOuverture.horaireDuJour})</span>
                )}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-[#12181B]/35">Contact</p>
            {boutique.telephone && <p className="text-[13px] text-[#12181B]/60">{boutique.telephone}</p>}
            {boutique.whatsapp && <p className="text-[13px] text-[#12181B]/60">WhatsApp : {boutique.whatsapp}</p>}
            {reseauxActifs.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {reseauxActifs.map(([reseau, url]) => (
                  <a
                    key={reseau}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] rounded-full border border-[#12181B]/15 px-2.5 py-1 text-[#12181B]/60 hover:border-[#12181B]/30 hover:text-[#12181B] transition-colors"
                  >
                    {LABELS_RESEAUX[reseau] || reseau}
                  </a>
                ))}
              </div>
            )}
          </div>

          {moyensPaiement.length > 0 && (
            <div className="space-y-2 sm:text-right">
              <p className="text-[11px] uppercase tracking-wide text-[#12181B]/35">Paiement accepté (ty mety esorina de soloina hoe suivez-nous @ réseaux sociaux)</p>
              <div className="flex flex-wrap gap-1.5 sm:justify-end">
                {moyensPaiement.map((moyen) => (
                  <span
                    key={moyen}
                    className="text-[12px] rounded-full bg-[#12181B]/5 px-2.5 py-1 text-[#12181B]/60"
                  >
                    {LABELS_PAIEMENT[moyen] || moyen}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[#12181B]/10">
          <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[12px] text-[#12181B]/35">
            <p>Propulsé par la plateforme</p>
            {afficherMentionsLegales && (
              <p>
                {boutique.numero_nif && <>NIF {boutique.numero_nif}</>}
                {boutique.numero_nif && boutique.numero_stat && " · "}
                {boutique.numero_stat && <>STAT {boutique.numero_stat}</>}
              </p>
            )}
          </div>
        </div>
      </footer>

      {urlWhatsApp && (
        <a
          href={urlWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#25D366]"
          aria-label="Discuter sur WhatsApp"
        >
          <MessageCircle size={26} fill="white" strokeWidth={0} />
        </a>
      )}

      <MiniPanier
  isOpen={miniPanierOuvert}
  onClose={() => setMiniPanierOuvert(false)}
  sousDomaine={boutique.sous_domaine}
  devise={boutique.devise}
  couleurAccent={couleurAccent}
/>

    </div>
  );
}

export default function BoutiquePubliqueLayout() {
  return (
    <BoutiquePubliqueProvider>
      <PanierProvider>
        <ShellBoutique />
      </PanierProvider>
    </BoutiquePubliqueProvider>
  );
}