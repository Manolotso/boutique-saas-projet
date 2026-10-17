import { useState } from "react";
import { Phone, MessageCircle, MapPin } from "lucide-react";
import { tenantsApi } from "../../../api/tenants";
import { useToast } from "../../../context/ToastContext";

const VILLES = [
  ["antananarivo", "Antananarivo"], ["toamasina", "Toamasina"], ["antsirabe", "Antsirabe"],
  ["fianarantsoa", "Fianarantsoa"], ["mahajanga", "Mahajanga"], ["toliara", "Toliara"],
  ["antsiranana", "Antsiranana"], ["nosy_be", "Nosy Be"], ["autre", "Autre"],
];

const DESCRIPTION_MAX = 300;
const SLOGAN_MAX = 80;

const champ =
  "w-full rounded-lg border border-[#12181B]/10 bg-white px-3.5 py-2.5 text-[14px] text-[#12181B] placeholder:text-[#12181B]/30 focus:outline-none focus:ring-2 focus:ring-[#12181B]/20 transition-shadow";

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

/* Champ avec libellé, aide optionnelle et compteur optionnel */
function Champ({ id, label, aide, compteur, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-medium text-[#12181B]/70">{label}</label>
        {compteur && <span className="text-[11px] text-[#12181B]/40">{compteur}</span>}
      </div>
      {children}
      {aide && <p className="text-[12px] text-[#12181B]/50">{aide}</p>}
    </div>
  );
}

/* Champ avec icône à gauche */
function ChampIcone({ icone: Icone, ...props }) {
  return (
    <div className="relative">
      <Icone size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#12181B]/40" />
      <input {...props} className={`${champ} pl-10`} />
    </div>
  );
}

export default function InfosTab({ boutique, onEnregistre }) {
  const [description, setDescription] = useState(boutique.description || "");
  const [slogan, setSlogan] = useState(boutique.slogan || "");
  const [telephone, setTelephone] = useState(boutique.telephone || "");
  const [whatsapp, setWhatsapp] = useState(boutique.whatsapp || "");
  const [adresse, setAdresse] = useState(boutique.adresse || "");
  const [ville, setVille] = useState(boutique.ville || "");
  const [chargement, setChargement] = useState(false);
  const { notifier } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    try {
      const response = await tenantsApi.modifierMaBoutique({
        description, slogan, telephone, whatsapp, adresse, ville,
      });
      onEnregistre(response.data);
      notifier("Informations enregistrées.");
    } catch {
      notifier("Impossible d'enregistrer ces informations.", "erreur");
    } finally {
      setChargement(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      {/* Présentation : pleine largeur */}
      <Section
        titre="Présentation"
        description="Ce que tes clients voient en premier sur ta vitrine."
      >
        <div className="space-y-5">
          <Champ
            id="slogan"
            label="Slogan"
            compteur={`${slogan.length}/${SLOGAN_MAX}`}
            aide="Une phrase courte qui résume ta boutique."
          >
            <input
              id="slogan"
              type="text"
              value={slogan}
              maxLength={SLOGAN_MAX}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="Ex. : La mode malgache, livrée chez toi"
              className={champ}
            />
          </Champ>

          <Champ
            id="description"
            label="Description"
            compteur={`${description.length}/${DESCRIPTION_MAX}`}
            aide="Présente ce que tu vends et ce qui te distingue."
          >
            <textarea
              id="description"
              value={description}
              maxLength={DESCRIPTION_MAX}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Parle de ta boutique, de tes produits, de ta façon de travailler..."
              className={`${champ} resize-y`}
            />
          </Champ>
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Contact */}
        <Section
          titre="Contact"
          description="Comment tes clients peuvent te joindre."
        >
          <div className="space-y-5">
            <Champ id="telephone" label="Téléphone">
              <ChampIcone
                icone={Phone}
                id="telephone"
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="034 00 000 00"
              />
            </Champ>

            <Champ
              id="whatsapp"
              label="WhatsApp"
              aide="Les clients pourront te contacter directement depuis ta vitrine."
            >
              <ChampIcone
                icone={MessageCircle}
                id="whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="034 00 000 00"
              />
            </Champ>
          </div>
        </Section>

        {/* Localisation */}
        <Section
          titre="Localisation"
          description="Où se trouve ta boutique."
        >
          <div className="space-y-5">
            <Champ id="ville" label="Ville">
              <select
                id="ville"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                className={champ}
              >
                <option value="">Sélectionner une ville...</option>
                {VILLES.map(([valeur, lbl]) => (
                  <option key={valeur} value={valeur}>{lbl}</option>
                ))}
              </select>
            </Champ>

            <Champ id="adresse" label="Adresse">
              <ChampIcone
                icone={MapPin}
                id="adresse"
                type="text"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Ex. : Lot II A 12, Analakely"
              />
            </Champ>
          </div>
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