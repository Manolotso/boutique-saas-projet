import { useEffect, useState } from "react";
import { tenantsApi } from "../../api/tenants";
import { Link } from "react-router-dom";
import OnboardingInfos from "../../components/commercant/OnboardingInfos";
import OnboardingBranding from "../../components/commercant/OnboardingBranding";
import OnboardingPaiements from "../../components/commercant/OnboardingPaiements";

function MadagascarFlagBackground() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1500px] h-[950px] opacity-[0.16] flex rounded-[48px] overflow-hidden rotate-[-2deg] shadow-[0_0_120px_40px_rgba(0,0,0,0.02)]">
        {/* Bande blanche verticale (1/3 gauche) */}
        <div className="w-1/3 h-full bg-white" />
        {/* Bandes rouge / verte horizontales (2/3 droite) */}
        <div className="w-2/3 h-full flex flex-col">
          <div className="h-1/2 w-full bg-[#FC3D32]" />
          <div className="h-1/2 w-full bg-[#007E49]" />
        </div>
      </div>
    </div>
  );
}

export default function CommercantDashboard() {
  const [boutique, setBoutique] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    tenantsApi
      .obtenirMaBoutique()
      .then((res) => setBoutique(res.data))
      .finally(() => setChargement(false));
  }, []);

  if (chargement) {
    return (
      <div className="relative min-h-screen bg-[#FBFAF6] flex items-center justify-center">
        <MadagascarFlagBackground />
        <p className="relative z-10 text-[#12181B]/60 text-[14px]">Chargement...</p>
      </div>
    );
  }

  if (!boutique) {
    return (
      <div className="relative min-h-screen bg-[#FBFAF6] flex items-center justify-center">
        <MadagascarFlagBackground />
        <p className="relative z-10 text-[#12181B]/60 text-[14px]">Impossible de charger ta boutique.</p>
      </div>
    );
  }

  if (boutique.etape_onboarding !== "termine") {
    return <OnboardingWizard boutique={boutique} onEtapeSuivante={setBoutique} />;
  }

  return (
    <div className="relative min-h-screen bg-[#FBFAF6] p-8">
      <MadagascarFlagBackground />
      <div className="relative z-10">
        <h1 className="font-display text-[24px] font-medium text-[#12181B]">
          Bienvenue, {boutique.nom_boutique}
        </h1>
        <Link
          to="/commercant/produits"
          className="inline-flex items-center gap-1.5 mt-4 rounded-full bg-[#12181B] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[#0E7C66] transition-colors duration-300"
        >
          Gérer mes produits
        </Link>
      </div>
    </div>
  );
}

function OnboardingWizard({ boutique, onEtapeSuivante }) {
  const ETAPES = ["infos_boutique", "branding", "paiement"];
  const indexActuel = ETAPES.indexOf(boutique.etape_onboarding);

  return (
    <div className="relative min-h-screen bg-[#FBFAF6] flex items-center justify-center px-4 py-12">
      <MadagascarFlagBackground />

      <div className="relative z-10 w-full max-w-lg">
        <div className="flex items-center gap-2 mb-8">
          {ETAPES.map((etape, i) => (
            <div
              key={etape}
              className={`h-1.5 flex-1 rounded-full ${
                i <= indexActuel ? "bg-[#12181B]" : "bg-[#12181B]/10"
              }`}
            />
          ))}
        </div>

        <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_8px_32px_rgba(18,24,27,0.08)] p-8">
  {boutique.etape_onboarding === "infos_boutique" && (
    <OnboardingInfos boutique={boutique} onSuivant={onEtapeSuivante} />
  )}
  {boutique.etape_onboarding === "branding" && (
    <OnboardingBranding boutique={boutique} onSuivant={onEtapeSuivante} />
  )}
  {boutique.etape_onboarding === "paiement" && (
    <OnboardingPaiements boutique={boutique} onSuivant={onEtapeSuivante} />
  )}
</div>
      </div>
    </div>
  );
}