import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Smartphone, Truck, ArrowLeft } from "lucide-react";
import { paiementsApi } from "../../api/paiements";
import { useBoutiquePublique } from "../../context/BoutiquePubliqueContext";
import { useToast } from "../../context/ToastContext";

const OPERATEURS = [
  { valeur: "mvola", label: "MVola", Icone: Smartphone },
  { valeur: "orange_money", label: "Orange Money", Icone: Smartphone },
  { valeur: "airtel_money", label: "Airtel Money", Icone: Smartphone },
  { valeur: "livraison", label: "Paiement à la livraison", Icone: Truck },
];

export default function Paiement() {
  const { numeroCommande } = useParams();
  const { sousDomaine, boutique } = useBoutiquePublique();
  const navigate = useNavigate();
  const { notifier } = useToast();

  const [etape, setEtape] = useState("choix"); // "choix" | "code"
  const [operateur, setOperateur] = useState(null);
  const [code, setCode] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);

  const moyensDisponibles = boutique.moyens_paiement_actifs || [];

  const choisirOperateur = async (valeur) => {
    if (valeur === "livraison") {
      // Pas de paiement en ligne à confirmer — la commande reste "en_attente" jusqu'à la livraison
      navigate(`/boutique/${sousDomaine}/commande/${numeroCommande}/confirmation`);
      return;
    }

    setOperateur(valeur);
    setErreur(null);
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

  return (
    <div className="max-w-md mx-auto px-6 py-10">
      <div className="text-center mb-6">
        <p className="text-[13px] text-[#12181B]/50">Paiement de la commande</p>
        <h1 className="font-display text-[20px] font-medium text-[#12181B]">{numeroCommande}</h1>
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-2.5 text-[12px] text-amber-700 mb-6 text-center">
        Environnement de démonstration — aucun paiement réel n'est effectué.
      </div>

      {erreur && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-[13px] text-red-600 mb-4">
          {erreur}
        </div>
      )}

      {etape === "choix" && (
        <div className="space-y-2.5">
          {OPERATEURS.filter((op) => moyensDisponibles.includes(op.valeur)).map(({ valeur, label, Icone }) => (
            <button
              key={valeur}
              onClick={() => choisirOperateur(valeur)}
              disabled={chargement}
              className="w-full flex items-center gap-3 rounded-xl border border-[#12181B]/10 px-4 py-3.5 hover:border-[#12181B]/20 hover:bg-[#12181B]/[0.02] transition-colors disabled:opacity-50"
            >
              <Icone size={18} className="text-[#12181B]/50" />
              <span className="text-[14px] text-[#12181B]">{label}</span>
            </button>
          ))}
        </div>
      )}

      {etape === "code" && (
        <form onSubmit={confirmerCode} className="space-y-5">
          <button
            type="button"
            onClick={() => setEtape("choix")}
            className="flex items-center gap-1 text-[13px] text-[#12181B]/50 hover:text-[#12181B]"
          >
            <ArrowLeft size={14} /> Changer de moyen de paiement
          </button>

          <p className="text-[13px] text-[#12181B]/60 text-center">
            Un code de confirmation a été envoyé à ton adresse email. Il expire dans 5 minutes.
          </p>

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            required
            className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[18px] tracking-[0.3em] text-center text-[#12181B] placeholder:text-[#12181B]/30 focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
          />

          <button
            type="submit"
            disabled={chargement}
            className="w-full rounded-full bg-[var(--boutique-primary,#12181B)] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[var(--boutique-accent,#0E7C66)] transition-colors disabled:opacity-50"
          >
            {chargement ? "Vérification..." : "Confirmer le paiement"}
          </button>
        </form>
      )}

      <Link
        to={`/boutique/${sousDomaine}`}
        className="block text-center text-[13px] text-[#12181B]/40 hover:text-[#12181B]/60 mt-6"
      >
        Retour à la boutique
      </Link>
    </div>
  );
}