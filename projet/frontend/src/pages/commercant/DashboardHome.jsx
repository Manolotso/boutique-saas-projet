import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package, AlertTriangle, CheckCircle2, Circle, TrendingUp, TrendingDown, ShoppingBag,
  Users, Wallet, Receipt, Clock, ChevronRight, BadgeCheck, CreditCard, Truck,
  PackageCheck, XCircle, Download, RefreshCw, Bell, X, Store,
} from "lucide-react";
import { useBoutique } from "../../context/BoutiqueContext";
import { useToast } from "../../context/ToastContext";
import { catalogueApi } from "../../api/catalogue";
import { commandesApi } from "../../api/commandes";
import Modal from "../../components/ui/Modal";
import DetailCommande from "../../components/commercant/DetailCommande";

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

const REVENU_STATUTS = ["payee", "expediee", "livree"];
const INTERVALLE_ACTUALISATION_MS = 60 * 1000;
const CLE_OBJECTIF = "objectif_ca_mensuel";

// `actionnable` : la commande est encore en cours de traitement.
const STATUTS = {
  payee: { label: "Payée", action: "À expédier", color: "#0E7C66", icone: CreditCard, actionnable: true },
  expediee: { label: "Expédiée", action: "En route", color: "#3B82F6", icone: Truck, actionnable: true },
  livree: { label: "Livrée", action: "Livrées", color: "#12181B", icone: PackageCheck, actionnable: false },
  annulee: { label: "Annulée", action: "Annulées", color: "#EF4444", icone: XCircle, actionnable: false },
};
const CLES_STATUTS = Object.keys(STATUTS);
const ACTIONNABLES = CLES_STATUTS.filter((k) => STATUTS[k].actionnable);

const PERIODES = [
  { jours: 1, decalage: 0, label: "Aujourd'hui" },
  { jours: 1, decalage: 1, label: "Hier" },
  { jours: 7, decalage: 0, label: "7 jours" },
  { jours: 30, decalage: 0, label: "30 jours" },
  { jours: 90, decalage: 0, label: "90 jours" },
  { jours: null, decalage: 0, label: "Tout" },
];

const JOURS_SEMAINE = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const prix = (n) => `${Math.round(n || 0).toLocaleString("fr-FR")} Ar`;
const prixCourt = (n) => {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(".0", "")} M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(".0", "")} k`;
  return String(Math.round(n));
};

const dateCommande = (c) => new Date(c.date_commande);
const totalCommande = (c) => Number(c.montant_total || 0);
const clientCommande = (c) => c.nom_destinataire || "Client";
const cleClient = (c) => c.telephone_destinataire || c.nom_destinataire || String(c.id);

const JOUR_MS = 24 * 60 * 60 * 1000;
const HEURE_MS = 60 * 60 * 1000;
const pad2 = (n) => String(n).padStart(2, "0");
const debutDeJour = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

function depuis(date) {
  const min = Math.floor((Date.now() - date.getTime()) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

function formaterDuree(ms) {
  if (ms === null) return "—";
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  const h = min / 60;
  if (h < 48) return `${h.toFixed(h < 10 ? 1 : 0).replace(".0", "")} h`;
  return `${(h / 24).toFixed(1).replace(".0", "")} j`;
}

function construireSerie(liste, debut, nbJours, pas) {
  const heure = nbJours === 1;
  const pasMs = heure ? HEURE_MS : pas * JOUR_MS;
  const n = heure ? 24 : Math.ceil(nbJours / pas);
  const formatLabel = nbJours > 365 ? { month: "short", year: "numeric" } : { day: "2-digit", month: "short" };

  const serie = Array.from({ length: n }, (_, i) => {
    const d = new Date(debut.getTime() + i * pasMs);
    return {
      cle: i,
      label: heure ? `${pad2(d.getHours())}h` : d.toLocaleDateString("fr-FR", formatLabel),
      ca: 0,
      commandes: 0,
    };
  });

  liste
    .filter((c) => REVENU_STATUTS.includes(c.statut))
    .forEach((c) => {
      const d = dateCommande(c);
      const ref = heure ? d : debutDeJour(d);
      const s = serie[Math.floor((ref - debut) / pasMs)];
      if (s) {
        s.ca += totalCommande(c);
        s.commandes += 1;
      }
    });
  return serie;
}

// Export CSV (séparateur ; et BOM pour qu'Excel affiche bien les accents)
function exporterCSV(liste, nomFichier) {
  const entetes = ["N°", "Date", "Client", "Téléphone", "Statut", "Livraison", "Total (Ar)"];
  const echapper = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lignes = liste.map((c) =>
    [
      c.numero_commande,
      dateCommande(c).toLocaleString("fr-FR"),
      clientCommande(c),
      c.telephone_destinataire,
      STATUTS[c.statut]?.label || c.statut,
      c.mode_livraison === "retrait" ? "Retrait" : "Domicile",
      Math.round(totalCommande(c)),
    ].map(echapper).join(";")
  );
  const contenu = "\uFEFF" + [entetes.map(echapper).join(";"), ...lignes].join("\n");
  const url = URL.createObjectURL(new Blob([contenu], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nomFichier;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/* Utilitaires graphiques                                              */
/* ------------------------------------------------------------------ */

// Courbe lissée qui ne "dépasse" pas entre deux points (interpolation monotone)
function cheminLisse(pts) {
  const n = pts.length;
  if (n < 2) return "";
  const dx = [], m = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0] || 1;
    m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i];
  }
  const t = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) t[i] = 0;
    else {
      const moy = (m[i - 1] + m[i]) / 2;
      const lim = 3 * Math.min(Math.abs(m[i - 1]), Math.abs(m[i]));
      t[i] = Math.sign(moy) * Math.min(Math.abs(moy), lim);
    }
  }
  t[n - 1] = m[n - 2];
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const h = dx[i] / 3;
    d += ` C${x0 + h},${y0 + t[i] * h} ${x1 - h},${y1 - t[i + 1] * h} ${x1},${y1}`;
  }
  return d;
}

function maxJoli(v) {
  const p = 10 ** Math.floor(Math.log10(v));
  const f = v / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

function useLargeur() {
  const ref = useRef(null);
  const [largeur, setLargeur] = useState(600);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setLargeur(el.clientWidth || 600);
    const ro = new ResizeObserver(([e]) => setLargeur(Math.max(e.contentRect.width, 240)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, largeur];
}

/* ------------------------------------------------------------------ */
/* Petits composants                                                   */
/* ------------------------------------------------------------------ */

function Variation({ actuel, precedent }) {
  if (!precedent) return <span className="text-[12px] text-[#12181B]/40">— vs période préc.</span>;
  const pct = ((actuel - precedent) / precedent) * 100;
  const hausse = pct >= 0;
  const Icone = hausse ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-[12px] font-medium ${hausse ? "text-[#0E7C66]" : "text-red-500"}`}>
      <Icone size={13} />
      {hausse ? "+" : ""}{pct.toFixed(0)}%
      <span className="font-normal text-[#12181B]/40">vs période préc.</span>
    </span>
  );
}

function CarteKpi({ icone: Icone, label, valeur, actuel, precedent }) {
  return (
    <div className="rounded-2xl border border-[#12181B]/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[#12181B]/60">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#12181B]/[0.05] text-[#12181B]/60">
          <Icone size={16} />
        </span>
      </div>
      <p className="mt-2 text-[26px] font-medium leading-tight text-[#12181B]">{valeur}</p>
      <div className="mt-1.5">
        <Variation actuel={actuel} precedent={precedent} />
      </div>
    </div>
  );
}

function Mini({ icone: Icone, label, valeur, aide, couleur = "#12181B" }) {
  return (
    <div className="rounded-2xl border border-[#12181B]/10 bg-white p-4">
      <div className="flex items-center gap-2 text-[12px] text-[#12181B]/55">
        <Icone size={14} style={{ color: couleur }} />
        {label}
      </div>
      <p className="mt-1.5 text-[22px] font-medium leading-tight text-[#12181B]">{valeur}</p>
      {aide && <p className="mt-0.5 text-[12px] text-[#12181B]/45">{aide}</p>}
    </div>
  );
}

function Carte({ titre, sousTitre, action, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-[#12181B]/10 bg-white p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-medium text-[#12181B]">{titre}</h2>
          {sousTitre && <p className="mt-0.5 text-[12px] text-[#12181B]/45">{sousTitre}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Vide({ texte }) {
  return <p className="py-8 text-center text-[13px] text-[#12181B]/40">{texte}</p>;
}

// Barre qui se remplit en douceur
function Barre({ pct, color }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setV(pct), 40);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#12181B]/5">
      <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${v}%`, background: color }} />
    </div>
  );
}

/* ---------- Graphique du CA : courbe lissée, dégradé, survol ---------- */

function GraphiqueCA({ serie, precedente }) {
  const [ref, w] = useLargeur();
  const [idx, setIdx] = useState(null);

  const H = 260;
  const P = { g: 52, d: 14, h: 14, b: 30 };
  const largeurUtile = Math.max(w - P.g - P.d, 10);
  const hauteurUtile = H - P.h - P.b;
  const n = serie.length;

  const max = maxJoli(Math.max(...serie.map((s) => s.ca), ...(precedente || []).map((s) => s.ca), 1) * 1.05);
  const x = (i) => P.g + (i * largeurUtile) / Math.max(n - 1, 1);
  const y = (v) => P.h + hauteurUtile - (v / max) * hauteurUtile;

  const pts = serie.map((s, i) => [x(i), y(s.ca)]);
  const ligne = cheminLisse(pts);
  const base = P.h + hauteurUtile;
  const aire = `${ligne} L${x(n - 1)},${base} L${x(0)},${base} Z`;
  const lignePrec = precedente ? cheminLisse(precedente.map((s, i) => [x(i), y(s.ca)])) : null;

  const graduations = [0, 0.25, 0.5, 0.75, 1];
  const nbLabels = Math.min(n, w < 480 ? 4 : 7);
  const indicesLabels = [...new Set(Array.from({ length: nbLabels }, (_, k) => Math.round((k * (n - 1)) / Math.max(nbLabels - 1, 1))))];

  const survol = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * (n - 1));
    setIdx(Math.min(Math.max(i, 0), n - 1));
  };

  const actif = idx !== null ? serie[idx] : null;
  const gauche = idx !== null ? Math.min(Math.max(x(idx), 90), w - 90) : 0;

  return (
    <div ref={ref} className="relative w-full select-none">
      <style>{`
        @keyframes dessiner { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
        @keyframes apparaitre { from { opacity: 0; } to { opacity: 1; } }
        .ca-ligne { stroke-dasharray: 1; animation: dessiner 1s ease-out forwards; }
        .ca-aire { animation: apparaitre 1s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .ca-ligne, .ca-aire { animation: none; stroke-dasharray: none; } }
      `}</style>

      <svg width={w} height={H} className="block overflow-visible">
        <defs>
          <linearGradient id="degradeCA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0E7C66" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#0E7C66" stopOpacity="0" />
          </linearGradient>
        </defs>

        {graduations.map((g) => {
          const valeur = max * g;
          return (
            <g key={g}>
              <line x1={P.g} x2={w - P.d} y1={y(valeur)} y2={y(valeur)} stroke="#12181B" strokeOpacity={g === 0 ? 0.15 : 0.06} strokeDasharray={g === 0 ? undefined : "3 4"} />
              <text x={P.g - 8} y={y(valeur) + 4} textAnchor="end" fontSize="11" fill="#12181B" fillOpacity="0.4">
                {prixCourt(valeur)}
              </text>
            </g>
          );
        })}

        {lignePrec && (
          <path d={lignePrec} fill="none" stroke="#12181B" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round" />
        )}

        <path key={`a-${n}-${max}`} className="ca-aire" d={aire} fill="url(#degradeCA)" />
        <path key={`l-${n}-${max}`} className="ca-ligne" d={ligne} pathLength="1" fill="none" stroke="#0E7C66" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {indicesLabels.map((i, k) => (
          <text key={i} x={x(i)} y={H - 8} fontSize="11" fill="#12181B" fillOpacity="0.4"
            textAnchor={k === 0 ? "start" : k === indicesLabels.length - 1 ? "end" : "middle"}>
            {serie[i].label}
          </text>
        ))}

        {idx !== null && (
          <g pointerEvents="none">
            <line x1={x(idx)} x2={x(idx)} y1={P.h} y2={base} stroke="#12181B" strokeOpacity="0.15" />
            <circle cx={x(idx)} cy={y(serie[idx].ca)} r="5" fill="#fff" stroke="#0E7C66" strokeWidth="2.5" />
          </g>
        )}

        <rect x={P.g} y="0" width={largeurUtile} height={H} fill="transparent"
          onPointerMove={survol} onPointerDown={survol} onPointerLeave={() => setIdx(null)} />
      </svg>

      {actif && (
        <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl border border-[#12181B]/10 bg-white px-3 py-2 text-[12px] shadow-lg" style={{ left: gauche }}>
          <p className="text-[#12181B]/50">{actif.label}</p>
          <p className="text-[14px] font-medium text-[#12181B]">{prix(actif.ca)}</p>
          <p className="text-[#12181B]/50">{actif.commandes} commande{actif.commandes > 1 ? "s" : ""}</p>
          {precedente && <p className="mt-0.5 text-[#12181B]/40">Préc. : {prix(precedente[idx]?.ca)}</p>}
        </div>
      )}

      {precedente && (
        <div className="mt-2 flex items-center gap-4 text-[12px] text-[#12181B]/50">
          <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 rounded bg-[#0E7C66]" /> Période actuelle</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 border-t-2 border-dashed border-[#12181B]/30" /> Période précédente</span>
        </div>
      )}
    </div>
  );
}

/* ---------- Carte de chaleur : jours x heures ---------- */

function CarteChaleur({ matrice, max }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[480px]">
        <div className="grid items-center gap-[3px]" style={{ gridTemplateColumns: "32px repeat(24, minmax(0, 1fr))" }}>
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className="text-center text-[10px] text-[#12181B]/35">
              {h % 3 === 0 ? h : ""}
            </span>
          ))}
          {matrice.map((ligne, j) => (
            <div key={j} className="contents">
              <span className="text-[11px] text-[#12181B]/50">{JOURS_SEMAINE[j]}</span>
              {ligne.map((n, h) => (
                <span
                  key={h}
                  title={`${JOURS_SEMAINE[j]} ${h}h : ${n} commande${n > 1 ? "s" : ""}`}
                  className="aspect-square rounded-[3px]"
                  style={{ background: n === 0 ? "rgba(18,24,27,0.05)" : `rgba(14,124,102,${0.2 + (n / max) * 0.8})` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Objectif mensuel ---------- */

function ObjectifMensuel({ realise }) {
  const [objectif, setObjectif] = useState(() => {
    try { return Number(localStorage.getItem(CLE_OBJECTIF)) || 0; } catch { return 0; }
  });
  const [edition, setEdition] = useState(false);
  const [saisie, setSaisie] = useState("");

  const enregistrer = () => {
    const n = Math.max(Number(saisie) || 0, 0);
    setObjectif(n);
    try { localStorage.setItem(CLE_OBJECTIF, String(n)); } catch { /* ignoré */ }
    setEdition(false);
  };

  const pct = objectif > 0 ? Math.min((realise / objectif) * 100, 100) : 0;

  return (
    <Carte
      titre="Objectif du mois"
      sousTitre="Chiffre d'affaires du mois en cours"
      action={
        !edition && (
          <button onClick={() => { setSaisie(objectif ? String(objectif) : ""); setEdition(true); }} className="text-[12px] text-[#0E7C66] hover:underline">
            {objectif ? "Modifier" : "Définir"}
          </button>
        )
      }
    >
      {edition ? (
        <div className="flex items-center gap-2">
          <input
            type="number" min="0" step="10000" autoFocus value={saisie} onChange={(e) => setSaisie(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enregistrer()}
            placeholder="Ex : 1000000"
            className="h-10 min-w-0 flex-1 rounded-lg border border-[#12181B]/10 px-3 text-[14px] outline-none focus:ring-2 focus:ring-[#12181B]/20"
          />
          <button onClick={enregistrer} className="h-10 rounded-full bg-[#12181B] px-4 text-[13px] font-medium text-[#F6F7F2]">OK</button>
        </div>
      ) : objectif > 0 ? (
        <>
          <div className="flex items-baseline justify-between">
            <p className="text-[22px] font-medium text-[#12181B]">{prix(realise)}</p>
            <p className="text-[13px] text-[#12181B]/50">sur {prix(objectif)}</p>
          </div>
          <div className="mt-3"><Barre pct={pct} color={pct >= 100 ? "#0E7C66" : "#3B82F6"} /></div>
          <p className="mt-2 text-[12px] text-[#12181B]/50">
            {pct >= 100 ? "Objectif atteint, bravo !" : `${pct.toFixed(0)} % atteint · reste ${prix(objectif - realise)}`}
          </p>
        </>
      ) : (
        <p className="py-4 text-center text-[13px] text-[#12181B]/45">Fixe un objectif pour suivre ta progression.</p>
      )}
    </Carte>
  );
}

/* ---------- Pipeline des commandes ---------- */

function CarteStatut({ cle, n, actif, onClick }) {
  const s = STATUTS[cle];
  const Icone = s.icone;
  // Seules les commandes payées demandent une action du commerçant (les expédier)
  const urgent = s.actionnable && n > 0 && cle === "payee";
  return (
    <button
      onClick={onClick}
      aria-pressed={actif}
      className={`relative rounded-2xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12181B] ${actif ? "shadow-md" : "border-[#12181B]/10"}`}
      style={actif ? { borderColor: s.color, boxShadow: `0 0 0 1px ${s.color}` } : undefined}
    >
      {urgent && (
        <span className="absolute right-3 top-3 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: s.color }} />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
        </span>
      )}
      <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${s.color}1A`, color: s.color }}>
        <Icone size={18} />
      </span>
      <p className="mt-3 text-[28px] font-medium leading-none text-[#12181B]">{n}</p>
      <p className="mt-1.5 text-[13px] font-medium text-[#12181B]">{s.action}</p>
      <p className="text-[11px] text-[#12181B]/40">{s.actionnable ? "Toutes dates" : "Sur la période"}</p>
    </button>
  );
}

function LigneCommande({ commande, onOuvrir }) {
  const s = STATUTS[commande.statut] || { label: commande.statut, color: "#12181B" };
  const d = dateCommande(commande);
  const enRetard = ACTIONNABLES.includes(commande.statut) && Date.now() - d.getTime() > JOUR_MS;
  return (
    <button
      type="button"
      onClick={() => onOuvrir(commande)}
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[#12181B]/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12181B]"
    >
      <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: s.color }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-[#12181B]">
          {commande.numero_commande}
          <span className="ml-2 font-normal text-[#12181B]/55">{clientCommande(commande)}</span>
        </p>
        <p className={`text-[12px] ${enRetard ? "font-medium text-amber-600" : "text-[#12181B]/45"}`}>
          {depuis(d)}{enRetard && " · en retard"}{commande.mode_livraison === "retrait" ? " · Retrait" : " · Livraison"}
        </p>
      </div>
      <span className="hidden shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium sm:inline-block" style={{ background: `${s.color}1A`, color: s.color }}>
        {s.label}
      </span>
      <span className="shrink-0 text-[14px] font-medium text-[#12181B]">{prix(totalCommande(commande))}</span>
      <ChevronRight size={16} className="shrink-0 text-[#12181B]/25 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function Squelette() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-72 rounded-xl bg-[#12181B]/10" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
  {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-36 rounded-2xl bg-[#12181B]/10" />)}
</div>
      <div className="h-64 rounded-2xl bg-[#12181B]/10" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-28 rounded-2xl bg-[#12181B]/10" />)}
      </div>
      <div className="h-80 rounded-2xl bg-[#12181B]/10" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function DashboardHome() {
  const { boutique } = useBoutique();
  const { notifier } = useToast();
  const [produits, setProduits] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(false);
  const [actualisation, setActualisation] = useState(false);
  const [derniereMaj, setDerniereMaj] = useState(null);
  const [nouvelles, setNouvelles] = useState(0);
  const [jours, setJours] = useState(30);
  const [decalage, setDecalage] = useState(0);
  const [saisie, setSaisie] = useState("");
  const [filtre, setFiltre] = useState(null);
  const [commandeSelectionnee, setCommandeSelectionnee] = useState(null);
  const idsConnus = useRef(null);

  // Chargement initial + actualisation automatique toutes les 60 s
  const charger = useCallback(async (silencieux) => {
    if (silencieux) setActualisation(true);
    try {
      const [resP, resC] = await Promise.all([catalogueApi.listerProduits(), commandesApi.listerCommandesGestion()]);
      const liste = resC.data.results || resC.data;
      if (idsConnus.current) {
        const nb = liste.filter((c) => !idsConnus.current.has(c.id)).length;
        if (nb > 0) setNouvelles((n) => n + nb);
      }
      idsConnus.current = new Set(liste.map((c) => c.id));
      setProduits(resP.data.results || resP.data);
      setCommandes(liste);
      setDerniereMaj(new Date());
      setErreur(false);
    } catch {
      if (!silencieux) setErreur(true);
    } finally {
      setChargement(false);
      setActualisation(false);
    }
  }, []);

  useEffect(() => {
    charger(false);
    const t = setInterval(() => {
      if (!document.hidden) charger(true);
    }, INTERVALLE_ACTUALISATION_MS);
    return () => clearInterval(t);
  }, [charger]);

  const changerStatut = async (commande, nouveauStatut, commentaire = "") => {
    try {
      await commandesApi.changerStatutCommande(commande.id, nouveauStatut, commentaire);
      // Mise à jour immédiate de l'interface (compteurs, liste), puis resynchronisation
      setCommandes((liste) => liste.map((c) => (c.id === commande.id ? { ...c, statut: nouveauStatut } : c)));
      notifier(`Commande passée à "${STATUTS[nouveauStatut]?.label || nouveauStatut}".`);
      setCommandeSelectionnee(null);
      charger(true);
    } catch (err) {
      const data = err.response?.data;
      const premier = data && typeof data === "object" ? Object.values(data)[0] : data;
      notifier((Array.isArray(premier) ? premier[0] : premier) || "Impossible de changer le statut.", "erreur");
    }
  };

  const enregistrerNoteInterne = async (commande, note) => {
    try {
      await commandesApi.modifierCommande(commande.id, { note_interne: note });
      setCommandes((liste) => liste.map((c) => (c.id === commande.id ? { ...c, note_interne: note } : c)));
      setCommandeSelectionnee((c) => (c ? { ...c, note_interne: note } : c));
      notifier("Note enregistrée.");
    } catch {
      notifier("Impossible d'enregistrer la note.", "erreur");
    }
  };

  const choisirPeriode = (j, d = 0) => {
    setJours(j);
    setDecalage(d);
    setSaisie("");
  };

  const changerSaisie = (e) => {
    const v = e.target.value;
    setSaisie(v);
    const n = parseInt(v, 10);
    if (n >= 1 && n <= 3650) {
      setJours(n);
      setDecalage(0);
    }
  };

  /* ---------- Calculs ---------- */

  const stats = useMemo(() => {
    const maintenant = new Date();
    const aujourdhui = debutDeJour(maintenant);

    let nbJours = jours;
    if (jours === null) {
      const plusAncienne = commandes.reduce((min, c) => {
        const d = dateCommande(c);
        return d < min ? d : min;
      }, maintenant);
      nbJours = Math.max(Math.round((aujourdhui - debutDeJour(plusAncienne)) / JOUR_MS) + 1, 1);
    }

    const finJour = new Date(aujourdhui.getTime() - decalage * JOUR_MS);
    const finExclusive = new Date(finJour.getTime() + JOUR_MS);
    const debut = new Date(finJour.getTime() - (nbJours - 1) * JOUR_MS);
    const debutPrec = new Date(debut.getTime() - nbJours * JOUR_MS);

    const dansPeriode = commandes.filter((c) => {
      const d = dateCommande(c);
      return d >= debut && d < finExclusive;
    });
    const dansPrec = jours === null ? [] : commandes.filter((c) => {
      const d = dateCommande(c);
      return d >= debutPrec && d < debut;
    });

    const resume = (liste) => {
      const payantes = liste.filter((c) => REVENU_STATUTS.includes(c.statut));
      const ca = payantes.reduce((s, c) => s + totalCommande(c), 0);
      return {
        ca,
        nb: liste.filter((c) => c.statut !== "annulee").length,
        panier: payantes.length ? ca / payantes.length : 0,
        clients: new Set(liste.map(cleClient)).size,
      };
    };

    const pas = nbJours <= 90 ? 1 : nbJours <= 365 ? 7 : 30;
    const granularite = nbJours === 1 ? "heure" : pas === 1 ? "jour" : pas === 7 ? "semaine" : "mois";
    const serie = construireSerie(dansPeriode, debut, nbJours, pas);
    const seriePrec = jours === null ? null : construireSerie(dansPrec, debutPrec, nbJours, pas);

    // Statuts en cours : toutes les commandes ; statuts clos : la période choisie
    const pipeline = CLES_STATUTS.map((k) => ({
      cle: k,
      n: (STATUTS[k].actionnable ? commandes : dansPeriode).filter((c) => c.statut === k).length,
    }));

    // Top produits
    const cumul = {};
    dansPeriode.filter((c) => c.statut !== "annulee").forEach((c) => {
      (c.lignes || []).forEach((l) => {
        const qte = Number(l.quantite || 0);
        cumul[l.nom_produit] = cumul[l.nom_produit] || { nom: l.nom_produit, qte: 0, ca: 0 };
        cumul[l.nom_produit].qte += qte;
        cumul[l.nom_produit].ca += Number(l.prix_unitaire || 0) * qte;
      });
    });
    const topProduits = Object.values(cumul).sort((a, b) => b.qte - a.qte).slice(0, 5);

    // Entonnoir et taux d'annulation
    const total = dansPeriode.length;
    const payees = dansPeriode.filter((c) => REVENU_STATUTS.includes(c.statut)).length;
    const livrees = dansPeriode.filter((c) => c.statut === "livree").length;
    const annulees = dansPeriode.filter((c) => c.statut === "annulee").length;
    const entonnoir = [
      { label: "Commandes créées", n: total, color: "#F59E0B" },
      { label: "Payées", n: payees, color: "#0E7C66" },
      { label: "Livrées", n: livrees, color: "#12181B" },
    ];
    const tauxAnnulation = total ? (annulees / total) * 100 : 0;

    // Délai moyen commande → expédition (si l'API renvoie l'historique)
    const delais = dansPeriode.map((c) => {
      const ev = c.historique?.find((h) => h.statut === "expediee");
      return ev ? new Date(ev.date) - dateCommande(c) : null;
    }).filter((d) => d !== null && d >= 0);
    const delaiMoyen = delais.length ? delais.reduce((s, d) => s + d, 0) / delais.length : null;

    // Clients nouveaux ou récurrents (selon leur première commande)
    const premiere = {};
    commandes.forEach((c) => {
      const k = cleClient(c);
      const d = dateCommande(c);
      if (!premiere[k] || d < premiere[k]) premiere[k] = d;
    });
    const clientsPeriode = [...new Set(dansPeriode.map(cleClient))];
    const nouveaux = clientsPeriode.filter((k) => premiere[k] >= debut).length;
    const recurrents = clientsPeriode.length - nouveaux;

    // Livraison ou retrait
    const retraits = dansPeriode.filter((c) => c.mode_livraison === "retrait").length;
    const domicile = total - retraits;

    // Heures et jours de pointe
    const matrice = Array.from({ length: 7 }, () => Array(24).fill(0));
    dansPeriode.filter((c) => c.statut !== "annulee").forEach((c) => {
      const d = dateCommande(c);
      matrice[(d.getDay() + 6) % 7][d.getHours()] += 1;
    });
    const maxChaleur = Math.max(...matrice.flat(), 1);

    // CA du mois calendaire en cours (pour l'objectif)
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    const caMois = commandes
      .filter((c) => REVENU_STATUTS.includes(c.statut) && dateCommande(c) >= debutMois)
      .reduce((s, c) => s + totalCommande(c), 0);

    return {
      actuel: resume(dansPeriode), precedent: resume(dansPrec), serie, seriePrec, granularite, pipeline, topProduits,
      entonnoir, tauxAnnulation, annulees, delaiMoyen, nouveaux, recurrents, retraits, domicile,
      matrice, maxChaleur, caMois, dansPeriode, total,
    };
  }, [commandes, jours, decalage]);

  // En cours : les plus anciennes d'abord ; clos : les plus récentes d'abord
  const listeCommandes = useMemo(() => {
    const aTraiter = !filtre || STATUTS[filtre].actionnable;
    const base = filtre ? commandes.filter((c) => c.statut === filtre) : commandes.filter((c) => ACTIONNABLES.includes(c.statut));
    return [...base].sort((a, b) => (aTraiter ? dateCommande(a) - dateCommande(b) : dateCommande(b) - dateCommande(a)));
  }, [commandes, filtre]);

  const publies = produits.filter((p) => p.statut === "publie").length;
  const alertesStock = produits.filter((p) => p.gestion_stock && p.stock <= p.seuil_alerte_stock).sort((a, b) => a.stock - b.stock);

  const checklist = [
    { fait: Boolean(boutique.logo), label: "Ajouter un logo", lien: "/commercant/parametres" },
    { fait: Boolean(boutique.description), label: "Rédiger une description", lien: "/commercant/parametres" },
    { fait: produits.length > 0, label: "Ajouter un premier produit", lien: "/commercant/produits" },
    { fait: publies > 0, label: "Publier au moins un produit", lien: "/commercant/produits" },
    { fait: (boutique.moyens_paiement_actifs || []).length > 1, label: "Activer un moyen de paiement Mobile Money", lien: "/commercant/parametres" },
  ];
  const etapesRestantes = checklist.filter((c) => !c.fait).length;

  if (chargement) return <Squelette />;
  if (erreur) return <p className="text-[14px] text-red-500">Impossible de charger les données. Réessaie dans un instant.</p>;

  const { actuel, precedent } = stats;
  const maxTop = Math.max(...stats.topProduits.map((p) => p.qte), 1);
  const totalATraiter = stats.pipeline.filter((p) => STATUTS[p.cle].actionnable).reduce((s, p) => s + p.n, 0);
  const periodeLabel = PERIODES.find((p) => p.jours === jours && p.decalage === decalage)?.label || `${jours} jours`;
  const partDomicile = stats.total ? Math.round((stats.domicile / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px] font-medium text-[#12181B]">Bienvenue, {boutique.nom_boutique}</h1>
          <p className="mt-1 text-[14px] text-[#12181B]/60">
            {totalATraiter > 0
              ? `${totalATraiter} commande${totalATraiter > 1 ? "s" : ""} à suivre aujourd'hui.`
              : "Aucune commande en attente de traitement."}
          </p>
        </div>
        <button
          onClick={() => charger(true)}
          disabled={actualisation}
          className="inline-flex items-center gap-2 rounded-full border border-[#12181B]/10 bg-white px-3.5 py-2 text-[12px] text-[#12181B]/60 transition-colors hover:text-[#12181B] disabled:opacity-60"
        >
          <RefreshCw size={13} className={actualisation ? "animate-spin" : ""} />
          {derniereMaj ? `Mis à jour à ${pad2(derniereMaj.getHours())}:${pad2(derniereMaj.getMinutes())}` : "Actualiser"}
        </button>
      </div>

      {/* Nouvelles commandes */}
      {nouvelles > 0 && (
        <div role="status" className="flex items-center gap-3 rounded-2xl border border-[#0E7C66]/25 bg-[#0E7C66]/[0.07] px-4 py-3">
          <Bell size={18} className="shrink-0 text-[#0E7C66]" />
          <p className="flex-1 text-[14px] text-[#12181B]">
            <strong className="font-medium">{nouvelles}</strong> nouvelle{nouvelles > 1 ? "s" : ""} commande{nouvelles > 1 ? "s" : ""} reçue{nouvelles > 1 ? "s" : ""}.
          </p>
          <button onClick={() => setNouvelles(0)} aria-label="Fermer" className="rounded-full p-1 text-[#12181B]/40 hover:bg-[#12181B]/5 hover:text-[#12181B]">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Pipeline */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-medium text-[#12181B]">Commandes par statut</h2>
          {filtre && (
            <button onClick={() => setFiltre(null)} className="text-[12px] text-[#0E7C66] hover:underline">Réinitialiser le filtre</button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.pipeline.map(({ cle, n }) => (
            <CarteStatut key={cle} cle={cle} n={n} actif={filtre === cle} onClick={() => setFiltre(filtre === cle ? null : cle)} />
          ))}
        </div>
      </section>

      {/* Liste selon le statut */}
      <Carte
        titre={filtre ? `Commandes : ${STATUTS[filtre].label.toLowerCase()}` : "À traiter en priorité"}
        sousTitre={!filtre || STATUTS[filtre].actionnable ? "Les plus anciennes en premier" : "Les plus récentes en premier"}
        action={<Link to="/commercant/commandes" className="text-[12px] text-[#0E7C66] hover:underline">Ouvrir toutes les commandes</Link>}
      >
        {listeCommandes.length === 0 ? (
          <Vide texte={filtre ? "Aucune commande avec ce statut." : "Tout est à jour, bravo !"} />
        ) : (
          <div className="-mx-2 divide-y divide-[#12181B]/5">
            {listeCommandes.slice(0, 8).map((c) => (
              <LigneCommande key={c.id} commande={c} onOuvrir={setCommandeSelectionnee} />
            ))}
          </div>
        )}
        {listeCommandes.length > 8 && (
          <p className="mt-2 text-center text-[12px] text-[#12181B]/45">+ {listeCommandes.length - 8} autre{listeCommandes.length - 8 > 1 ? "s" : ""}</p>
        )}
      </Carte>

      {/* Sélecteur de période */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-medium text-[#12181B]">Statistiques</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex flex-wrap rounded-full border border-[#12181B]/10 bg-white p-1">
            {PERIODES.map((p) => (
              <button
                key={p.label}
                onClick={() => choisirPeriode(p.jours, p.decalage)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${jours === p.jours && decalage === p.decalage ? "bg-[#12181B] text-[#F6F7F2]" : "text-[#12181B]/60 hover:text-[#12181B]"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <label className="inline-flex items-center gap-2 rounded-full border border-[#12181B]/10 bg-white py-1 pl-3.5 pr-1.5 text-[13px] text-[#12181B]/60">
            Personnalisé
            <input type="number" min="1" max="3650" value={saisie} onChange={changerSaisie} placeholder="ex : 44"
              className="w-16 rounded-full bg-[#12181B]/5 px-2.5 py-1 text-center text-[13px] text-[#12181B] outline-none" />
            jours
          </label>
          <button
            onClick={() => exporterCSV(stats.dansPeriode, `commandes-${periodeLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`)}
            disabled={stats.dansPeriode.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#12181B]/10 bg-white px-3.5 py-2 text-[13px] text-[#12181B]/70 transition-colors hover:text-[#12181B] disabled:opacity-40"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CarteKpi icone={Wallet} label="Chiffre d'affaires" valeur={prix(actuel.ca)} actuel={actuel.ca} precedent={precedent.ca} />
        <CarteKpi icone={ShoppingBag} label="Commandes" valeur={actuel.nb} actuel={actuel.nb} precedent={precedent.nb} />
        <CarteKpi icone={Receipt} label="Panier moyen" valeur={prix(actuel.panier)} actuel={actuel.panier} precedent={precedent.panier} />
        <CarteKpi icone={Users} label="Clients" valeur={actuel.clients} actuel={actuel.clients} precedent={precedent.clients} />
      </div>

      {/* Indicateurs de performance */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Mini
          icone={Clock} label="Délai de traitement" valeur={formaterDuree(stats.delaiMoyen)} couleur="#3B82F6"
          aide={stats.delaiMoyen === null ? "Pas encore de commande expédiée" : "De la commande à l'expédition"}
        />
        <Mini
          icone={XCircle} label="Taux d'annulation" valeur={`${stats.tauxAnnulation.toFixed(0)} %`} couleur="#EF4444"
          aide={`${stats.annulees} annulée${stats.annulees > 1 ? "s" : ""} sur ${stats.total}`}
        />
        <Mini
          icone={Users} label="Nouveaux clients" valeur={stats.nouveaux} couleur="#0E7C66"
          aide={`${stats.recurrents} client${stats.recurrents > 1 ? "s" : ""} récurrent${stats.recurrents > 1 ? "s" : ""}`}
        />
        <Mini
          icone={stats.domicile >= stats.retraits ? Truck : Store} label="Livraison ou retrait" valeur={stats.total ? `${partDomicile} % domicile` : "—"} couleur="#8B5CF6"
          aide={`${stats.domicile} livraison${stats.domicile > 1 ? "s" : ""} · ${stats.retraits} retrait${stats.retraits > 1 ? "s" : ""}`}
        />
      </div>

      {/* Graphique */}
      <Carte titre={`Chiffre d'affaires par ${stats.granularite}`} sousTitre={`${periodeLabel} · survole la courbe pour le détail`}>
        {actuel.ca > 0 ? <GraphiqueCA serie={stats.serie} precedente={stats.seriePrec} /> : <Vide texte="Aucune vente sur cette période." />}
      </Carte>

      {/* Entonnoir + objectif */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Carte titre="Entonnoir des commandes" sousTitre="Où se perdent les commandes" className="lg:col-span-2">
          {stats.total === 0 ? (
            <Vide texte="Aucune commande sur cette période." />
          ) : (
            <div className="space-y-4">
              {stats.entonnoir.map((e) => (
                <div key={e.label}>
                  <div className="mb-1.5 flex items-center justify-between text-[13px]">
                    <span className="text-[#12181B]/80">{e.label}</span>
                    <span className="text-[#12181B]/50">
                      <strong className="font-medium text-[#12181B]">{e.n}</strong> · {Math.round((e.n / stats.total) * 100)} %
                    </span>
                  </div>
                  <Barre pct={(e.n / stats.total) * 100} color={e.color} />
                </div>
              ))}
            </div>
          )}
        </Carte>
        <ObjectifMensuel realise={stats.caMois} />
      </div>

      {/* Heures de pointe */}
      <Carte titre="Heures et jours de pointe" sousTitre={`${periodeLabel} · pour savoir quand être disponible`}>
        {stats.total === 0 ? <Vide texte="Pas encore de commandes sur cette période." /> : <CarteChaleur matrice={stats.matrice} max={stats.maxChaleur} />}
      </Carte>

      {/* Top produits + stock */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Carte titre="Produits les plus vendus">
          {stats.topProduits.length === 0 ? (
            <Vide texte="Pas encore de ventes sur cette période." />
          ) : (
            <div className="space-y-4">
              {stats.topProduits.map((p, i) => (
                <div key={p.nom}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px]">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#12181B]/[0.06] text-[11px] font-medium text-[#12181B]/60">{i + 1}</span>
                      <span className="truncate text-[#12181B]/80">{p.nom}</span>
                    </span>
                    <span className="shrink-0 text-[#12181B]/50">{p.qte} vendu{p.qte > 1 ? "s" : ""} · {prix(p.ca)}</span>
                  </div>
                  <Barre pct={(p.qte / maxTop) * 100} color="#0E7C66" />
                </div>
              ))}
            </div>
          )}
        </Carte>

        <Carte titre="Alertes de stock" action={<Link to="/commercant/produits" className="text-[12px] text-[#0E7C66] hover:underline">Gérer</Link>}>
          {alertesStock.length === 0 ? (
            <Vide texte="Tous tes stocks sont au bon niveau 👍" />
          ) : (
            <div className="divide-y divide-[#12181B]/5">
              {alertesStock.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 text-[13px]">
                  <span className="flex min-w-0 items-center gap-2 pr-3 text-[#12181B]/80">
                    <AlertTriangle size={14} className={p.stock <= 0 ? "text-red-500" : "text-amber-500"} />
                    <span className="truncate">{p.nom}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${p.stock <= 0 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
                    {p.stock <= 0 ? "Rupture" : `${p.stock} restant${p.stock > 1 ? "s" : ""}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Carte>
      </div>

      {/* Checklist */}
      {etapesRestantes > 0 && (
        <Carte titre={`Complète ta boutique (${etapesRestantes} étape${etapesRestantes > 1 ? "s" : ""} restante${etapesRestantes > 1 ? "s" : ""})`}>
          <div className="grid gap-2 sm:grid-cols-2">
            {checklist.map((item) => (
              <Link key={item.label} to={item.lien} className="flex items-center gap-2.5 text-[13px] text-[#12181B]/80 hover:text-[#12181B]">
                {item.fait ? <CheckCircle2 size={16} className="text-[#0E7C66]" /> : <Circle size={16} className="text-[#12181B]/25" />}
                <span className={item.fait ? "text-[#12181B]/40 line-through" : ""}>{item.label}</span>
              </Link>
            ))}
          </div>
        </Carte>
      )}

      <Link
        to="/commercant/produits"
        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--boutique-primary,#12181B)] px-5 py-2.5 text-[14px] font-medium text-[#F6F7F2] transition-colors duration-300 hover:bg-[var(--boutique-accent,#0E7C66)]"
      >
        <Package size={16} /> Gérer mes produits
      </Link>

      {/* Détail de la commande (même fenêtre que la page Commandes) */}
      <Modal isOpen={Boolean(commandeSelectionnee)} onClose={() => setCommandeSelectionnee(null)} maxWidth="max-w-xl">
        {commandeSelectionnee && (
          <DetailCommande
            commande={commandeSelectionnee}
            onChangerStatut={changerStatut}
            onEnregistrerNote={enregistrerNoteInterne}
          />
        )}
      </Modal>
    </div>
  );
}