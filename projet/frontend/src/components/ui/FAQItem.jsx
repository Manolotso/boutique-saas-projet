import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

/** Une question/réponse dépliable de l'accordéon FAQ. */
export default function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div className="border-b border-[#12181B]/[0.08]">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-6 py-6 text-left group"
      >
        <span className="text-[16px] sm:text-[17px] font-medium text-[#12181B] group-hover:text-[#0E7C66] transition-colors">
          {item.q}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0 h-8 w-8 rounded-full bg-[#F3F4EE] flex items-center justify-center"
        >
          <ChevronDown size={16} className="text-[#12181B]/60" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-[15px] leading-relaxed text-[#12181B]/60 max-w-2xl">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
// une question/réponse dépliable (utilisé dans FAQ)
