import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function SectionFormulaire({ titre, description, defautOuvert = false, children }) {
  const [ouvert, setOuvert] = useState(defautOuvert);

  return (
    <div className="rounded-xl border border-[#12181B]/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#12181B]/[0.02] transition-colors duration-200"
      >
        <div>
          <h3 className="font-display text-[15px] font-medium text-[#12181B]">{titre}</h3>
          {description && (
            <p className="text-[13px] text-[#12181B]/50 mt-0.5">{description}</p>
          )}
        </div>
        <ChevronDown
          size={18}
          className={`text-[#12181B]/40 transition-transform duration-200 ${ouvert ? "rotate-180" : ""}`}
        />
      </button>

      {ouvert && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-[#12181B]/5">
          {children}
        </div>
      )}
    </div>
  );
}