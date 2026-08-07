import Reveal from "../ui/Reveal";
import { SECTOR_TAGS } from "../../data/sectors";

export default function LogoCloud() {
  // On duplique la liste pour un défilement en boucle parfaitement fluide (pas de "saut")
  const tags = [...SECTOR_TAGS, ...SECTOR_TAGS];

  return (
    <section className="py-16 px-6 lg:px-8 bg-[#FBFAF6] border-y border-[#12181B]/[0.06] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <p className="text-center text-[12.5px] font-mono-custom tracking-wide text-[#12181B]/40 uppercase mb-9">
            Déjà adopté par des commerçants de tous les secteurs
          </p>
        </Reveal>

        <Reveal delay={1}>
          <div
            className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
          >
            <div className="flex w-max animate-marquee items-center gap-x-14 hover:[animation-play-state:paused]">
              {tags.map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="font-display text-[30px] md:text-[20px] whitespace-nowrap text-[#12181B]/30 hover:text-[#12181B]/70 transition-colors duration-300 cursor-default select-none"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      <style jsx>{`
        @keyframes marquee {
          from {
            transform: translateX(0%);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 28s linear infinite;
        }
      `}</style>
    </section>
  );
}
// bandeau des secteurs d'activité (vêtements, artisanat...)