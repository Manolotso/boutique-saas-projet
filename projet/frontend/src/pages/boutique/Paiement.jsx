import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Smartphone, Truck, ArrowLeft, ChevronRight, AlertCircle, ShieldCheck, Info, Mail } from "lucide-react";
import { paiementsApi } from "../../api/paiements";
import { useBoutiquePublique } from "../../context/BoutiquePubliqueContext";
import { useToast } from "../../context/ToastContext";

// Même largeur que le reste de la vitrine, avec une colonne centrale étroite
const CONTENEUR = "w-full px-4 sm:px-6 lg:px-8 2xl:px-12";

const OPERATEURS = [
  { valeur: "mvola", label: "MVola", aide: "Validation sur ton téléphone", Icone: Smartphone, couleur: "#F5B800" },
  { valeur: "orange_money", label: "Orange Money", aide: "Code de confirmation par email", Icone: Smartphone, couleur: "#FF7900" },
  { valeur: "airtel_money", label: "Airtel Money", aide: "Code de confirmation par email", Icone: Smartphone, couleur: "#ED1C24" },
  { valeur: "livraison", label: "Paiement à la livraison", aide: "Tu paies quand tu reçois ta commande", Icone: Truck, couleur: "#4B5150" },
];

const INTERVALLE_SONDAGE_MS = 4000;
const DELAI_ATTENTE_MS = 3 * 60 * 1000; // on arrête d'attendre la validation après 3 minutes

const champ =
  "w-full rounded-lg border border-[#12181B]/10 bg-white px-3.5 py-3 text-[16px] text-[#12181B] placeholder:text-[#12181B]/30 focus:outline-none focus:ring-2 focus:ring-[#12181B]/20 transition-shadow";

const boutonPrincipal =
  "h-12 w-full rounded-full bg-[var(--boutique-primary,#12181B)] px-6 text-[15px] font-medium text-[#F6F7F2] transition-colors hover:bg-[var(--boutique-accent,#0E7C66)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12181B] focus-visible:ring-offset-2 disabled:opacity-50";

function BoutonRetour({ onClick, children = "Changer de moyen de paiement" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-[13px] text-[#12181B]/55 transition-colors hover:text-[#12181B]"
    >
      <ArrowLeft size={14} /> {children}
    </button>
  );
}

export default function Paiement() {
  const { numeroCommande } = useParams();
  const { sousDomaine, boutique } = useBoutiquePublique();
  const navigate = useNavigate();
  const { notifier } = useToast();

  const [etape, setEtape] = useState("choix"); // "choix" | "telephone" | "attente" | "code"
  const [operateur, setOperateur] = useState(null);
  const [code, setCode] = useState("");
  const [telephone, setTelephone] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);

  const moyensDisponibles = boutique.moyens_paiement_actifs || [];
  const operateursAffiches = OPERATEURS.filter((op) => moyensDisponibles.includes(op.valeur));
  const operateurActuel = OPERATEURS.find((op) => op.valeur === operateur);

  // Pendant que le client valide sur son téléphone (MVola), on demande régulièrement au serveur
  // où en est le paiement.
  useEffect(() => {
    if (etape !== "attente") return;

    let annule = false;
    const debut = Date.now();

    const intervalle = setInterval(async () => {
      if (Date.now() - debut > DELAI_ATTENTE_MS) {
        clearInterval(intervalle);
        setErreur("Pas de confirmation reçue. Réessaie, ou choisis un autre moyen de paiement.");
        setEtape("choix");
        return;
      }
      try {
        const { data } = await paiementsApi.statutPaiement(numeroCommande);
        if (annule) return;
        if (data.statut === "reussi") {
          clearInterval(intervalle);
          navigate(`/boutique/${sousDomaine}/commande/${numeroCommande}/confirmation`);
        } else if (data.statut === "echoue") {
          clearInterval(intervalle);
          setErreur("Le paiement a été refusé ou annulé. Tu peux réessayer.");
          setEtape("choix");
        }
      } catch {
        // Erreur réseau passagère : on réessaiera au prochain tour.
      }
    }, INTERVALLE_SONDAGE_MS);

    return () => {
      annule = true;
      clearInterval(intervalle);
    };
  }, [etape, numeroCommande, navigate, sousDomaine]);

  const choisirOperateur = async (valeur) => {
    if (valeur === "livraison") {
      // Pas de paiement en ligne à confirmer — la commande reste "en_attente" jusqu'à la livraison
      navigate(`/boutique/${sousDomaine}/commande/${numeroCommande}/confirmation`);
      return;
    }

    setOperateur(valeur);
    setErreur(null);

    if (valeur === "mvola") {
      // MVola : on demande d'abord le numéro du client, la validation se fait sur son téléphone.
      setEtape("telephone");
      return;
    }

    setChargement(true);
    try {
      await paiementsApi.initierPaiement(numeroCommande, valeur);
      setEtape("code");
      notifier("Code de confirmation envoyé par email.");
    } catch (err) {
      setErreur(err.response?.data?.detail || "Impossible d'initier le paiement.");
    } finally {
      setChargement(false);
    }
  };

  const envoyerTelephone = async (e) => {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      await paiementsApi.initierPaiement(numeroCommande, "mvola", telephone);
      setEtape("attente");
    } catch (err) {
      setErreur(err.response?.data?.detail || "Impossible d'initier le paiement.");
    } finally {
      setChargement(false);
    }
  };

  const confirmerCode = async (e) => {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      await paiementsApi.confirmerPaiement(numeroCommande, code);
      navigate(`/boutique/${sousDomaine}/commande/${numeroCommande}/confirmation`);
    } catch (err) {
      setErreur(err.response?.data?.detail || "Code incorrect.");
    } finally {
      setChargement(false);
    }
  };

  const titres = {
    choix: "Choisis ton moyen de paiement",
    telephone: "Paiement MVola",
    attente: "En attente de validation",
    code: operateurActuel ? `Paiement ${operateurActuel.label}` : "Confirmation du paiement",
  };

  return (
    <div className={`${CONTENEUR} py-6 sm:py-10`}>
      <div className="mx-auto w-full max-w-lg">
        {/* En-tête */}
        <div className="mb-6 text-center">
          <p className="text-[13px] text-[#12181B]/50">Commande</p>
          <p className="mt-0.5 font-mono text-[14px] font-medium text-[#12181B]">{numeroCommande}</p>
          <h1 className="mt-4 font-display text-[24px] font-medium text-[#12181B] sm:text-[28px]">
            {titres[etape]}
          </h1>
        </div>

        <div className="rounded-2xl border border-[#12181B]/10 bg-white p-5 sm:p-7">
          <p className="mb-5 flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-2.5 text-[12px] text-amber-700">
            <Info size={14} className="mt-0.5 shrink-0" />
            Environnement de démonstration : aucun paiement réel n'est effectué.
          </p>

          {erreur && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-600"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {erreur}
            </div>
          )}

          {/* ===== Choix du moyen de paiement ===== */}
          {etape === "choix" && (
            <>
              {operateursAffiches.length === 0 ? (
                <p className="py-6 text-center text-[14px] text-[#12181B]/55">
                  Aucun moyen de paiement n'est disponible pour cette boutique.
                </p>
              ) : (
                <ul className="space-y-3">
                  {operateursAffiches.map(({ valeur, label, aide, Icone, couleur }) => (
                    <li key={valeur}>
                      <button
                        onClick={() => choisirOperateur(valeur)}
                        disabled={chargement}
                        className="group flex w-full items-center gap-4 rounded-xl border border-[#12181B]/10 p-4 text-left transition-colors hover:border-[#12181B]/30 hover:bg-[#12181B]/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12181B] disabled:opacity-50"
                      >
                        <span
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${couleur}1F`, color: couleur }}
                        >
                          <Icone size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-medium text-[#12181B]">{label}</span>
                          <span className="mt-0.5 block text-[12px] text-[#12181B]/50">{aide}</span>
                        </span>
                        <ChevronRight
                          size={18}
                          className="shrink-0 text-[#12181B]/30 transition-transform group-hover:translate-x-0.5"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {/* ===== Numéro MVola ===== */}
          {etape === "telephone" && (
            <form onSubmit={envoyerTelephone} className="space-y-5">
              <BoutonRetour onClick={() => setEtape("choix")} />

              <div className="space-y-1.5">
                <label htmlFor="tel-mvola" className="block text-[13px] font-medium text-[#12181B]/70">
                  Numéro MVola
                </label>
                <input
                  id="tel-mvola"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="034 12 345 67"
                  required
                  className={champ}
                />
                {/* À retirer quand on passera en production : seuls les numéros de test MVola fonctionnent en sandbox. */}
                <p className="text-[12px] text-[#12181B]/50">
                  En environnement de test MVola, utilise le numéro de test 034 35 000 03.
                </p>
              </div>

              <button type="submit" disabled={chargement} className={boutonPrincipal}>
                {chargement ? "Envoi de la demande..." : "Payer avec MVola"}
              </button>
            </form>
          )}

          {/* ===== Attente de validation ===== */}
          {etape === "attente" && (
            <div className="space-y-5 py-4 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-[3px] border-[#12181B]/10 border-t-[var(--boutique-accent,#0E7C66)]" />
              <div>
                <p className="text-[16px] font-medium text-[#12181B]">Valide le paiement sur ton téléphone</p>
                <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-[#12181B]/60">
                  Une demande MVola vient d'être envoyée au{" "}
                  <span className="font-medium text-[#12181B]">{telephone}</span>. Cette page se met à jour
                  automatiquement dès que tu as validé.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEtape("choix")}
                className="text-[13px] text-[#12181B]/55 underline underline-offset-2 transition-colors hover:text-[#12181B]"
              >
                Annuler et choisir un autre moyen de paiement
              </button>
            </div>
          )}

          {/* ===== Code de confirmation ===== */}
          {etape === "code" && (
            <form onSubmit={confirmerCode} className="space-y-5">
              <BoutonRetour onClick={() => setEtape("choix")} />

              <div className="flex items-start gap-3 rounded-lg bg-[#12181B]/[0.04] px-4 py-3">
                <Mail size={18} className="mt-0.5 shrink-0 text-[#12181B]/50" />
                <p className="text-[13px] leading-relaxed text-[#12181B]/70">
                  Un code de confirmation a été envoyé à ton adresse email. Il expire dans 5 minutes.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="code-confirmation" className="block text-center text-[13px] font-medium text-[#12181B]/70">
                  Code à 6 chiffres
                </label>
                <input
                  id="code-confirmation"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  required
                  className={`${champ} py-3.5 text-center text-[22px] tracking-[0.4em]`}
                />
              </div>

              <button type="submit" disabled={chargement || code.length < 6} className={boutonPrincipal}>
                {chargement ? "Vérification..." : "Confirmer le paiement"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-[#12181B]/45">
          <ShieldCheck size={14} />
          Paiement sécurisé
        </p>

        <Link
          to={`/boutique/${sousDomaine}`}
          className="mt-4 block text-center text-[13px] text-[#12181B]/45 transition-colors hover:text-[#12181B]"
        >
          Retour à la boutique
        </Link>
      </div>
    </div>
  );
}