import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store } from "lucide-react";
import { usePanier } from "../../context/PanierContext";
import { useBoutiquePublique } from "../../context/BoutiquePubliqueContext";
import { useAuth } from "../../context/AuthContext";
import { commandesApi } from "../../api/commandes";
import Modal from "../../components/ui/Modal";
import FormulaireConnexion from "../../components/auth/FormulaireConnexion";
import FormulaireInscription from "../../components/auth/FormulaireInscription";

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
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);

  if (articles.length === 0) {
    navigate(`/boutique/${sousDomaine}/catalogue`, { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(null);
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
      });
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
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="font-display text-[22px] font-medium text-[#12181B] mb-6">Finaliser la commande</h1>

      {!utilisateur ? (
        <div className="flex flex-col items-center justify-center text-center bg-white border border-[#12181B]/10 rounded-xl py-12">
          <Store size={28} className="text-[#12181B]/20 mb-3" />
          <p className="text-[14px] text-[#12181B]/60 mb-4">
            Connecte-toi pour finaliser ta commande. Ton panier est conservé.
          </p>
          <button
            onClick={() => setAuthModalOuvert(true)}
            className="rounded-full bg-[var(--boutique-primary,#12181B)] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[var(--boutique-accent,#0E7C66)] transition-colors"
          >
            Se connecter / Créer un compte
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-[#12181B]/10 rounded-xl p-5">
            <p className="text-[14px] font-medium text-[#12181B] mb-3">Récapitulatif</p>
            <div className="space-y-1.5">
              {articles.map((a) => (
                <div key={`${a.produitId}-${a.varianteId || "x"}`} className="flex justify-between text-[13px] text-[#12181B]/70">
                  <span>{a.quantite} × {a.nom} {a.varianteLabel && `(${a.varianteLabel})`}</span>
                  <span>{(a.quantite * a.prix).toLocaleString("fr-MG")} {boutique.devise}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[14px] font-medium text-[#12181B] mt-3 pt-3 border-t border-[#12181B]/10">
              <span>Sous-total</span>
              <span>{montantTotal.toLocaleString("fr-MG")} {boutique.devise}</span>
            </div>
          </div>

          {erreur && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-[13px] text-red-600">
              {erreur}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[#12181B]/70">Mode de livraison</label>
              <div className="grid grid-cols-2 gap-2">
                {[["domicile", "Livraison à domicile"], ["retrait", "Retrait en boutique"]].map(([valeur, label]) => (
                  <button
                    key={valeur}
                    type="button"
                    onClick={() => setModeLivraison(valeur)}
                    className={`text-[13px] rounded-lg border px-3.5 py-2.5 transition-colors ${
                      modeLivraison === valeur
                        ? "border-[var(--boutique-primary,#12181B)] bg-[#12181B]/[0.03]"
                        : "border-[#12181B]/10 hover:bg-[#12181B]/[0.02]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[#12181B]/70">Nom du destinataire</label>
                <input
                  type="text"
                  value={nomDestinataire}
                  onChange={(e) => setNomDestinataire(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[#12181B]/70">Téléphone</label>
                <input
                  type="tel"
                  value={telephoneDestinataire}
                  onChange={(e) => setTelephoneDestinataire(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
                />
              </div>
            </div>

            {modeLivraison === "domicile" && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-[#12181B]/70">Zone de livraison</label>
                  <input
                    type="text"
                    value={zoneLivraison}
                    onChange={(e) => setZoneLivraison(e.target.value)}
                    placeholder="Ex : Antananarivo - Analakely"
                    className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] placeholder:text-[#12181B]/30 focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-[#12181B]/70">Adresse complète</label>
                  <textarea
                    value={adresseComplete}
                    onChange={(e) => setAdresseComplete(e.target.value)}
                    rows={2}
                    required
                    className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[#12181B]/70">Instructions de livraison (optionnel)</label>
              <input
                type="text"
                value={instructionsLivraison}
                onChange={(e) => setInstructionsLivraison(e.target.value)}
                className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[#12181B]/70">Message au commerçant (optionnel)</label>
              <textarea
                value={noteClient}
                onChange={(e) => setNoteClient(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={chargement}
            className="w-full rounded-full bg-[var(--boutique-primary,#12181B)] text-[#F6F7F2] text-[14px] font-medium px-6 py-3 hover:bg-[var(--boutique-accent,#0E7C66)] transition-colors disabled:opacity-50"
          >
            {chargement ? "Validation..." : `Confirmer la commande — ${montantTotal.toLocaleString("fr-MG")} ${boutique.devise}`}
          </button>
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