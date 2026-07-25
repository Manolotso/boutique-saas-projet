import { useEffect, useRef, useState } from "react";
import { useInView, animate } from "framer-motion";

/**
 * Compteur numérique animé : démarre dès que le composant devient visible
 * dans le viewport, puis s'anime jusqu'à `value`.
 */
export default function Counter({ value, suffix = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, value, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [isInView, value]);

  return (
    <span ref={ref} className="font-mono-custom tabular-nums">
      {display.toLocaleString("fr-FR")}
      {suffix}
    </span>
  );
}
// compteur numérique animé (utilisé dans Stats)