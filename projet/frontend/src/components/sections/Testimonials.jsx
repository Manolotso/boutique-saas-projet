import Reveal from "../ui/Reveal";
import { Star } from "lucide-react";
import { TESTIMONIALS, TESTIMONIAL_PALETTE } from "../../data/testimonials";

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-28 lg:py-36 px-6 lg:px-8 bg-[#FBFAF6]">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-16">
          <Reveal>
            <span className="text-[13px] font-mono-custom text-[#0E7C66] tracking-wide uppercase">
              Témoignages
            </span>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="font-display mt-4 text-[34px] sm:text-[42px] leading-[1.12] font-medium tracking-tight text-[#12181B]">
              Des commerçants qui gèrent leur boutique sans y penser deux fois.
            </h2>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.5}>
              <div className="h-full rounded-[22px] border border-[#12181B]/[0.07] bg-white p-7 flex flex-col hover:shadow-[0_20px_40px_-24px_rgba(18,24,27,0.2)] transition-shadow duration-300">
                <div className="flex gap-0.5 mb-5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} size={14} className="fill-[#E2A33B] text-[#E2A33B]" />
                  ))}
                </div>
                <p className="text-[15px] leading-relaxed text-[#12181B]/75 flex-1">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 mt-7">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white text-[13px] font-medium flex-shrink-0"
                    style={{ backgroundColor: TESTIMONIAL_PALETTE[i % TESTIMONIAL_PALETTE.length] }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-[13.5px] font-semibold text-[#12181B]">{t.name}</p>
                    <p className="text-[12.5px] text-[#12181B]/50">{t.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
// les 3 témoignages de commerçants