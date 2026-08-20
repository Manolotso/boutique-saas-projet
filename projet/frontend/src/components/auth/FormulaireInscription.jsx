import { useState } from "react";
import { Store, ShoppingBag, ArrowLeft, CheckCircle2 } from "lucide-react";
import { comptesApi } from "../../api/comptes";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const ETAPES = {
  EMAIL_ROLE: 1,
  CODE: 2,
  MOT_DE_PASSE: 3,
  SUCCES: 4,
};

export default function FormulaireInscription({ onSuccess, onSwitchToConnexion, desactiverRedirection = false }) {
  const { seConnecterAvecTokens } = useAuth();

  const [etape, setEtape] = useState(ETAPES.EMAIL_ROLE);
  const [role, setRole] = useState("client");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nomBoutique, setNomBoutique] = useState("");

  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const navigate = useNavigate();

  const redirigerSelonRole = (role) => {
  if (role === "commercant") navigate("/commercant");
  else if (role === "superadmin") navigate("/admin");
  else navigate("/");
};

  // Étape 1 → envoie le code
  const handleEnvoyerCode = async (e) => {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      await comptesApi.envoyerCode(email, role);
      setEtape(ETAPES.CODE);
    } catch (err) {
      setErreur(err.response?.data?.detail || "Impossible d'envoyer le code.");
    } finally {
      setChargement(false);
    }
  };

  // Étape 2 → vérifie le code
  const handleVerifierCode = async (e) => {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      await comptesApi.verifierCode(email, code);
      setEtape(ETAPES.CODE);
      setEtape(ETAPES.MOT_DE_PASSE);
    } catch (err) {
      setErreur(err.response?.data?.detail || "Code incorrect.");
    } finally {
      setChargement(false);
    }
  };

  // Étape 3 → crée le compte
  const handleFinaliser = async (e) => {
  e.preventDefault();
  setErreur(null);

  if (password !== passwordConfirm) {
    setErreur("Les mots de passe ne correspondent pas.");
    return;
  }

  setChargement(true);
  try {
    const response = await comptesApi.finaliser(email, code, username, password, nomBoutique);
    const utilisateurConnecte = seConnecterAvecTokens(response.data);
onSuccess?.();
if (!desactiverRedirection) {
  redirigerSelonRole(utilisateurConnecte.role);
}
  } catch (err) {
    setErreur(err.response?.data?.detail || "Impossible de créer le compte.");
  } finally {
    setChargement(false);
  }
};

  return (
    <div className="space-y-5">
      <div>
        {etape > ETAPES.EMAIL_ROLE && etape !== ETAPES.SUCCES && (
          <button
            type="button"
            onClick={() => setEtape(etape - 1)}
            className="flex items-center gap-1 text-[13px] text-[#12181B]/50 hover:text-[#12181B] mb-3 transition-colors"
          >
            <ArrowLeft size={14} /> Retour
          </button>
        )}
        {etape !== ETAPES.SUCCES && (
          <>
            <h1 className="font-display text-[20px] font-medium tracking-tight text-[#12181B]">
              {etape === ETAPES.EMAIL_ROLE && "Créer un compte"}
              {etape === ETAPES.CODE && "Vérifie ton email"}
              {etape === ETAPES.MOT_DE_PASSE && "Choisis ton mot de passe"}
            </h1>
            <p className="text-[14px] text-[#12181B]/60 mt-1">
              {etape === ETAPES.EMAIL_ROLE && "Choisis comment tu veux utiliser la plateforme."}
              {etape === ETAPES.CODE && `Un code à 6 chiffres a été envoyé à ${email}.`}
              {etape === ETAPES.MOT_DE_PASSE && "Dernière étape avant de créer ta boutique ou ton compte."}
            </p>
          </>
        )}
      </div>

      {erreur && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-[13px] text-red-600">
          {erreur}
        </div>
      )}

      {/* ---------- Étape 1 : email + rôle ---------- */}
      {etape === ETAPES.EMAIL_ROLE && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("client")}
              className={`rounded-xl border px-4 py-4 text-left transition-colors ${
                role === "client"
                  ? "border-[#12181B] bg-[#12181B]/[0.03]"
                  : "border-[#12181B]/10 hover:bg-[#12181B]/[0.02]"
              }`}
            >
              <ShoppingBag size={20} className="text-[#12181B] mb-2" />
              <p className="text-[14px] font-medium text-[#12181B]">J'achète</p>
              <p className="text-[12px] text-[#12181B]/60 mt-0.5">Je veux commander des produits</p>
            </button>

            <button
              type="button"
              onClick={() => setRole("commercant")}
              className={`rounded-xl border px-4 py-4 text-left transition-colors ${
                role === "commercant"
                  ? "border-[#12181B] bg-[#12181B]/[0.03]"
                  : "border-[#12181B]/10 hover:bg-[#12181B]/[0.02]"
              }`}
            >
              <Store size={20} className="text-[#12181B] mb-2" />
              <p className="text-[14px] font-medium text-[#12181B]">Je vends</p>
              <p className="text-[12px] text-[#12181B]/60 mt-0.5">Je veux créer ma boutique</p>
            </button>
          </div>

          <form onSubmit={handleEnvoyerCode} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[13px] font-medium text-[#12181B]/70">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="toi@exemple.com"
                required
                className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] placeholder:text-[#12181B]/30 focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
              />
            </div>

            <button
              type="submit"
              disabled={chargement}
              className="w-full rounded-full bg-[#12181B] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[#0E7C66] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {chargement ? "Envoi..." : "Recevoir le code"}
            </button>

            <p className="text-center text-[13px] text-[#12181B]/60">
              Déjà un compte ?{" "}
              <button
                type="button"
                onClick={onSwitchToConnexion}
                className="font-medium text-[#12181B] hover:text-[#0E7C66] transition-colors duration-300"
              >
                Se connecter
              </button>
            </p>
          </form>
        </>
      )}

      {/* ---------- Étape 2 : code reçu par email ---------- */}
      {etape === ETAPES.CODE && (
        <form onSubmit={handleVerifierCode} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="code" className="block text-[13px] font-medium text-[#12181B]/70">
              Code de vérification
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              required
              className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[18px] tracking-[0.3em] text-center text-[#12181B] placeholder:text-[#12181B]/30 focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
            />
          </div>

          <button
            type="submit"
            disabled={chargement}
            className="w-full rounded-full bg-[#12181B] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[#0E7C66] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {chargement ? "Vérification..." : "Vérifier le code"}
          </button>
        </form>
      )}

      {/* ---------- Étape 3 : création du mot de passe ---------- */}
      {etape === ETAPES.MOT_DE_PASSE && (
        <form onSubmit={handleFinaliser} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="username" className="block text-[13px] font-medium text-[#12181B]/70">
              Nom d'utilisateur
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-[13px] font-medium text-[#12181B]/70">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="passwordConfirm" className="block text-[13px] font-medium text-[#12181B]/70">
              Confirmer le mot de passe
            </label>
            <input
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
            />
          </div>

          {role === "commercant" && (
          <div className="space-y-1.5">
            <label htmlFor="nomBoutique" className="block text-[13px] font-medium text-[#12181B]/70">
              Nom de ta boutique
            </label>
            <input
              id="nomBoutique"
              type="text"
              value={nomBoutique}
              onChange={(e) => setNomBoutique(e.target.value)}
              placeholder="Ex : Lamba Raphia"
              required
              className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] placeholder:text-[#12181B]/30 focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
            />
          </div>
        )}

          <button
            type="submit"
            disabled={chargement}
            className="w-full rounded-full bg-[#12181B] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[#0E7C66] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {chargement ? "Création..." : role === "commercant" ? "Créer ma boutique" : "Créer mon compte"}
          </button>
        </form>
      )}

      

      {/* ---------- Étape 4 : confirmation de succès ---------- */}
      {etape === ETAPES.SUCCES && (
        <div className="flex flex-col items-center text-center py-4 space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#0E7C66]/10 flex items-center justify-center">
            <CheckCircle2 size={28} className="text-[#0E7C66]" />
          </div>
          <div>
            <h1 className="font-display text-[20px] font-medium tracking-tight text-[#12181B]">
              Compte créé
            </h1>
            <p className="text-[14px] text-[#12181B]/60 mt-1">
              {role === "commercant"
                ? "Ta boutique est prête. Bienvenue !"
                : "Ton compte est prêt. Bienvenue !"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSuccess?.()}
            className="w-full rounded-full bg-[#12181B] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[#0E7C66] transition-colors duration-300"
          >
            Continuer
          </button>
        </div>
      )}
    </div>
  );
}