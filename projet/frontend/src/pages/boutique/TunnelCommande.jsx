import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, Truck, MapPin, User, StickyNote, AlertCircle, ShoppingBag } from "lucide-react";
import { usePanier } from "../../context/PanierContext";
import { useBoutiquePublique } from "../../context/BoutiquePubliqueContext";
import { useAuth } from "../../context/AuthContext";
import { commandesApi } from "../../api/commandes";
import Modal from "../../components/ui/Modal";
import FormulaireConnexion from "../../components/auth/FormulaireConnexion";
import FormulaireInscription from "../../components/auth/FormulaireInscription";
import SelecteurLivraison from "../../components/livraison/SelecteurLivraison";

// Même largeur que le header, l'accueil, le catalogue et le footer
const CONTENEUR = "w-full px-4 sm:px-6 lg:px-8 2xl:px-12";

const champ =
  "w-full rounded-lg border border-[#12181B]/10 bg-white px-3.5 py-2.5 text-[14px] text-[#12181B] placeholder:text-[#12181B]/30 focus:outline-none focus:ring-2 focus:ring-[#12181B]/20 transition-shadow";

const MODES = [
  { valeur: "domicile", label: "Livraison à domicile", aide: "On te livre chez toi", icone: Truck },
  { valeur: "retrait", label: "Retrait en boutique", aide: "Tu viens récupérer ta commande", icone: Store },
];

function Section({ titre, icone: Icone, children }) {
  return (
    <section className="rounded-2xl border border-[#12181B]/10 bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#12181B]/[0.05] text-[#12181B]/70">
          <Icone size={18} />
        </span>
        <h2 className="text-[15px] font-medium text-[#12181B]">{titre}</h2>
      </div>
      {children}
    </section>
  );
}

function Champ({ id, label, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-medium text-[#12181B]/70">{label}</label>
      {children}
    </div>
  );
}

export default function TunnelCommande() {
  const { articles, montantTotal, viderPanier } = usePanier();
  const { boutique, sousDomaine } = useBoutiquePublique();
  const { utilisateur } = useAuth();
  const navigate = useNavigate();

  const [authModalOuvert, setAuthModalOuvert] = useState(!utilisateur);
  const [vueAuth, setVueAuth] = useState("connexion");

  const [modeLivraison, setModeLivraison] = useState("domicile");
  const [nomDestinataire, setNomDestinataire] = useState("");
  const [telephoneDestinataire, setTelephoneDestinataire] = useState("");
  const [zoneLivraison, setZoneLivraison] = useState("");
  const [adresseComplete, setAdresseComplete] = useState("");
  const [instructionsLivraison, setInstructionsLivraison] = useState("");
  const [noteClient, setNoteClient] = useState("");
  const [livraison, setLivraison] = useState(null); // { lat, lng, estimation } une fois le point choisi
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);

  // Évite de rediriger vers le catalogue juste après la création de la commande
  // (le panier est alors vidé, mais on part vers la page de paiement).
  const commandeCreee = useRef(false);

  useEffect(() => {
    if (articles.length === 0 && !commandeCreee.current) {
      navigate(`/boutique/${sousDomaine}/catalogue`, { replace: true });
    }
  }, [articles.length, navigate, sousDomaine]);

  if (articles.length === 0) return null;

  const devise = boutique.devise;
  const formater = (n) => Number(n).toLocaleString("fr-MG");

  // La carte n'intervient que pour une livraison à domicile sur une boutique qui l'a activée.
  const livraisonCarteActive = modeLivraison === "domicile" && boutique.livraison_active;
  const livraisonCalculee = livraisonCarteActive && livraison?.estimation?.livrable;
  const fraisLivraison = livraisonCalculee ? livraison.estimation.frais : 0;
  const totalFinal = montantTotal + fraisLivraison;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(null);

    if (livraisonCarteActive && !livraisonCalculee) {
      setErreur("Choisis ton emplacement de livraison sur la carte.");
      return;
    }

    setChargement(true);
    try {
      const { data: commande } = await commandesApi.creerCommande(sousDomaine, {
        lignes: articles.map((a) => ({
          produit_id: a.produitId,
          variante_id: a.varianteId || undefined,
          quantite: a.quantite,
        })),
        mode_livraison: modeLivraison,
        nom_destinataire: nomDestinataire,
        telephone_destinataire: telephoneDestinataire,
        zone_livraison: zoneLivraison,
        adresse_complete: adresseComplete,
        instructions_livraison: instructionsLivraison,
        note_client: noteClient,
        ...(livraisonCarteActive && { livraison_lat: livraison.lat, livraison_lng: livraison.lng }),
      });
      commandeCreee.current = true;
      viderPanier();
      navigate(`/boutique/${sousDomaine}/commande/${commande.numero_commande}/paiement`);
    } catch (err) {
      const messages = err.response?.data;
      const premierMessage = messages ? Object.values(messages)[0] : null;
      setErreur(Array.isArray(premierMessage) ? premierMessage[0] : premierMessage || "Impossible de créer la commande.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className={`${CONTENEUR} py-6 sm:py-10`}>
      <h1 className="mb-6 font-display text-[24px] font-medium text-[#12181B] sm:mb-8 sm:text-[28px]">
        Finaliser la commande
      </h1>

      {!utilisateur ? (
        <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-[#12181B]/10 bg-white px-6 py-12 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#12181B]/5">
            <Store size={24} className="text-[#12181B]/35" />
          </span>
          <p className="text-[15px] font-medium text-[#12181B]">Connecte-toi pour continuer</p>
          <p className="mt-1 text-[13px] text-[#12181B]/50">Ton panier est conservé.</p>
          <button
            onClick={() => setAuthModalOuvert(true)}
            className="mt-6 h-11 rounded-full bg-[var(--boutique-primary,#12181B)] px-6 text-[14px] font-medium text-[#F6F7F2] transition-colors hover:bg-[var(--boutique-accent,#0E7C66)]"
          >
            Se connecter / Créer un compte
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid items-start gap-6 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] lg:gap-8">
          {/* ===== Colonne gauche : formulaire ===== */}
          <div className="space-y-6">
            {/* Mode de livraison */}
            <Section titre="Mode de réception" icone={Truck}>
              <div className="grid gap-3 sm:grid-cols-2">
                {MODES.map(({ valeur, label, aide, icone: Icone }) => {
                  const actif = modeLivraison === valeur;
                  return (
                    <button
                      key={valeur}
                      type="button"
                      onClick={() => setModeLivraison(valeur)}
                      aria-pressed={actif}
                      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                        actif
                          ? "border-[var(--boutique-primary,#12181B)] bg-[#12181B]/[0.03]"
                          : "border-[#12181B]/10 hover:border-[#12181B]/30"
                      }`}
                    >
                      <Icone size={20} className={actif ? "text-[#12181B]" : "text-[#12181B]/40"} />
                      <span>
                        <span className="block text-[14px] font-medium text-[#12181B]">{label}</span>
                        <span className="mt-0.5 block text-[12px] text-[#12181B]/50">{aide}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {modeLivraison === "retrait" && boutique.adresse && (
                <p className="mt-4 flex items-start gap-2 rounded-lg bg-[#12181B]/[0.03] px-4 py-3 text-[13px] text-[#12181B]/70">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-[#12181B]/40" />
                  À récupérer à : {boutique.adresse}
                </p>
              )}
            </Section>

            {/* Destinataire */}
            <Section titre="Destinataire" icone={User}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Champ id="nom" label="Nom du destinataire">
                  <input
                    id="nom"
                    type="text"
                    value={nomDestinataire}
                    onChange={(e) => setNomDestinataire(e.target.value)}
                    required
                    autoComplete="name"
                    className={champ}
                  />
                </Champ>
                <Champ id="tel" label="Téléphone">
                  <input
                    id="tel"
                    type="tel"
                    value={telephoneDestinataire}
                    onChange={(e) => setTelephoneDestinataire(e.target.value)}
                    required
                    autoComplete="tel"
                    placeholder="034 00 000 00"
                    className={champ}
                  />
                </Champ>
              </div>
            </Section>

            {/* Adresse (domicile uniquement) */}
            {modeLivraison === "domicile" && (
              <Section titre="Adresse de livraison" icone={MapPin}>
                <div className="space-y-5">
                  {boutique.livraison_active && (
                    <SelecteurLivraison
                      sousDomaine={sousDomaine}
                      boutique={boutique}
                      montantSousTotal={montantTotal}
                      onChange={setLivraison}
                    />
                  )}
                  <Champ id="zone" label="Zone de livraison">
                    <input
                      id="zone"
                      type="text"
                      value={zoneLivraison}
                      onChange={(e) => setZoneLivraison(e.target.value)}
                      placeholder="Ex : Antananarivo - Analakely"
                      className={champ}
                    />
                  </Champ>
                  <Champ id="adresse" label="Adresse complète">
                    <textarea
                      id="adresse"
                      value={adresseComplete}
                      onChange={(e) => setAdresseComplete(e.target.value)}
                      rows={3}
                      required
                      className={`${champ} resize-y`}
                    />
                  </Champ>
                  <Champ id="instructions" label="Instructions de livraison (optionnel)">
                    <input
                      id="instructions"
                      type="text"
                      value={instructionsLivraison}
                      onChange={(e) => setInstructionsLivraison(e.target.value)}
                      placeholder="Ex : portail bleu, sonner deux fois"
                      className={champ}
                    />
                  </Champ>
                </div>
              </Section>
            )}

            {/* Message */}
            <Section titre="Message au commerçant" icone={StickyNote}>
              <Champ id="note" label="Une précision à ajouter ? (optionnel)">
                <textarea
                  id="note"
                  value={noteClient}
                  onChange={(e) => setNoteClient(e.target.value)}
                  rows={3}
                  className={`${champ} resize-y`}
                />
              </Champ>
            </Section>
          </div>

          {/* ===== Colonne droite : récapitulatif ===== */}
          <aside className="rounded-2xl border border-[#12181B]/10 bg-white p-5 sm:p-6 lg:sticky lg:top-24">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#12181B]/[0.05] text-[#12181B]/70">
                <ShoppingBag size={18} />
              </span>
              <h2 className="text-[15px] font-medium text-[#12181B]">Récapitulatif</h2>
            </div>

            <ul className="divide-y divide-[#12181B]/10">
              {articles.map((a) => (
                <li
                  key={`${a.produitId}-${a.varianteId || "x"}`}
                  className="flex items-start justify-between gap-3 py-3 text-[13px]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[#12181B]">{a.nom}</p>
                    <p className="mt-0.5 text-[#12181B]/50">
                      {a.varianteLabel ? `${a.varianteLabel} · ` : ""}Quantité : {a.quantite}
                    </p>
                  </div>
                  <span className="shrink-0 text-[#12181B]/80">
                    {formater(a.quantite * a.prix)} {devise}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-[#12181B]/10 pt-4 text-[14px]">
              <div className="flex justify-between text-[#12181B]/70">
                <dt>Sous-total</dt>
                <dd>{formater(montantTotal)} {devise}</dd>
              </div>
              {livraisonCarteActive && (
                <div className="flex justify-between text-[#12181B]/70">
                  <dt>Livraison</dt>
                  <dd className={livraisonCalculee && fraisLivraison === 0 ? "font-medium text-[#0E7C66]" : ""}>
                    {livraisonCalculee
                      ? fraisLivraison === 0
                        ? "Offerte"
                        : `${formater(fraisLivraison)} ${devise}`
                      : "À calculer sur la carte"}
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-t border-[#12181B]/10 pt-3 text-[17px] font-medium text-[#12181B]">
                <dt>Total</dt>
                <dd>{formater(totalFinal)} {devise}</dd>
              </div>
            </dl>

            {erreur && (
              <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-600">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {erreur}
              </div>
            )}

            <button
              type="submit"
              disabled={chargement}
              className="mt-5 h-12 w-full rounded-full bg-[var(--boutique-primary,#12181B)] px-6 text-[15px] font-medium text-[#F6F7F2] transition-colors hover:bg-[var(--boutique-accent,#0E7C66)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12181B] focus-visible:ring-offset-2 disabled:opacity-50"
            >
              {chargement ? "Validation..." : `Confirmer · ${formater(totalFinal)} ${devise}`}
            </button>
            <p className="mt-3 text-center text-[12px] text-[#12181B]/45">
              Tu choisis ton moyen de paiement à l'étape suivante.
            </p>
          </aside>
        </form>
      )}

      <Modal isOpen={authModalOuvert} onClose={() => setAuthModalOuvert(false)}>
        {vueAuth === "connexion" ? (
          <FormulaireConnexion
            desactiverRedirection
            onSuccess={() => setAuthModalOuvert(false)}
            onSwitchToInscription={() => setVueAuth("inscription")}
          />
        ) : (
          <FormulaireInscription
            desactiverRedirection
            onSuccess={() => setAuthModalOuvert(false)}
            onSwitchToConnexion={() => setVueAuth("connexion")}
          />
        )}
      </Modal>
    </div>
  );
}