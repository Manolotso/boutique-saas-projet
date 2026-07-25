import { useState } from "react";
import Reveal from "../ui/Reveal";
import FAQItem from "../ui/FAQItem";
import { FAQS } from "../../data/faq";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="py-28 lg:py-36 px-6 lg:px-8 bg-[#FBFAF6]">
      <div className="max-w-4xl mx-auto">
        <div className="max-w-2xl mb-14">
          <Reveal>
            <span className="text-[13px] font-mono-custom text-[#0E7C66] tracking-wide uppercase">
              Questions fréquentes
            </span>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="font-display mt-4 text-[32px] sm:text-[38px] leading-[1.14] font-medium tracking-tight text-[#12181B]">
              Tout ce que vous vous demandez encore.
            </h2>
          </Reveal>
        </div>

        <Reveal delay={2}>
          <div>
            {FAQS.map((item, i) => (
              <FAQItem
                key={item.q}
                item={item}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
// accordéon des questions fréquentes