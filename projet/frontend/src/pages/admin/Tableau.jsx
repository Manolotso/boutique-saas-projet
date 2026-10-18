import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Store, Users, Package, ReceiptText, Wallet, Sparkles, ArrowRight } from "lucide-react";
import { adminApi } from "../../api/admin";
import Skeleton from "../../components/ui/Skeleton";

const ar = (n) => `${Math.round(Number(n) || 0).toLocaleString("fr-MG")} Ar`;
const nb = (n) => Number(n || 0).toLocaleString("fr-MG");

const STATUTS_COMMANDE = {
  en_attente: ["En attente", "bg-amber-50 text-amber-600"],
  confirmee: ["Confirmée", "bg-blue-50 text-blue-600"],
  payee: ["Payée", "bg-emerald-50 text-emerald-600"],
  expediee: ["Expédiée", "bg-indigo-50 text-indigo-600"],
  livree: ["Livrée", "bg-emerald-50 text-emerald-700"],
  annulee: ["Annulée", "bg-red-50 text-red-500"],
};

function Carte({ icone: Icone, titre, valeur, detail, couleur = "#0E7C66" }) {
  return (
    <div className="rounded-2xl border border-[#12181B]/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[#12181B]/55">{titre}</p>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${couleur}1A`, color: couleur }}
        >
          <Icone size={17} />
        </span>
      </div>
      <p className="mt-3 font-display text-[26px] font-medium leading-none text-[#12181B]">{valeur}</p>
      {detail && <p className="mt-2 text-[12px] text-[#12181B]/50">{detail}</p>}
    </div>
  );
}

function Graphique({ serie }) {
  const max = Math.max(...serie.map((j) => j.ca), 1);
  return (
    <div>
      <div className="flex h-44 items-end gap-[3px]">
        {serie.map((j) => (
          <div key={j.jour} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t bg-[#0E7C66]/80 transition-colors group-hover:bg-[#0E7C66]"
              style={{ height: `${Math.max((j.ca / max) * 100, j.ca > 0 ? 4 : 1)}%`, opacity: j.ca > 0 ? 1 : 0.2 }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#12181B] px-2.5 py-1.5 text-[11px] text-white group-hover:block">
              {new Date(j.jour).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
              <br />
              {ar(j.ca)} · {j.commandes} cmd
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-[#12181B]/40">
        <span>{new Date(serie[0].jour).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span>
        <span>Aujourd'hui</span>
      </div>
    </div>
  );
}

export default function Tableau() {
  const [d, setD] = useState(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    adminApi.statistiques().then((res) => setD(res.data)).catch(() => setErreur(true));
  }, []);

  if (erreur) {
    return <p className="py-20 text-center text-[14px] text-[#12181B]/60">Impossible de charger les statistiques.</p>;
  }
  if (!d) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const tauxIndex = d.produits.publies ? Math.round((d.produits.indexes / d.produits.publies) * 100) : 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[24px] font-medium text-[#12181B]">Tableau de bord</h1>
        <p className="mt-1 text-[13px] text-[#12181B]/50">Vue d'ensemble de la plateforme.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Carte
          icone={Wallet}
          titre="Chiffre d'affaires"
          valeur={ar(d.commandes.ca_total)}
          detail={`${ar(d.commandes.ca_30j)} sur 30 jours`}
        />
        <Carte
          icone={ReceiptText}
          titre="Commandes"
          valeur={nb(d.commandes.total)}
          detail={`${nb(d.commandes.en_attente)} en attente · ${nb(d.commandes.annulees)} annulée(s)`}
          couleur="#2563EB"
        />
        <Carte
          icone={Store}
          titre="Boutiques"
          valeur={nb(d.boutiques.total)}
          detail={`${nb(d.boutiques.actif)} actives · ${nb(d.boutiques.en_essai)} en essai · ${nb(d.boutiques.suspendu)} suspendue(s)`}
          couleur="#E2A33B"
        />
        <Carte
          icone={Users}
          titre="Utilisateurs"
          valeur={nb(d.utilisateurs.total)}
          detail={`${nb(d.utilisateurs.client)} clients · ${nb(d.utilisateurs.commercant)} commerçants · +${nb(d.utilisateurs.nouveaux_30j)} en 30 j`}
          couleur="#7C3AED"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-[#12181B]/10 bg-white p-5 lg:col-span-2">
          <h2 className="text-[15px] font-medium text-[#12181B]">Chiffre d'affaires, 30 derniers jours</h2>
          <p className="mb-4 mt-0.5 text-[12px] text-[#12181B]/45">Commandes payées, expédiées ou livrées.</p>
          <Graphique serie={d.serie} />
        </section>

        <section className="rounded-2xl border border-[#12181B]/10 bg-white p-5">
          <h2 className="text-[15px] font-medium text-[#12181B]">Meilleures boutiques</h2>
          {d.top_boutiques.length === 0 ? (
            <p className="mt-4 text-[13px] text-[#12181B]/50">Aucune vente pour l'instant.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {d.top_boutiques.map((b, i) => (
                <li key={b.nom} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#12181B]/[0.06] text-[12px] font-medium text-[#12181B]/70">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-[#12181B]">{b.nom}</p>
                    <p className="text-[11px] text-[#12181B]/45">{b.commandes} commande(s)</p>
                  </div>
                  <span className="text-[13px] font-medium text-[#12181B]">{ar(b.ca)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-[#12181B]/10 bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-[#12181B]">Dernières commandes</h2>
            <Link to="/admin/boutiques" className="inline-flex items-center gap-1 text-[12px] text-[#12181B]/55 hover:text-[#12181B]">
              Boutiques <ArrowRight size={13} />
            </Link>
          </div>
          {d.commandes_recentes.length === 0 ? (
            <p className="mt-4 text-[13px] text-[#12181B]/50">Aucune commande.</p>
          ) : (
            <div className="mt-3 divide-y divide-[#12181B]/[0.06]">
              {d.commandes_recentes.map((c) => {
                const [label, classe] = STATUTS_COMMANDE[c.statut] || [c.statut, "bg-[#12181B]/5 text-[#12181B]/60"];
                return (
                  <div key={c.numero} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-[#12181B]">{c.numero}</p>
                      <p className="truncate text-[12px] text-[#12181B]/50">
                        {c.boutique} · {new Date(c.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${classe}`}>{label}</span>
                    <span className="w-28 text-right text-[13px] font-medium text-[#12181B]">{ar(c.montant)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <Carte
            icone={Package}
            titre="Produits publiés"
            valeur={nb(d.produits.publies)}
            detail={`${nb(d.produits.total)} au total`}
            couleur="#0E7C66"
          />
          <Carte
            icone={Sparkles}
            titre="Recherche intelligente"
            valeur={`${tauxIndex} %`}
            detail={`${nb(d.produits.indexes)} / ${nb(d.produits.publies)} produits indexés · ${nb(d.recommandation.evenements_30j)} événements en 30 j`}
            couleur="#DB2777"
          />
        </section>
      </div>
    </div>
  );
}