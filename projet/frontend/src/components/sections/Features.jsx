import Reveal from "../ui/Reveal";
import { FEATURES } from "../../data/features";

export default function Features() {
  return (
    <section id="features" className="py-28 lg:py-36 px-6 lg:px-8 bg-[#FBFAF6]">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-16">
          <Reveal>
            <span className="text-[13px] font-mono-custom text-[#0E7C66] tracking-wide uppercase">
              Fonctionnalités
            </span>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="font-display mt-4 text-[34px] sm:text-[42px] leading-[1.12] font-medium tracking-tight text-[#12181B]">
              Tout ce qu'il faut pour tenir une boutique, sans cahier ni tableur.
            </h2>
          </Reveal>
          <Reveal delay={2}>
            <p className="mt-5 text-[16px] leading-relaxed text-[#12181B]/60">
              Pensé pour les commerçants d'Antananarivo, de Toamasina et de
              Fianarantsoa : simple à prendre en main, robuste face aux coupures
              réseau.
            </p>
          </Reveal>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 0.5}>
              <div className="group h-full rounded-[22px] border border-[#12181B]/[0.07] bg-white/70 backdrop-blur-sm p-7 hover:border-[#0E7C66]/30 hover:bg-white transition-all duration-300 hover:shadow-[0_20px_40px_-24px_rgba(18,24,27,0.25)] hover:-translate-y-1">
                <div className="h-11 w-11 rounded-xl bg-[#0E7C66]/10 flex items-center justify-center mb-5 group-hover:bg-[#0E7C66] transition-colors duration-300">
                  <feature.icon
                    size={19}
                    className="text-[#0E7C66] group-hover:text-white transition-colors duration-300"
                    strokeWidth={2}
                  />
                </div>
                <h3 className="font-display text-[17.5px] font-medium text-[#12181B] mb-2">
                  {feature.title}
                </h3>
                <p className="text-[14.5px] leading-relaxed text-[#12181B]/60">
                  {feature.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
// grille des 6 fonctionnalités (catalogue, encaissement, stock...)
