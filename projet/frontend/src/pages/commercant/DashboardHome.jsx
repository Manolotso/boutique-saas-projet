import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import { useBoutique } from "../../context/BoutiqueContext";
import { catalogueApi } from "../../api/catalogue";

export default function DashboardHome() {
  const { boutique } = useBoutique();
  const [produits, setProduits] = useState([]);

  useEffect(() => {
    catalogueApi.listerProduits().then((res) => setProduits(res.data.results || res.data));
  }, []);

  const publies = produits.filter((p) => p.statut === "publie").length;
  const enRupture = produits.filter((p) => p.gestion_stock && p.stock <= p.seuil_alerte_stock).length;

  const checklist = [
    { fait: Boolean(boutique.logo), label: "Ajouter un logo", lien: "/commercant/parametres" },
    { fait: Boolean(boutique.description), label: "Rédiger une description", lien: "/commercant/parametres" },
    { fait: produits.length > 0, label: "Ajouter un premier produit", lien: "/commercant/produits" },
    { fait: publies > 0, label: "Publier au moins un produit", lien: "/commercant/produits" },
    {
      fait: (boutique.moyens_paiement_actifs || []).length > 1,
      label: "Activer un moyen de paiement Mobile Money",
      lien: "/commercant/parametres",
    },
  ];
  const etapesRestantes = checklist.filter((c) => !c.fait).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-[24px] font-medium text-[#12181B]">Bienvenue, {boutique.nom_boutique}</h1>
        <p className="text-[14px] text-[#12181B]/60 mt-1">Voici un aperçu de ta boutique.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-[#12181B]/10 rounded-xl p-5">
          <p className="text-[13px] text-[#12181B]/60">Produits publiés</p>
          <p className="text-[28px] font-medium text-[#12181B] mt-1">{publies}</p>
        </div>
        <div className="bg-white border border-[#12181B]/10 rounded-xl p-5">
          <p className="text-[13px] text-[#12181B]/60">Total produits</p>
          <p className="text-[28px] font-medium text-[#12181B] mt-1">{produits.length}</p>
        </div>
        <div className="bg-white border border-[#12181B]/10 rounded-xl p-5">
          <p className="text-[13px] text-[#12181B]/60 flex items-center gap-1.5">
            {enRupture > 0 && <AlertTriangle size={14} className="text-amber-500" />}
            Stock bas
          </p>
          <p className="text-[28px] font-medium text-[#12181B] mt-1">{enRupture}</p>
        </div>
      </div>

      {etapesRestantes > 0 && (
        <div className="bg-white border border-[#12181B]/10 rounded-xl p-5">
          <p className="text-[14px] font-medium text-[#12181B] mb-3">
            Complète ta boutique ({etapesRestantes} étape{etapesRestantes > 1 ? "s" : ""} restante
            {etapesRestantes > 1 ? "s" : ""})
          </p>
          <div className="space-y-2">
            {checklist.map((item) => (
              <Link
                key={item.label}
                to={item.lien}
                className="flex items-center gap-2.5 text-[13px] text-[#12181B]/80 hover:text-[#12181B]"
              >
                {item.fait ? (
                  <CheckCircle2 size={16} className="text-[#0E7C66]" />
                ) : (
                  <Circle size={16} className="text-[#12181B]/25" />
                )}
                <span className={item.fait ? "line-through text-[#12181B]/40" : ""}>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Link
        to="/commercant/produits"
        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--boutique-primary,#12181B)] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[var(--boutique-accent,#0E7C66)] transition-colors duration-300"
      >

        <Package size={16} /> Gérer mes produits
      </Link>
    </div>
  );
}