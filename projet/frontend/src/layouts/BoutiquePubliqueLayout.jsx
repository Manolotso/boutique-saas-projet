import { useState, useEffect } from "react";
import { Outlet, Link, NavLink, useLocation } from "react-router-dom";
import {
  ShoppingCart, Store, Menu, X, CheckCircle2, Star,
  MessageCircle, Share2, Check, Smartphone, Truck, Phone, MapPin,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { BoutiquePubliqueProvider, useBoutiquePublique } from "../context/BoutiquePubliqueContext";
import MiniPanier from "../components/boutique/MiniPanier";
import { PanierProvider, usePanier } from "../context/PanierContext";
import BoutonDecouvrir from "../components/boutique/BoutonDecouvrir";

// Même largeur partout : header, bandeau, footer (et AccueilBoutique)
const CONTENEUR = "w-full px-4 sm:px-6 lg:px-8 2xl:px-12";

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

// Objet (et non tableau) : on retrouve le nom par sa clé, ex. VILLES["nosy_be"]
const VILLES = {
  antananarivo: "Antananarivo", toamasina: "Toamasina", antsirabe: "Antsirabe",
  fianarantsoa: "Fianarantsoa", mahajanga: "Mahajanga", toliara: "Toliara",
  antsiranana: "Antsiranana", nosy_be: "Nosy Be", autre: "Autre",
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

const CLASSE_BOUTON =
  "relative inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#12181B]/10 bg-white px-3 text-[13px] font-medium text-[#12181B]/80 transition-colors hover:bg-[#12181B]/5 hover:text-[#12181B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12181B] lg:px-4";

function BoutonPartage({ couleurAccent }) {
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
    <button onClick={partager} className={CLASSE_BOUTON} aria-label="Partager la boutique">
      {copie ? <Check size={18} style={{ color: couleurAccent }} /> : <Share2 size={18} />}
      <span className="hidden lg:inline">{copie ? "Lien copié" : "Partager"}</span>
    </button>
  );
}

function BoutonPanier({ couleurAccent, onClick }) {
  const { nombreArticles } = usePanier();
  return (
    <button onClick={onClick} className={CLASSE_BOUTON} aria-label="Voir le panier">
      <ShoppingCart size={18} />
      <span className="hidden lg:inline">Panier</span>
      {nombreArticles > 0 && (
        <span
          className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[11px] font-medium text-white"
          style={{ backgroundColor: couleurAccent }}
        >
          {nombreArticles > 9 ? "9+" : nombreArticles}
        </span>
      )}
    </button>
  );
}

function ShellBoutique() {
  const { boutique, chargement, introuvable, sousDomaine } = useBoutiquePublique();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [miniPanierOuvert, setMiniPanierOuvert] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onResize = () => window.innerWidth >= 1024 && setMenuOuvert(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Meta tags Open Graph : sans eux, le lien partagé sur Facebook/WhatsApp n'a ni titre ni vignette.
  useEffect(() => {
    if (!boutique) return;
    const titre = boutique.slogan
      ? `${boutique.nom_boutique} — ${boutique.slogan}`
      : boutique.nom_boutique;
    document.title = titre;
    definirMeta("property", "og:title", titre);
    definirMeta("property", "og:description", boutique.description || `Boutique en ligne à ${VILLES[boutique.ville] || "Madagascar"}`);
    definirMeta("property", "og:image", boutique.banniere || boutique.logo);
    definirMeta("property", "og:type", "website");
    definirMeta("name", "twitter:card", "summary_large_image");
  }, [boutique]);

  if (chargement) {
    return (
      <div className="min-h-screen bg-[#FBFAF6]">
        <div className="border-b border-[#12181B]/10 bg-white">
          <div className={`${CONTENEUR} flex h-16 items-center justify-between`}>
            <div className="flex items-center gap-2.5">
              <div className="h-11 w-11 animate-pulse rounded-xl bg-[#12181B]/10" />
              <div className="h-3 w-28 animate-pulse rounded-full bg-[#12181B]/10" />
            </div>
            <div className="h-8 w-8 animate-pulse rounded-full bg-[#12181B]/10" />
          </div>
        </div>
        <div className={`${CONTENEUR} space-y-4 py-16`}>
          <div className="h-5 w-48 animate-pulse rounded-full bg-[#12181B]/10" />
          <div className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-[#12181B]/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (introuvable || !boutique) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FBFAF6] px-4 text-center">
        <div className="w-full max-w-sm rounded-3xl border border-[#12181B]/10 bg-white p-10 shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#12181B]/5">
            <Store size={24} className="text-[#12181B]/40" />
          </span>
          <p className="mt-4 font-display text-[17px] font-medium text-[#12181B]">Boutique introuvable</p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-[#12181B]/50">
            « {sousDomaine} » n'existe pas ou n'est plus disponible.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-[#12181B] px-5 text-[13px] font-medium text-[#F6F7F2] transition-colors hover:bg-[#12181B]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12181B]"
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
  const adresseComplete = [boutique.adresse, VILLES[boutique.ville]].filter(Boolean).join(", ") || "Madagascar";

  const estEntreprise = boutique.infos_legales?.type_entite === "entreprise";
  const afficherMentionsLegales = estEntreprise && (boutique.numero_nif || boutique.numero_stat);

  const cheminAccueil = `/boutique/${boutique.sous_domaine}`;
  const estAccueilVitrine =
    location.pathname === cheminAccueil || location.pathname === `${cheminAccueil}/`;

  const LIENS = [
    { to: cheminAccueil, label: "Accueil", end: true },
    { to: `${cheminAccueil}/catalogue`, label: "Catalogue" },
  ];

  return (
    <div
      className="min-h-screen bg-[#FBFAF6]"
      style={{ "--boutique-primary": couleurPrimaire, "--boutique-accent": couleurAccent }}
    >
      <div
        className="h-[3px] w-full"
        style={{ background: `linear-gradient(90deg, ${couleurPrimaire}, ${couleurAccent})` }}
      />

      <header className="sticky top-0 z-40 border-b border-[#12181B]/10 bg-white/90 backdrop-blur-md">
  <div className={`${CONTENEUR} grid h-16 grid-cols-[1fr_auto] items-center gap-4 lg:h-20 lg:grid-cols-[1fr_auto_1fr]`}>
    {/* Gauche : identité */}
    <Link to={cheminAccueil} className="flex min-w-0 items-center gap-3">
      {boutique.logo ? (
        <img
          src={boutique.logo}
          alt={boutique.nom_boutique}
          className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-[#12181B]/10 lg:h-12 lg:w-12"
        />
      ) : (
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#F6F7F2] lg:h-12 lg:w-12"
          style={{ backgroundColor: couleurPrimaire }}
        >
          <Store size={20} />
        </span>
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-display text-[15px] font-medium text-[#12181B] lg:text-[17px]">
            {boutique.nom_boutique}
          </span>
          {boutique.est_verifie && (
            <CheckCircle2
              size={16}
              strokeWidth={2.5}
              className="shrink-0 lg:hidden"
              style={{ color: couleurAccent }}
              aria-label="Boutique vérifiée"
            />
          )}
        </div>
        {boutique.slogan && (
          <p className="hidden truncate text-[12px] text-[#12181B]/50 sm:block lg:text-[13px]">{boutique.slogan}</p>
        )}
      </div>
    </Link>

    {/* Centre (ordinateur) : navigation + boutons */}
    <div className="hidden items-center gap-2 lg:flex">
      <nav className="flex items-center gap-1">
        {LIENS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="rounded-full px-4 py-2 text-[14px] font-medium text-[#12181B]/60 transition-colors hover:bg-[#12181B]/5 hover:text-[#12181B]"
            style={({ isActive }) =>
              isActive ? { backgroundColor: `${couleurAccent}1A`, color: couleurAccent } : undefined
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <span className="mx-2 h-6 w-px bg-[#12181B]/10" />
      <BoutonDecouvrir />
      <BoutonPartage couleurAccent={couleurAccent} />
      <BoutonPanier couleurAccent={couleurAccent} onClick={() => setMiniPanierOuvert(true)} />
    </div>

    {/* Droite (ordinateur) : note + badge */}
    <div className="hidden items-center justify-end gap-3 lg:flex">
      {boutique.nombre_avis > 0 && (
        <span className="flex items-center gap-1 text-[13px] text-[#12181B]/60">
          <Star size={14} className="fill-amber-400 text-amber-400" />
          <span className="font-medium text-[#12181B]">{Number(boutique.note_moyenne).toFixed(1)}</span>
          <span className="text-[#12181B]/40">({boutique.nombre_avis} avis)</span>
        </span>
      )}
      {boutique.est_verifie && (
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium"
          style={{ backgroundColor: `${couleurAccent}1A`, color: couleurAccent }}
        >
          <CheckCircle2 size={13} strokeWidth={2.5} />
          Vérifiée
        </span>
      )}
    </div>

    {/* Mobile / tablette : boutons + menu */}
    <div className="flex items-center gap-2 lg:hidden">
      <BoutonDecouvrir />
      <BoutonPartage couleurAccent={couleurAccent} />
      <BoutonPanier couleurAccent={couleurAccent} onClick={() => setMiniPanierOuvert(true)} />
      <button
        onClick={() => setMenuOuvert((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#12181B]/10 bg-white text-[#12181B]/70 transition-colors hover:bg-[#12181B]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12181B]"
        aria-label={menuOuvert ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={menuOuvert}
      >
        {menuOuvert ? <X size={18} /> : <Menu size={18} />}
      </button>
    </div>
  </div>

  {/* Menu mobile */}
  <AnimatePresence>
    {menuOuvert && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="overflow-hidden border-t border-[#12181B]/10 bg-white lg:hidden"
      >
        <nav className={`${CONTENEUR} flex flex-col gap-1 py-3`}>
          {LIENS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMenuOuvert(false)}
              className="rounded-lg px-3 py-3 text-[15px] font-medium text-[#12181B]/60"
              style={({ isActive }) =>
                isActive ? { backgroundColor: `${couleurAccent}1A`, color: couleurAccent } : undefined
              }
            >
              {label}
            </NavLink>
          ))}
          {boutique.nombre_avis > 0 && (
            <span className="flex items-center gap-1 px-3 py-2 text-[13px] text-[#12181B]/60">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              {Number(boutique.note_moyenne).toFixed(1)} ({boutique.nombre_avis} avis)
            </span>
          )}
        </nav>
      </motion.div>
    )}
  </AnimatePresence>
</header>

      {/* ===== Bandeau des moyens de paiement (accueil) ===== */}
      {estAccueilVitrine && moyensPaiement.length > 0 && (
        <div className="border-b border-[#12181B]/10 bg-[#12181B]/[0.03]">
          <div className={`${CONTENEUR} flex items-center gap-2 overflow-x-auto py-2.5`}>
            <span className="shrink-0 text-[11px] text-[#12181B]/40">Moyen de paiement :</span>
            {moyensPaiement.map((moyen) => {
              const style = STYLES_PAIEMENT[moyen] || {
                bg: "#FFFFFF", texte: "#12181B99", bordure: "#12181B1A", Icone: null,
              };
              const Icone = style.Icone;
              return (
                <span
                  key={moyen}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium"
                  style={{ backgroundColor: style.bg, color: style.texte, borderColor: style.bordure }}
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

      <footer className="mt-16 border-t border-[#12181B]/10 bg-white">
  <div
    className={`${CONTENEUR} grid gap-x-10 gap-y-10 py-12`}
    style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
  >
    {/* Boutique */}
    <div className="space-y-3">
      <p className="font-display text-[17px] font-medium text-[#12181B]">{boutique.nom_boutique}</p>
      {boutique.slogan && <p className="text-[14px] text-[#12181B]/55">{boutique.slogan}</p>}
      {statutOuverture && (
        <p className="inline-flex items-center gap-2 rounded-full bg-[#12181B]/[0.04] px-3 py-1.5 text-[12px]">
          <span className={`h-2 w-2 rounded-full ${statutOuverture.ouvert ? "bg-[#0E7C66]" : "bg-[#12181B]/30"}`} />
          <span className={statutOuverture.ouvert ? "font-medium text-[#0E7C66]" : "text-[#12181B]/60"}>
            {statutOuverture.ouvert ? "Ouvert maintenant" : "Fermé actuellement"}
          </span>
          {statutOuverture.horaireDuJour && (
            <span className="text-[#12181B]/40">· {statutOuverture.horaireDuJour}</span>
          )}
        </p>
      )}
    </div>

    {/* Navigation */}
    <div className="space-y-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#12181B]/40">Navigation</p>
      <ul className="space-y-2 text-[14px] text-[#12181B]/70">
        {LIENS.map(({ to, label }) => (
          <li key={to}>
            <Link to={to} className="hover:text-[#12181B] hover:underline">{label}</Link>
          </li>
        ))}
      </ul>
    </div>

    {/* Contact */}
    <div className="space-y-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#12181B]/40">Contact</p>
      <ul className="space-y-2.5 text-[14px] text-[#12181B]/70">
        {boutique.telephone && (
          <li className="flex items-center gap-2.5">
            <Phone size={15} className="shrink-0 text-[#12181B]/40" />
            <a href={`tel:${boutique.telephone}`} className="hover:text-[#12181B] hover:underline">
              {boutique.telephone}
            </a>
          </li>
        )}
        {boutique.whatsapp && urlWhatsApp && (
          <li className="flex items-center gap-2.5">
            <MessageCircle size={15} className="shrink-0 text-[#12181B]/40" />
            <a
              href={urlWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#12181B] hover:underline"
            >
              WhatsApp : {boutique.whatsapp}
            </a>
          </li>
        )}
        <li className="flex items-start gap-2.5">
          <MapPin size={15} className="mt-0.5 shrink-0 text-[#12181B]/40" />
          {adresseComplete}
        </li>
      </ul>
    </div>

    {/* Paiements */}
    {moyensPaiement.length > 0 && (
      <div className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[#12181B]/40">Paiement accepté</p>
        <div className="flex flex-wrap gap-2">
          {moyensPaiement.map((moyen) => (
            <span key={moyen} className="rounded-full bg-[#12181B]/5 px-3 py-1 text-[12px] text-[#12181B]/70">
              {LABELS_PAIEMENT[moyen] || moyen}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Réseaux sociaux */}
    {reseauxActifs.length > 0 && (
      <div className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[#12181B]/40">Suivez-nous</p>
        <div className="flex flex-wrap gap-2">
          {reseauxActifs.map(([reseau, url]) => (
            <a
              key={reseau}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-[#12181B]/15 px-4 py-2 text-[13px] font-medium text-[#12181B]/70 transition-colors hover:border-[#12181B]/30 hover:text-[#12181B]"
            >
              {LABELS_RESEAUX[reseau] || reseau}
            </a>
          ))}
        </div>
      </div>
    )}
  </div>

  <div className="border-t border-[#12181B]/10">
    <div
      className={`${CONTENEUR} flex flex-col gap-1 py-4 text-[12px] text-[#12181B]/40 sm:flex-row sm:items-center sm:justify-between`}
    >
      <p>© {new Date().getFullYear()} {boutique.nom_boutique} · Propulsé par la plateforme</p>
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
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
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