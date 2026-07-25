import { motion } from "framer-motion";
import { fadeUp } from "../../lib/motion";

/**
 * Anime un enfant lorsqu'il entre dans le viewport (fade + translation).
 * `as` permet de changer la balise motion sous-jacente (div, li, span...).
 */
export default function Reveal({ children, className = "", delay = 0, as = "div" }) {
  const Comp = motion[as] || motion.div;
  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      custom={delay}
      variants={fadeUp}
    >
      {children}
    </Comp>
  );
}
// anime n'importe quel enfant à l'apparition au scroll
