import { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const ICONES = { succes: CheckCircle2, erreur: XCircle, info: Info };
const COULEURS = {
  succes: "text-[#0E7C66] bg-[#0E7C66]/10",
  erreur: "text-red-600 bg-red-50",
  info: "text-[#12181B] bg-[#12181B]/5",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const notifier = useCallback((message, type = "succes") => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((toast) => toast.id !== id)), 3500);
  }, []);

  const fermer = (id) => setToasts((t) => t.filter((toast) => toast.id !== id));

  return (
    <ToastContext.Provider value={{ notifier }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-full max-w-sm">
        <AnimatePresence>
          {toasts.map(({ id, message, type }) => {
            const Icone = ICONES[type] || Info;
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2.5 rounded-xl bg-white border border-[#12181B]/10 shadow-lg px-4 py-3"
              >
                <span className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${COULEURS[type]}`}>
                  <Icone size={15} />
                </span>
                <p className="text-[13px] text-[#12181B] flex-1">{message}</p>
                <button onClick={() => fermer(id)} className="text-[#12181B]/30 hover:text-[#12181B]/60">
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé dans un <ToastProvider>");
  return ctx;
}