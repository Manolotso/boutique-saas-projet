import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { commandesApi } from "../../api/commandes";
import { useBoutiquePublique } from "../../context/BoutiquePubliqueContext";

export default function Confirmation() {
  const { numeroCommande } = useParams();
  const { sousDomaine } = useBoutiquePublique();
  const [commande, setCommande] = useState(null);

  useEffect(() => {
    commandesApi.obtenirCommande(numeroCommande).then((res) => setCommande(res.data));
  }, [numeroCommande]);

  return (
    <div className="max-w-lg mx-auto px-6 py-16 text-center">
      <CheckCircle2 size={40} className="text-[var(--boutique-accent,#0E7C66)] mx-auto mb-4" />
      <h1 className="font-display text-[22px] font-medium text-[#12181B]">Commande confirmée</h1>
      <p className="text-[14px] text-[#12181B]/60 mt-2">
        Numéro de commande : <span className="font-medium text-[#12181B]">{numeroCommande}</span>
      </p>
      {commande && (
        <p className="text-[14px] text-[#12181B]/60 mt-1">
          Total : {Number(commande.montant_total).toLocaleString("fr-MG")} Ar
        </p>
      )}
      <div className="flex items-center justify-center gap-3 mt-8">
        <Link
          to={`/boutique/${sousDomaine}/commande/${numeroCommande}/suivi`}
          className="rounded-full bg-[var(--boutique-primary,#12181B)] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[var(--boutique-accent,#0E7C66)] transition-colors"
        >
          Suivre ma commande
        </Link>
        <Link to={`/boutique/${sousDomaine}/catalogue`} className="text-[14px] text-[#12181B]/60 hover:text-[#12181B]">
          Continuer mes achats
        </Link>
      </div>
    </div>
  );
}