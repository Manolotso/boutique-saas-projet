import Reveal from "../ui/Reveal";
import { Check } from "lucide-react";
import { STOCK_PREVIEW_ROWS, STOCK_POINTS } from "../../data/imageText";

export default function ImageText() {
  return (
    <section id="how-it-works" className="py-28 lg:py-36 px-6 lg:px-8 bg-[#F3F4EE]">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <Reveal className="order-2 lg:order-1">
          <div className="relative rounded-[26px] border border-[#12181B]/[0.08] bg-white shadow-[0_24px_60px_-24px_rgba(18,24,27,0.2)] p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[13px] font-mono-custom text-[#12181B]/40">
                stock_boutique.json
              </p>
              <span className="text-[11px] font-mono-custom text-[#0E7C66] bg-[#0E7C66]/10 rounded-full px-2 py-1">
                à jour
              </span>
            </div>

            {STOCK_PREVIEW_ROWS.map((row, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3.5 py-3.5 border-t border-[#12181B]/[0.06] first:border-t-0"
              >
                <div className="h-9 w-9 rounded-lg bg-[#F3F4EE] flex items-center justify-center flex-shrink-0">
                  <row.icon size={15} className="text-[#12181B]/60" />
                </div>
                <div>
                  <p className="text-[13.5px] font-medium text-[#12181B]">{row.label}</p>
                  <p className="text-[12px] text-[#12181B]/45 mt-0.5 font-mono-custom">
                    {row.meta}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <div className="order-1 lg:order-2">
          <Reveal>
            <span className="text-[13px] font-mono-custom text-[#0E7C66] tracking-wide uppercase">
              Suivi de stock
            </span>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="font-display mt-4 text-[32px] sm:text-[38px] leading-[1.14] font-medium tracking-tight text-[#12181B]">
              Chaque vente laisse une trace — et votre stock suit automatiquement.
            </h2>
          </Reveal>
          <Reveal delay={2}>
            <p className="mt-5 text-[16px] leading-relaxed text-[#12181B]/60 max-w-md">
              Fini les ruptures de stock découvertes trop tard ou les articles
              vendus deux fois. Varotra tient les comptes pendant que vous
              tenez la boutique.
            </p>
          </Reveal>

          <ul className="mt-8 space-y-4">
            {STOCK_POINTS.map((point, i) => (
              <Reveal key={point} delay={3 + i * 0.5}>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 h-5 w-5 rounded-full bg-[#0E7C66]/10 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-[#0E7C66]" strokeWidth={2.5} />
                  </span>
                  <span className="text-[14.5px] leading-relaxed text-[#12181B]/70">
                    {point}
                  </span>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
// section "suivi de stock" avec aperçu + texte
