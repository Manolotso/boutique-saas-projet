import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Store, Menu, X, ArrowRight } from "lucide-react";
import { NAV_LINKS } from "../../data/navigation";
import Modal from "../ui/Modal";
import FormulaireConnexion from "../auth/FormulaireConnexion";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoginOuvert, setIsLoginOuvert] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#FBFAF6]/80 backdrop-blur-xl border-b border-[#12181B]/[0.06] shadow-[0_1px_0_0_rgba(0,0,0,0.02)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5 group">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#12181B] text-[#F6F7F2] shadow-sm">
            <Store className="h-4.5 w-4.5" size={18} strokeWidth={2.2} />
          </span>
          <span className="font-display text-[19px] font-medium tracking-tight text-[#12181B]">
            Varotra
          </span>
        </a>

        <div className="hidden md:flex items-center gap-9">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[14px] font-medium text-[#12181B]/70 hover:text-[#12181B] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setIsLoginOuvert(true)}
            className="text-[14px] font-medium text-[#12181B]/70 hover:text-[#12181B] transition-colors px-4 py-2"
          >
            Connexion
          </button>
          <a
            href="#cta"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#12181B] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[#0E7C66] transition-colors duration-300 shadow-sm"
          >
            Essayer gratuitement
            <ArrowRight size={15} />
          </a>
        </div>

        <button
          className="md:hidden text-[#12181B] p-2 -mr-2"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Ouvrir le menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden bg-[#FBFAF6]/95 backdrop-blur-xl border-b border-[#12181B]/[0.06]"
          >
            <div className="px-6 py-6 flex flex-col gap-5">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-[15px] font-medium text-[#12181B]/80"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#cta"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#12181B] text-[#F6F7F2] text-[14px] font-medium px-5 py-3 mt-2"
              >
                Essayer gratuitement
                <ArrowRight size={15} />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Modal isOpen={isLoginOuvert} onClose={() => setIsLoginOuvert(false)}>
        <FormulaireConnexion onSuccess={() => setIsLoginOuvert(false)} />
      </Modal>
    </header>
  );
}

//barre de navigation fixe, effet verre au scroll, menu mobile