import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const CLASSE_BOUTON =
  "relative inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#12181B]/10 bg-white px-3 text-[13px] font-medium text-[#12181B]/80 transition-colors hover:bg-[#12181B]/5 hover:text-[#12181B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12181B] lg:px-4";

export default function BoutonDecouvrir() {
  const { utilisateur } = useAuth();
  if (utilisateur?.role !== "client") return null;

  return (
    <Link to="/decouvrir" className={CLASSE_BOUTON} aria-label="Retour à Découvrir">
      <Compass size={18} />
      <span className="hidden lg:inline">Découvrir</span>
    </Link>
  );
}