import { motion } from "framer-motion";
import { Sparkles, ArrowRight, ReceiptText, Wallet, Check, Package } from "lucide-react";
import Reveal from "../ui/Reveal";
import TicketPattern from "../ui/TicketPattern";

// Lignes de produit affichées dans le mockup de reçu du hero.
const RECEIPT_ITEMS = [
  { label: "Robe wax bleue", meta: "x1", price: "45 000 Ar", delay: 0.5 },
  { label: "Sac tressé raphia", meta: "x2", price: "30 000 Ar", delay: 0.9 },
  { label: "Ceinture cuir", meta: "x1", price: "18 000 Ar", delay: 1.3 },
];

// Filigrane du drapeau malgache (blanc / rouge / vert), en arrière-plan du hero
function MadagascarFlagBackground() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1500px] h-[950px] opacity-[0.16] flex rounded-[48px] overflow-hidden rotate-[-2deg] shadow-[0_0_120px_40px_rgba(0,0,0,0.02)]">
        {/* Bande blanche verticale (1/3 gauche) */}
        <div className="w-1/3 h-full bg-white" />
        {/* Bandes rouge / verte horizontales (2/3 droite) */}
        <div className="w-2/3 h-full flex flex-col">
          <div className="h-1/2 w-full bg-[#FC3D32]" />
          <div className="h-1/2 w-full bg-[#007E49]" />
        </div>
      </div>
    </div>
  );
}


export default function Hero() {
  return (
    <section
      id="top"
      className="relative pt-40 pb-28 lg:pt-52 lg:pb-36 px-6 lg:px-8 overflow-hidden bg-[#FBFAF6]"
    >
      <MadagascarFlagBackground />
      <TicketPattern className="absolute top-0 right-0 w-[900px] h-[700px] text-[#0E7C66] opacity-70 pointer-events-none -translate-y-10 translate-x-32" />

      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Texte */}
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#12181B]/10 bg-white/60 backdrop-blur px-3.5 py-1.5 text-[12.5px] font-mono-custom text-[#0E7C66] tracking-tight">
                <Sparkles size={13} />
                Paiement via Mvola · Orange Money · Airtel Money
              </span>
            </Reveal>

            <Reveal delay={1}>
              <h1 className="font-display mt-7 text-[42px] leading-[1.08] sm:text-[52px] sm:leading-[1.06] lg:text-[58px] font-medium tracking-tight text-[#12181B]">
                Vendez en ligne facilement,
                <br />
                partout à <span className="italic text-[#0E7C66]">Madagascar</span>
                <br />
              </h1>
            </Reveal>

            <Reveal delay={2}>
              <p className="mt-6 text-[17px] leading-relaxed text-[#12181B]/65 max-w-lg">
                Une plateforme simple pour créer, gérer et développer votre commerce en ligne.
              </p>
            </Reveal>

            <Reveal delay={3}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a
                  href="#cta"
                  className="inline-flex items-center gap-2 rounded-full bg-[#12181B] text-[#F6F7F2] text-[15px] font-medium px-6 py-3.5 hover:bg-[#0E7C66] transition-all duration-300 shadow-[0_8px_24px_-8px_rgba(18,24,27,0.45)] hover:shadow-[0_8px_28px_-6px_rgba(14,124,102,0.5)] hover:-translate-y-0.5"
                >
                  Ouvrir ma boutique
                  <ArrowRight size={16} />
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 text-[15px] font-medium text-[#12181B]/75 hover:text-[#12181B] px-2 py-3.5 transition-colors"
                >
                  Voir comment ça marche
                </a>
              </div>
            </Reveal>

            <Reveal delay={4}>
              <p className="mt-8 text-[13px] text-[#12181B]/45 font-mono-custom">
                Gratuit pour démarrer · Sans engagement · Fonctionne hors-ligne
              </p>
            </Reveal>
          </div>

          {/* Mockup reçu de caisse */}
          <Reveal delay={2} className="relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative rounded-[28px] border border-[#12181B]/[0.08] bg-white shadow-[0_30px_70px_-20px_rgba(18,24,27,0.25)] overflow-hidden"
              >
                <div className="relative bg-gradient-to-br from-[#EAF3EF] via-[#F3F4EE] to-[#FBF6EC] overflow-hidden px-7 py-8">
                  <TicketPattern className="absolute inset-0 w-full h-full text-[#0E7C66]" />

                  <div className="relative">
                    <div className="flex items-center justify-between pb-5 border-b border-dashed border-[#12181B]/15">
                      <div>
                        <p className="text-[13.5px] font-semibold text-[#12181B]">
                          Boutique Fara — Analakely
                        </p>
                        <p className="text-[11.5px] text-[#12181B]/45 font-mono-custom mt-0.5">
                          Reçu n°0842 · aujourd'hui
                        </p>
                      </div>
                      <span className="h-9 w-9 rounded-lg bg-[#0E7C66]/10 flex items-center justify-center">
                        <ReceiptText size={16} className="text-[#0E7C66]" />
                      </span>
                    </div>

                    {RECEIPT_ITEMS.map((row, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: row.delay }}
                        className="flex items-center justify-between py-3 border-b border-[#12181B]/[0.06]"
                      >
                        <div>
                          <p className="text-[13.5px] font-medium text-[#12181B]">{row.label}</p>
                          <p className="text-[11.5px] text-[#12181B]/45 font-mono-custom">
                            {row.meta}
                          </p>
                        </div>
                        <p className="text-[13.5px] font-mono-custom text-[#12181B]">
                          {row.price}
                        </p>
                      </motion.div>
                    ))}

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 1.6 }}
                      className="flex items-center justify-between pt-4"
                    >
                      <p className="text-[14px] font-semibold text-[#12181B]">Total</p>
                      <p className="text-[17px] font-mono-custom font-medium text-[#0E7C66]">
                        93 000 Ar
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1.9 }}
                      className="mt-4 flex items-center gap-2 rounded-xl bg-white/80 border border-[#12181B]/[0.06] px-3.5 py-2.5"
                    >
                      <Wallet size={15} className="text-[#E2A33B]" />
                      <p className="text-[12.5px] font-medium text-[#12181B]/75">
                        Payé via Mvola
                      </p>
                      <span className="ml-auto h-5 w-5 rounded-full bg-[#0E7C66] flex items-center justify-center">
                        <Check size={11} className="text-white" strokeWidth={3} />
                      </span>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Badge flottant secondaire */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -6 }}
                animate={{ opacity: 1, scale: 1, rotate: -6 }}
                transition={{ duration: 0.6, delay: 1.1 }}
                className="hidden sm:flex absolute -left-8 top-10 items-center gap-2 rounded-2xl bg-white border border-[#12181B]/[0.08] shadow-xl px-4 py-3"
              >
                <div className="h-8 w-8 rounded-full bg-[#E2A33B]/15 flex items-center justify-center">
                  <Package size={15} className="text-[#E2A33B]" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#12181B] leading-none">
                    Stock à jour
                  </p>
                  <p className="text-[11px] text-[#12181B]/45 mt-1">en temps réel</p>
                </div>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
// titre principal + mockup animé du reçu de caisse