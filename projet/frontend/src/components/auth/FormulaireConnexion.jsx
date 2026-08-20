import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function FormulaireConnexion({ onSuccess, onSwitchToInscription, desactiverRedirection = false }) {
  const { seConnecter, chargement, erreur } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const redirigerSelonRole = (role) => {
  if (role === "commercant") navigate("/commercant");
  else if (role === "superadmin") navigate("/admin");
  else navigate("/");
};

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const utilisateurConnecte = await seConnecter(email, password);
    onSuccess?.();
    if (!desactiverRedirection) {
  redirigerSelonRole(utilisateurConnecte.role);
}
  } catch {
    // géré via `erreur`
  }
};

  const handleGoogleLogin = () => {
    // à connecter à votre flux OAuth Google
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[20px] font-medium tracking-tight text-[#12181B]">
          Content de vous revoir
        </h1>
        <p className="text-[14px] text-[#12181B]/60 mt-1">
          Connectez-vous à votre compte
        </p>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-2.5 rounded-full border border-[#12181B]/10 bg-white text-[#12181B] text-[14px] font-medium px-5 py-2.5 hover:bg-[#12181B]/[0.03] transition-colors duration-300"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A9.001 9.001 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
          />
        </svg>
        Continuer avec Google
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[#12181B]/10" />
        <span className="text-[12px] text-[#12181B]/40">ou</span>
        <div className="h-px flex-1 bg-[#12181B]/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {erreur && (
          <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-[13px] text-red-600">
            {erreur}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="username" className="block text-[13px] font-medium text-[#12181B]/70">
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

        <button
          type="submit"
          disabled={chargement}
          className="w-full rounded-full bg-[#12181B] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[#0E7C66] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {chargement ? "Connexion..." : "Se connecter"}
        </button>

        <p className="text-center text-[13px] text-[#12181B]/60">
        Pas encore de compte ?{" "}
        <button
            type="button"
            onClick={onSwitchToInscription}
            className="font-medium text-[#12181B] hover:text-[#0E7C66] transition-colors duration-300"
        >
            Inscris-toi maintenant
        </button>
        </p>
      </form>
    </div>
  );
}