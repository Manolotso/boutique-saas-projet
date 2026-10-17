import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import { tenantsApi } from "../../../api/tenants";
import { useToast } from "../../../context/ToastContext";

/* Carte réutilisable : titre + description + contenu */
function Section({ titre, description, children, className = "" }) {
  return (
    <section className={`rounded-xl border border-[#12181B]/10 bg-white p-5 ${className}`}>
      <h3 className="text-[15px] font-medium text-[#12181B]">{titre}</h3>
      {description && <p className="mt-1 text-[13px] text-[#12181B]/50">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/* Bouton de sélection de fichier stylé (remplace l'input natif) */
function BoutonFichier({ id, fichier, onChange }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <label
        htmlFor={id}
        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#12181B]/15 px-3.5 py-2 text-[13px] font-medium text-[#12181B] cursor-pointer hover:bg-[#12181B]/[0.04] transition-colors"
      >
        <Upload size={15} />
        Choisir une image
      </label>
      <input id={id} type="file" accept="image/*" onChange={(e) => onChange(e.target.files?.[0] || null)} className="sr-only" />
      <span className="truncate text-[12px] text-[#12181B]/50">{fichier ? fichier.name : "Aucun fichier sélectionné"}</span>
    </div>
  );
}

/* Aperçu : nouveau fichier choisi, sinon image actuelle, sinon message vide */
function useApercu(fichier, actuelle) {
  const [url, setUrl] = useState(actuelle || null);
  useEffect(() => {
    if (!fichier) {
      setUrl(actuelle || null);
      return;
    }
    const objet = URL.createObjectURL(fichier);
    setUrl(objet);
    return () => URL.revokeObjectURL(objet);
  }, [fichier, actuelle]);
  return url;
}

/* Sélecteur de couleur : pastille + code hexadécimal */
function ChampCouleur({ label, valeur, onChange }) {
  return (
    <div>
      <span className="block text-[13px] font-medium text-[#12181B]/70 mb-1.5">{label}</span>
      <label className="flex items-center gap-3 rounded-lg border border-[#12181B]/10 px-3 py-2.5 cursor-pointer hover:bg-[#12181B]/[0.02]">
        <input
          type="color"
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-[#12181B]/10 bg-transparent p-0"
        />
        <span className="font-mono text-[13px] uppercase text-[#12181B]">{valeur}</span>
      </label>
    </div>
  );
}

export default function BrandingTab({ boutique, onEnregistre }) {
  const [logo, setLogo] = useState(null);
  const [banniere, setBanniere] = useState(null);
  const [couleurPrimaire, setCouleurPrimaire] = useState(boutique.couleur_primaire || "#12181B");
  const [couleurSecondaire, setCouleurSecondaire] = useState(boutique.couleur_secondaire || "#0E7C66");
  const [chargement, setChargement] = useState(false);
  const { notifier } = useToast();

  const apercuLogo = useApercu(logo, boutique.logo);
  const apercuBanniere = useApercu(banniere, boutique.banniere);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    try {
      const formData = new FormData();
      if (logo) formData.append("logo", logo);
      if (banniere) formData.append("banniere", banniere);
      formData.append("couleur_primaire", couleurPrimaire);
      formData.append("couleur_secondaire", couleurSecondaire);

      const response = await tenantsApi.modifierMaBoutique(formData);
      onEnregistre(response.data);
      setLogo(null);
      setBanniere(null);
      notifier("Personnalisation enregistrée.");
    } catch {
      notifier("Impossible d'enregistrer la personnalisation.", "erreur");
    } finally {
      setChargement(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Logo */}
        <Section titre="Logo" description="Affiché dans le menu et sur ta vitrine. Un carré fonctionne le mieux.">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#12181B]/10 bg-[#12181B]/[0.03]">
              {apercuLogo ? (
                <img src={apercuLogo} alt="Aperçu du logo" className="h-full w-full object-cover" />
              ) : (
                <span className="px-2 text-center text-[11px] text-[#12181B]/40">Aucun logo</span>
              )}
            </div>
            <BoutonFichier id="logo" fichier={logo} onChange={setLogo} />
          </div>
        </Section>

        {/* Couleurs */}
        <Section titre="Couleurs" description="Utilisées pour les boutons, le menu et l'identité de ta boutique.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ChampCouleur label="Couleur principale" valeur={couleurPrimaire} onChange={setCouleurPrimaire} />
            <ChampCouleur label="Couleur secondaire" valeur={couleurSecondaire} onChange={setCouleurSecondaire} />
          </div>
        </Section>

        {/* Bannière : pleine largeur */}
        {/* Bannière : pleine largeur */}
<Section
  titre="Bannière"
  description="Image large, comme une photo de couverture Facebook, affichée en haut de la vitrine publique de ta boutique."
  className="lg:col-span-2"
>
  <div className="mb-4 w-full overflow-hidden rounded-xl border border-[#12181B]/10 bg-[#12181B]/[0.03]">
    {apercuBanniere ? (
      <img
        src={apercuBanniere}
        alt="Aperçu de la bannière"
        className="block w-full h-auto max-h-[420px] object-contain"
      />
    ) : (
      <div className="flex h-36 items-center justify-center text-[12px] text-[#12181B]/40">
        Aucune bannière
      </div>
    )}
  </div>
  <BoutonFichier id="banniere" fichier={banniere} onChange={setBanniere} />
</Section>
      </div>

      <button
        type="submit"
        disabled={chargement}
        className="rounded-full bg-[var(--boutique-primary,#12181B)] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[var(--boutique-accent,#0E7C66)] transition-colors disabled:opacity-50"
      >
        {chargement ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}