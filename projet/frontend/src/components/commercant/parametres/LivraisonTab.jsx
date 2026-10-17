import { useState } from "react";
import { MapContainer, TileLayer, Circle, CircleMarker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Truck, MapPin, Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import { tenantsApi } from "../../../api/tenants";
import { useToast } from "../../../context/ToastContext";

// Antananarivo : point de départ de la carte tant que la boutique n'est pas placée.
const CENTRE_PAR_DEFAUT = [-18.8792, 47.5079];

// L'API renvoie les décimaux sous forme de chaînes ("2000.00") : on les nettoie pour les champs.
const versChamp = (valeur) => (valeur === null || valeur === undefined ? "" : String(Number(valeur)));

const champ =
  "w-full rounded-lg border border-[#12181B]/10 bg-white px-3.5 py-2.5 text-[14px] text-[#12181B] placeholder:text-[#12181B]/30 focus:outline-none focus:ring-2 focus:ring-[#12181B]/20 transition-shadow";

function CapteurClic({ onClic }) {
  useMapEvents({
    click(e) {
      onClic(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/* Carte réutilisable : titre + description + contenu */
function Section({ titre, description, icone: Icone, children, className = "" }) {
  return (
    <section className={`rounded-xl border border-[#12181B]/10 bg-white p-5 ${className}`}>
      <div className="flex items-start gap-3">
        {Icone && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#12181B]/[0.05] text-[#12181B]/70">
            <Icone size={18} />
          </span>
        )}
        <div>
          <h3 className="text-[15px] font-medium text-[#12181B]">{titre}</h3>
          {description && <p className="mt-0.5 text-[13px] text-[#12181B]/50">{description}</p>}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/* Champ numérique avec unité affichée à droite */
function ChampNombre({ id, label, aide, suffixe, ...props }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-medium text-[#12181B]/70">{label}</label>
      <div className="relative">
        <input id={id} type="number" inputMode="numeric" {...props} className={`${champ} ${suffixe ? "pr-14" : ""}`} />
        {suffixe && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#12181B]/40">
            {suffixe}
          </span>
        )}
      </div>
      {aide && <p className="text-[12px] text-[#12181B]/50">{aide}</p>}
    </div>
  );
}

export default function LivraisonTab({ boutique, onEnregistre }) {
  const [livraisonActive, setLivraisonActive] = useState(boutique.livraison_active || false);
  const [position, setPosition] = useState(
    boutique.boutique_lat != null && boutique.boutique_lng != null
      ? { lat: boutique.boutique_lat, lng: boutique.boutique_lng }
      : null
  );
  const [fraisBase, setFraisBase] = useState(versChamp(boutique.frais_livraison_base) || "0");
  const [fraisParKm, setFraisParKm] = useState(versChamp(boutique.frais_par_km) || "0");
  const [rayonMaxKm, setRayonMaxKm] = useState(versChamp(boutique.rayon_max_km) || "10");
  const [seuilGratuit, setSeuilGratuit] = useState(versChamp(boutique.seuil_livraison_gratuite));
  const [chargement, setChargement] = useState(false);
  const { notifier } = useToast();

  // Même formule que le serveur (arrondi au 100 Ar supérieur), uniquement pour les exemples affichés.
  const calculerFrais = (km) =>
    Math.ceil(((Number(fraisBase) || 0) + (Number(fraisParKm) || 0) * km) / 100) * 100;

  const rayon = Number(rayonMaxKm) || 0;
  const exemples = [1, 5, rayon].filter((km, i, tab) => km > 0 && tab.indexOf(km) === i);
  const centre = position ? [position.lat, position.lng] : CENTRE_PAR_DEFAUT;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (livraisonActive && !position) {
      notifier("Place ta boutique sur la carte avant d'activer la livraison.", "erreur");
      return;
    }

    setChargement(true);
    try {
      const response = await tenantsApi.modifierMaBoutique({
        livraison_active: livraisonActive,
        boutique_lat: position ? position.lat : null,
        boutique_lng: position ? position.lng : null,
        frais_livraison_base: fraisBase || "0",
        frais_par_km: fraisParKm || "0",
        rayon_max_km: rayonMaxKm || "10",
        seuil_livraison_gratuite: seuilGratuit === "" ? null : seuilGratuit,
      });
      onEnregistre(response.data);
      notifier("Paramètres de livraison enregistrés.");
    } catch (err) {
      const data = err.response?.data;
      const premier = data ? Object.values(data)[0] : null;
      notifier(
        (Array.isArray(premier) ? premier[0] : premier) || "Impossible d'enregistrer la livraison.",
        "erreur"
      );
    } finally {
      setChargement(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      {/* Activation : interrupteur */}
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[#12181B]/10 bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#12181B]/[0.05] text-[#12181B]/70">
            <Truck size={18} />
          </span>
          <div>
            <p className="text-[15px] font-medium text-[#12181B]">Livraison à domicile</p>
            <p className="mt-0.5 text-[13px] text-[#12181B]/50">
              Tes clients peuvent se faire livrer, avec un calcul automatique des frais selon la distance.
            </p>
          </div>
        </div>

        <span className="relative shrink-0">
          <input
            type="checkbox"
            checked={livraisonActive}
            onChange={(e) => setLivraisonActive(e.target.checked)}
            className="peer sr-only"
          />
          <span className="block h-6 w-11 rounded-full bg-[#12181B]/20 transition-colors peer-checked:bg-[var(--boutique-accent,#0E7C66)] peer-focus-visible:ring-2 peer-focus-visible:ring-[#12181B]/30" />
          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
        </span>
      </label>

      {livraisonActive && (
        <>
          {/* Position */}
          <Section
            titre="Position de ta boutique"
            description="Point de départ pour calculer la distance de chaque livraison."
            icone={MapPin}
          >
            {/* relative z-0 : garde la carte sous les en-têtes et les modales */}
            {/* relative z-0 : garde la carte sous les en-têtes et les modales */}
<div className="relative z-0 h-[420px] overflow-hidden rounded-xl border border-[#12181B]/10 md:h-[560px] lg:h-[640px]">
  <MapContainer
    center={centre}
    zoom={position ? 14 : 13}
    scrollWheelZoom
    className="h-full w-full"
  >
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
    {position && (
      <>
        <Circle
          center={[position.lat, position.lng]}
          radius={rayon * 1000}
          pathOptions={{ color: "#0E7C66", weight: 1.5, fillOpacity: 0.08 }}
        />
        <CircleMarker
          center={[position.lat, position.lng]}
          radius={9}
          pathOptions={{ color: "#FFFFFF", weight: 2, fillColor: "#12181B", fillOpacity: 1 }}
        />
      </>
    )}
    <CapteurClic onClic={(lat, lng) => setPosition({ lat, lng })} />
  </MapContainer>
</div>

            <div
              className={`mt-3 flex items-start gap-2 text-[13px] ${
                position ? "text-[#0E7C66]" : "text-[#B45309]"
              }`}
            >
              {position ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
              <p>
                {position
                  ? "Boutique placée. Clique ailleurs sur la carte pour la déplacer. Le cercle vert montre ta zone de livraison."
                  : "Clique sur la carte à l'emplacement de ta boutique pour pouvoir activer la livraison."}
              </p>
            </div>
          </Section>

          {/* Tarification */}
          <Section
            titre="Tarification"
            description="Définis combien coûte la livraison et jusqu'où tu livres."
            icone={Wallet}
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <ChampNombre
                id="frais-base"
                label="Frais de base"
                suffixe={boutique.devise}
                aide="Montant fixe facturé à chaque livraison."
                min="0"
                step="100"
                value={fraisBase}
                onChange={(e) => setFraisBase(e.target.value)}
              />
              <ChampNombre
                id="frais-km"
                label="Prix par kilomètre"
                suffixe={`${boutique.devise}/km`}
                aide="Ajouté au montant de base selon la distance."
                min="0"
                step="100"
                value={fraisParKm}
                onChange={(e) => setFraisParKm(e.target.value)}
              />
              <ChampNombre
                id="rayon"
                label="Rayon maximum"
                suffixe="km"
                aide="Au-delà, la livraison n'est pas proposée."
                min="1"
                step="1"
                value={rayonMaxKm}
                onChange={(e) => setRayonMaxKm(e.target.value)}
              />
              <ChampNombre
                id="seuil"
                label="Livraison offerte dès (optionnel)"
                suffixe={boutique.devise}
                aide="Laisse vide pour ne jamais offrir la livraison."
                min="0"
                step="1000"
                placeholder="Ex. : 100000"
                value={seuilGratuit}
                onChange={(e) => setSeuilGratuit(e.target.value)}
              />
            </div>
          </Section>

          {/* Simulateur */}
          <Section
            titre="Aperçu des frais"
            description="Ce que paieraient tes clients avec les tarifs ci-dessus."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {exemples.map((km) => (
                <div key={km} className="rounded-lg bg-[#12181B]/[0.04] px-4 py-3">
                  <p className="text-[12px] text-[#12181B]/50">
                    {km === rayon && km !== 1 && km !== 5 ? `À ${km} km (limite)` : `À ${km} km`}
                  </p>
                  <p className="mt-0.5 text-[16px] font-medium text-[#12181B]">
                    {calculerFrais(km).toLocaleString("fr-MG")} {boutique.devise}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-[#12181B]/50">
              La distance est calculée à vol d'oiseau, et les frais sont arrondis aux 100 {boutique.devise} supérieurs.
              {seuilGratuit !== "" && Number(seuilGratuit) > 0 && (
                <> La livraison est offerte pour toute commande d'au moins {Number(seuilGratuit).toLocaleString("fr-MG")} {boutique.devise}.</>
              )}
            </p>
          </Section>
        </>
      )}

      <button
        type="submit"
        disabled={chargement}
        className="rounded-full bg-[var(--boutique-primary,#12181B)] text-[#F6F7F2] text-[14px] font-medium px-5 py-2.5 hover:bg-[var(--boutique-accent,#0E7C66)] transition-colors disabled:opacity-50"
      >
        {chargement ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}