import { Check } from "lucide-react";

function Bloc({ titre, children }) {
  return (
    <div className="border-b border-[#12181B]/[0.08] py-4 last:border-0">
      <p className="mb-2.5 text-[12px] font-medium uppercase tracking-wide text-[#12181B]/45">{titre}</p>
      {children}
    </div>
  );
}

function Case({ actif, onClick, children, compteur }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left text-[13px] text-[#12181B]/80 hover:bg-[#12181B]/[0.04]"
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
          actif ? "border-[#12181B] bg-[#12181B] text-white" : "border-[#12181B]/25 bg-white"
        }`}
      >
        {actif && <Check size={11} strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {compteur !== undefined && <span className="text-[11px] text-[#12181B]/40">{compteur}</span>}
    </button>
  );
}

const CHAMP =
  "h-9 w-full min-w-0 rounded-lg border border-[#12181B]/10 bg-white px-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#12181B]/20";

// categories : [{ nom, nombre }], boutiques : [{ sous_domaine, nom }] (facultatif, page Découvrir seulement)
export default function PanneauFiltres({ categories = [], boutiques = [], f }) {
  return (
    <div>
      {categories.length > 0 && (
        <Bloc titre="Catégories">
          <div className="max-h-64 space-y-0.5 overflow-y-auto pr-1">
            {categories.map((c) => (
              <Case
                key={c.nom}
                actif={f.categories.includes(c.nom)}
                onClick={() => f.basculerCategorie(c.nom)}
                compteur={c.nombre}
              >
                {c.nom}
              </Case>
            ))}
          </div>
        </Bloc>
      )}

      <Bloc titre="Prix (Ar)">
        <div className="flex items-center gap-2">
          <input
            type="number" min="0" inputMode="numeric" placeholder="Min"
            value={f.prixMin} onChange={(e) => f.setPrixMin(e.target.value)}
            aria-label="Prix minimum" className={CHAMP}
          />
          <span className="text-[#12181B]/30">–</span>
          <input
            type="number" min="0" inputMode="numeric" placeholder="Max"
            value={f.prixMax} onChange={(e) => f.setPrixMax(e.target.value)}
            aria-label="Prix maximum" className={CHAMP}
          />
        </div>
      </Bloc>

      {boutiques.length > 1 && (
        <Bloc titre="Boutique">
          <select
            value={f.boutique}
            onChange={(e) => f.setBoutique(e.target.value)}
            aria-label="Filtrer par boutique"
            className={CHAMP}
          >
            <option value="">Toutes les boutiques</option>
            {boutiques.map((b) => (
              <option key={b.sous_domaine} value={b.sous_domaine}>{b.nom}</option>
            ))}
          </select>
        </Bloc>
      )}

      <Bloc titre="Disponibilité">
        <Case actif={f.promo} onClick={() => f.setPromo(!f.promo)}>En promotion</Case>
        <Case actif={f.enStock} onClick={() => f.setEnStock(!f.enStock)}>En stock uniquement</Case>
      </Bloc>

      {f.nombreActifs > 0 && (
        <button
          onClick={f.reinitialiserFiltres}
          className="mb-4 mt-2 h-9 w-full rounded-full border border-[#12181B]/15 text-[13px] font-medium text-[#12181B]/70 hover:bg-[#12181B]/5"
        >
          Effacer les filtres
        </button>
      )}
    </div>
  );
}