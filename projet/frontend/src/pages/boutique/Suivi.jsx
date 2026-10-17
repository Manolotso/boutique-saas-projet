import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Package, CheckCircle2, XCircle, Check, ShoppingBag, Truck, Store, MapPin, User, Phone, ArrowLeft,
} from "lucide-react";
import { commandesApi } from "../../api/commandes";
import { useBoutiquePublique } from "../../context/BoutiquePubliqueContext";
import Skeleton from "../../components/ui/Skeleton";

// Même largeur que le reste de la vitrine, avec une colonne centrale
const CONTENEUR = "w-full px-4 sm:px-6 lg:px-8 2xl:px-12";

const ETAPES_NORMALES = ["en_attente", "confirmee", "payee", "expediee", "livree"];
const LABELS_STATUT = {
  en_attente: "En attente",
  confirmee: "Confirmée",
  payee: "Payée",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
};

const formaterDate = (d) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const formaterDateHeure = (d) =>
  new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function Carte({ titre, icone: Icone, children }) {
  return (
    <section className="rounded-2xl border border-[#12181B]/10 bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#12181B]/[0.05] text-[#12181B]/70">
          <Icone size={18} />
        </span>
        <h2 className="text-[15px] font-medium text-[#12181B]">{titre}</h2>
      </div>
      {children}
    </section>
  );
}

export default function Suivi() {
  const { numeroCommande } = useParams();
  const { sousDomaine, boutique } = useBoutiquePublique();
  const [commande, setCommande] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    setChargement(true);
    setErreur(false);
    commandesApi
      .obtenirCommande(numeroCommande)
      .then((res) => setCommande(res.data))
      .catch(() => setErreur(true))
      .finally(() => setChargement(false));
  }, [numeroCommande]);

  if (chargement) {
    return (
      <div className={`${CONTENEUR} py-6 sm:py-10`}>
        <div className="mx-auto w-full max-w-3xl space-y-4">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (erreur || !commande) {
    return (
      <div className={`${CONTENEUR} flex justify-center py-16`}>
        <div className="w-full max-w-sm rounded-3xl border border-[#12181B]/10 bg-white p-10 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#12181B]/5">
            <Package size={22} className="text-[#12181B]/40" />
          </span>
          <p className="mt-4 text-[14px] text-[#12181B]/60">
            Cette commande n'existe pas, ou tu n'as pas accès à son suivi.
          </p>
          <Link
            to={`/boutique/${sousDomaine}`}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-[#12181B] px-5 text-[13px] font-medium text-[#F6F7F2] transition-colors hover:bg-[#12181B]/90"
          >
            Retour à la boutique
          </Link>
        </div>
      </div>
    );
  }

  const devise = boutique.devise;
  const formater = (n) => Number(n).toLocaleString("fr-MG");
  const estAnnulee = commande.statut === "annulee";
  const indexActuel = ETAPES_NORMALES.indexOf(commande.statut);
  const estRetrait = commande.mode_livraison === "retrait";

  return (
    <div className={`${CONTENEUR} py-6 sm:py-10`}>
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Link
          to={`/boutique/${sousDomaine}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#12181B]/55 transition-colors hover:text-[#12181B]"
        >
          <ArrowLeft size={14} /> Retour à la boutique
        </Link>

        {/* En-tête */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[13px] text-[#12181B]/50">Commande</p>
            <h1 className="font-display text-[24px] font-medium text-[#12181B] sm:text-[28px]">
              {commande.numero_commande}
            </h1>
            <p className="mt-1 text-[13px] text-[#12181B]/50">Passée le {formaterDate(commande.date_commande)}</p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium ${
              estAnnulee ? "bg-red-50 text-red-600" : "bg-[#12181B]/[0.05] text-[#12181B]"
            }`}
            style={!estAnnulee ? { backgroundColor: "color-mix(in srgb, var(--boutique-accent, #0E7C66) 12%, white)", color: "var(--boutique-accent, #0E7C66)" } : undefined}
          >
            {estAnnulee ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
            {LABELS_STATUT[commande.statut] || commande.statut}
          </span>
        </div>

        {/* Timeline */}
        <section className="rounded-2xl border border-[#12181B]/10 bg-white p-5 sm:p-6">
          {estAnnulee ? (
            <div className="flex items-start gap-3">
              <XCircle size={22} className="mt-0.5 shrink-0 text-red-500" />
              <div>
                <p className="text-[15px] font-medium text-[#12181B]">Commande annulée</p>
                {commande.motif_annulation && (
                  <p className="mt-1 text-[13px] text-[#12181B]/60">{commande.motif_annulation}</p>
                )}
              </div>
            </div>
          ) : (
            <ol className="flex flex-col sm:flex-row">
              {ETAPES_NORMALES.map((etape, i) => {
                const franchie = i <= indexActuel;
                const courante = i === indexActuel;
                const evenement = commande.historique?.find((h) => h.statut === etape);
                const dernier = i === ETAPES_NORMALES.length - 1;
                return (
                  <li key={etape} className="flex flex-1 gap-3 sm:flex-col sm:gap-0">
                    <div className="flex flex-col items-center sm:w-full sm:flex-row">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-[12px] transition-colors ${
                          franchie
                            ? "border-[var(--boutique-accent,#0E7C66)] bg-[var(--boutique-accent,#0E7C66)] text-white"
                            : "border-[#12181B]/15 bg-white text-[#12181B]/30"
                        } ${courante ? "ring-4 ring-[var(--boutique-accent,#0E7C66)]/20" : ""}`}
                      >
                        {franchie ? <Check size={16} strokeWidth={3} /> : i + 1}
                      </span>
                      {!dernier && (
                        <span
                          className={`min-h-[28px] w-0.5 flex-1 sm:h-0.5 sm:min-h-0 sm:w-auto ${
                            i < indexActuel ? "bg-[var(--boutique-accent,#0E7C66)]" : "bg-[#12181B]/10"
                          }`}
                        />
                      )}
                    </div>
                    <div className="pb-5 sm:pb-0 sm:pr-2 sm:pt-3">
                      <p className={`text-[14px] ${franchie ? "font-medium text-[#12181B]" : "text-[#12181B]/40"}`}>
                        {LABELS_STATUT[etape]}
                      </p>
                      {evenement && (
                        <p className="mt-0.5 text-[12px] text-[#12181B]/45">{formaterDateHeure(evenement.date)}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* Récapitulatif */}
        <Carte titre="Récapitulatif" icone={ShoppingBag}>
          <ul className="divide-y divide-[#12181B]/10">
            {commande.lignes?.map((ligne) => (
              <li key={ligne.id} className="flex items-start justify-between gap-3 py-3 text-[13px]">
                <div className="min-w-0">
                  <p className="font-medium text-[#12181B]">{ligne.nom_produit}</p>
                  <p className="mt-0.5 text-[#12181B]/50">
                    {ligne.variante_label ? `${ligne.variante_label} · ` : ""}Quantité : {ligne.quantite}
                  </p>
                </div>
                <span className="shrink-0 text-[#12181B]/80">
                  {formater(ligne.quantite * Number(ligne.prix_unitaire))} {devise}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-2 space-y-2 border-t border-[#12181B]/10 pt-4 text-[14px]">
            <div className="flex justify-between text-[#12181B]/70">
              <dt>Sous-total</dt>
              <dd>{formater(commande.montant_sous_total)} {devise}</dd>
            </div>
            {Number(commande.frais_livraison) > 0 && (
              <div className="flex justify-between text-[#12181B]/70">
                <dt>Livraison</dt>
                <dd>{formater(commande.frais_livraison)} {devise}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-[#12181B]/10 pt-3 text-[17px] font-medium text-[#12181B]">
              <dt>Total</dt>
              <dd>{formater(commande.montant_total)} {devise}</dd>
            </div>
          </dl>
        </Carte>

        {/* Livraison */}
        <Carte titre={estRetrait ? "Retrait en boutique" : "Livraison à domicile"} icone={estRetrait ? Store : Truck}>
          <ul className="space-y-2.5 text-[14px] text-[#12181B]/70">
            <li className="flex items-center gap-2.5">
              <User size={15} className="shrink-0 text-[#12181B]/40" />
              {commande.nom_destinataire}
            </li>
            <li className="flex items-center gap-2.5">
              <Phone size={15} className="shrink-0 text-[#12181B]/40" />
              {commande.telephone_destinataire}
            </li>
            {commande.adresse_complete && (
              <li className="flex items-start gap-2.5">
                <MapPin size={15} className="mt-0.5 shrink-0 text-[#12181B]/40" />
                {commande.adresse_complete}
              </li>
            )}
          </ul>
        </Carte>
      </div>
    </div>
  );
}