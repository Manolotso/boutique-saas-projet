import { createContext, useContext, useState, useCallback, useRef } from "react";
import Modal from "../components/ui/Modal";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialogue, setDialogue] = useState(null);
  const resolveRef = useRef(null);

  const confirmer = useCallback(({ titre, message, texteConfirmer = "Confirmer", danger = false }) => {
    setDialogue({ titre, message, texteConfirmer, danger });
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const repondre = (valeur) => {
    setDialogue(null);
    resolveRef.current?.(valeur);
  };

  return (
    <ConfirmContext.Provider value={{ confirmer }}>
      {children}
      <Modal isOpen={Boolean(dialogue)} onClose={() => repondre(false)}>
        {dialogue && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-[18px] font-medium text-[#12181B]">{dialogue.titre}</h2>
              <p className="text-[14px] text-[#12181B]/60 mt-1.5">{dialogue.message}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => repondre(false)}
                className="flex-1 rounded-full border border-[#12181B]/10 text-[#12181B] text-[14px] font-medium px-5 py-2.5 hover:bg-[#12181B]/[0.03] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => repondre(true)}
                className={`flex-1 rounded-full text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 transition-colors ${
                  dialogue.danger ? "bg-red-600 hover:bg-red-700" : "bg-[#12181B] hover:bg-[var(--boutique-accent,#0E7C66)]"
                }`}
              >
                {dialogue.texteConfirmer}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm doit être utilisé dans un <ConfirmProvider>");
  return ctx.confirmer;
}