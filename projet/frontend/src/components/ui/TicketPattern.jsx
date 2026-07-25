/**
 * Motif de fond en pointillés horizontaux, évoquant le bord perforé d'un
 * reçu de caisse — signature visuelle réutilisée dans plusieurs sections.
 */
export default function TicketPattern({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 800 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <line
          key={i}
          x1="-20"
          y1={80 + i * 80}
          x2="860"
          y2={80 + i * 80}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="2 10"
          opacity={0.14 + i * 0.015}
        />
      ))}
    </svg>
  );
}
// le motif de fond en pointillés (utilisé dans Hero, Stats, CTA)
