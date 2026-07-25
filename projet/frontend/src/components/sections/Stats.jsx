import Reveal from "../ui/Reveal";
import Counter from "../ui/Counter";
import TicketPattern from "../ui/TicketPattern";
import { STATS } from "../../data/stats";

export default function Stats() {
  return (
    <section className="py-24 px-6 lg:px-8 bg-[#12181B] relative overflow-hidden">
      <TicketPattern className="absolute inset-0 w-full h-full text-white opacity-[0.06] pointer-events-none" />
      <div className="max-w-7xl mx-auto relative grid grid-cols-2 lg:grid-cols-4 gap-10">
        {STATS.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.5} className="text-center lg:text-left">
            <p className="font-display text-[38px] sm:text-[46px] font-medium text-white tracking-tight">
              <Counter value={stat.value} suffix={stat.suffix} />
            </p>
            <p className="mt-2 text-[13.5px] text-white/50 font-mono-custom">
              {stat.label}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
// bandeau sombre avec les statistiques animées
