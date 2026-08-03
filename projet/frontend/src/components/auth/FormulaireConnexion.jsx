import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function FormulaireConnexion({ onSuccess }) {
  const { seConnecter, chargement, erreur } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await seConnecter(username, password);
      onSuccess?.();
    } catch {
      // l'erreur est déjà gérée dans le contexte (variable `erreur`), rien à faire ici
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="font-display text-[20px] font-medium tracking-tight text-[#12181B]">
          Connexion
        </h2>
        <p className="text-[14px] text-[#12181B]/60 mt-1">
          Accède à ton espace commerçant.
        </p>
      </div>

      {erreur && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-[13px] text-red-600">
          {erreur}
        </div>
      )}

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

      <button
        type="submit"
        disabled={chargement}
        className="w-full rounded-full bg-[#12181B] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[#0E7C66] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {chargement ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}