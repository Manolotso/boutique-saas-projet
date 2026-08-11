import { useNavigate } from "react-router-dom";
import { useBoutique } from "../../context/BoutiqueContext";
import OnboardingInfos from "../../components/commercant/OnboardingInfos";
import OnboardingBranding from "../../components/commercant/OnboardingBranding";
import OnboardingPaiements from "../../components/commercant/OnboardingPaiements";

const ETAPES = ["infos_boutique", "branding", "paiement"];

export default function Onboarding() {
  const { boutique, chargement, setBoutique } = useBoutique();
  const navigate = useNavigate();

  if (chargement) return <p className="p-8 text-[14px] text-[#12181B]/60">Chargement...</p>;
  if (!boutique) return <p className="p-8 text-[14px] text-[#12181B]/60">Impossible de charger ta boutique.</p>;

  if (boutique.etape_onboarding === "termine") {
    navigate("/commercant", { replace: true });
    return null;
  }

  const indexActuel = ETAPES.indexOf(boutique.etape_onboarding);

  const handleEtapeSuivante = (nouvelleBoutique) => {
    setBoutique(nouvelleBoutique);
    if (nouvelleBoutique.etape_onboarding === "termine") {
      navigate("/commercant", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFAF6] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-8">
          {ETAPES.map((etape, i) => (
            <div key={etape} className={`h-1.5 flex-1 rounded-full ${i <= indexActuel ? "bg-[#12181B]" : "bg-[#12181B]/10"}`} />
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-[#12181B]/10 p-8">
          {boutique.etape_onboarding === "infos_boutique" && (
            <OnboardingInfos boutique={boutique} onSuivant={handleEtapeSuivante} />
          )}
          {boutique.etape_onboarding === "branding" && (
            <OnboardingBranding boutique={boutique} onSuivant={handleEtapeSuivante} />
          )}
          {boutique.etape_onboarding === "paiement" && (
            <OnboardingPaiements boutique={boutique} onSuivant={handleEtapeSuivante} />
          )}
        </div>
      </div>
    </div>
  );
}