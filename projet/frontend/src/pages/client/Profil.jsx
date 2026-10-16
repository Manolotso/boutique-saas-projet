import { useEffect, useState } from "react";
import { comptesApi } from "../../api/comptes";
import { useToast } from "../../context/ToastContext";

export default function Profil() {
  const [profil, setProfil] = useState(null);
  const [username, setUsername] = useState("");
  const [chargement, setChargement] = useState(false);
  const { notifier } = useToast();

  const [ancienMotDePasse, setAncienMotDePasse] = useState("");
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState("");
  const [chargementMotDePasse, setChargementMotDePasse] = useState(false);

  useEffect(() => {
    comptesApi.obtenirMonProfil().then((res) => {
      setProfil(res.data);
      setUsername(res.data.username);
    });
  }, []);

  const enregistrerProfil = async (e) => {
    e.preventDefault();
    setChargement(true);
    try {
      await comptesApi.modifierMonProfil({ username });
      notifier("Profil mis à jour.");
    } catch {
      notifier("Impossible de mettre à jour le profil.", "erreur");
    } finally {
      setChargement(false);
    }
  };

  const changerMotDePasse = async (e) => {
    e.preventDefault();
    if (nouveauMotDePasse !== confirmationMotDePasse) {
      notifier("Les mots de passe ne correspondent pas.", "erreur");
      return;
    }
    setChargementMotDePasse(true);
    try {
      await comptesApi.changerMotDePasse(ancienMotDePasse, nouveauMotDePasse);
      notifier("Mot de passe modifié.");
      setAncienMotDePasse("");
      setNouveauMotDePasse("");
      setConfirmationMotDePasse("");
    } catch (err) {
      notifier(err.response?.data?.detail || "Impossible de modifier le mot de passe.", "erreur");
    } finally {
      setChargementMotDePasse(false);
    }
  };

  if (!profil) return <p className="text-[14px] text-[#12181B]/50">Chargement...</p>;

  return (
    <div className="space-y-8 max-w-md">
      <form onSubmit={enregistrerProfil} className="space-y-4">
        <p className="text-[14px] font-medium text-[#12181B]">Informations personnelles</p>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-[#12181B]/70">Nom d'utilisateur</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-[#12181B]/70">Email</label>
          <input
            type="email"
            value={profil.email}
            disabled
            className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B]/50 bg-[#12181B]/[0.02] cursor-not-allowed"
          />
        </div>

        <button
          type="submit"
          disabled={chargement}
          className="rounded-full bg-[#12181B] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[#0E7C66] transition-colors disabled:opacity-50"
        >
          {chargement ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>

      <form onSubmit={changerMotDePasse} className="space-y-4 pt-6 border-t border-[#12181B]/10">
        <p className="text-[14px] font-medium text-[#12181B]">Changer le mot de passe</p>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-[#12181B]/70">Mot de passe actuel</label>
          <input
            type="password"
            value={ancienMotDePasse}
            onChange={(e) => setAncienMotDePasse(e.target.value)}
            required
            className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-[#12181B]/70">Nouveau mot de passe</label>
          <input
            type="password"
            value={nouveauMotDePasse}
            onChange={(e) => setNouveauMotDePasse(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-[#12181B]/70">Confirmer le nouveau mot de passe</label>
          <input
            type="password"
            value={confirmationMotDePasse}
            onChange={(e) => setConfirmationMotDePasse(e.target.value)}
            required
            className="w-full rounded-lg border border-[#12181B]/10 px-3.5 py-2.5 text-[14px] text-[#12181B] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20"
          />
        </div>

        <button
          type="submit"
          disabled={chargementMotDePasse}
          className="rounded-full bg-[#12181B] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[#0E7C66] transition-colors disabled:opacity-50"
        >
          {chargementMotDePasse ? "Modification..." : "Changer le mot de passe"}
        </button>
      </form>
    </div>
  );
}