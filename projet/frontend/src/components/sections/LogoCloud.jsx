import Reveal from "../ui/Reveal";
import { SECTOR_TAGS } from "../../data/sectors";

export default function LogoCloud() {
  return (
    <section className="py-16 px-6 lg:px-8 bg-[#FBFAF6] border-y border-[#12181B]/[0.06]">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <p className="text-center text-[12.5px] font-mono-custom tracking-wide text-[#12181B]/40 uppercase mb-9">
            Déjà adopté par des commerçants de tous les secteurs
          </p>
        </Reveal>
        <Reveal delay={1}>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {SECTOR_TAGS.map((name) => (
              <span
                key={name}
                className="font-display text-[18px] text-[#12181B]/30 hover:text-[#12181B]/70 transition-colors duration-300 cursor-default select-none"
              >
                {name}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
// bandeau des secteurs d'activité (vêtements, artisanat...)
