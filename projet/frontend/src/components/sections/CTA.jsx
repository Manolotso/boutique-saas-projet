import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section id="cta" className="px-6 lg:px-8 py-24">
      <div className="max-w-4xl mx-auto rounded-3xl bg-[#12181B] px-8 py-16 text-center">
        <h2 className="font-display text-[32px] md:text-[40px] font-medium tracking-tight text-[#F6F7F2]">
          Prêt à lancer ta boutique en ligne ?
        </h2>
        <p className="mt-4 text-[16px] text-[#F6F7F2]/70 max-w-xl mx-auto">
          Crée ta boutique en quelques minutes, sans compétence technique, et commence à vendre dès aujourd'hui.
        </p>
        <a
          href="#top"
          className="inline-flex items-center gap-1.5 mt-8 rounded-full bg-[#F6F7F2] text-[#12181B] text-[14px] font-medium px-6 py-3 hover:bg-[#0E7C66] hover:text-[#F6F7F2] transition-colors duration-300 shadow-sm"
        >
          Essayer gratuitement
          <ArrowRight size={15} />
        </a>
      </div>
    </section>
  );
}