import { useRef, useState } from "react";
import { MapContainer, TileLayer, Circle, CircleMarker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { livraisonApi } from "../../api/livraison";

function CapteurClic({ onClic }) {
  useMapEvents({
    click(e) {
      onClic(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Carte OpenStreetMap : le client clique sur son lieu de livraison, le serveur renvoie
 * distance et frais. `onChange` reçoit { lat, lng, estimation } (ou null tant que le calcul
 * n'est pas terminé) pour que le tunnel de commande sache si un point valide est choisi.
 */
export default function SelecteurLivraison({ sousDomaine, boutique, montantSousTotal, onChange }) {
  const [point, setPoint] = useState(null);
  const [estimation, setEstimation] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  // Si le client clique plusieurs fois vite, seule la réponse du dernier clic compte.
  const derniereRequete = useRef(0);

  if (boutique.boutique_lat == null || boutique.boutique_lng == null) return null;

  const centre = [boutique.boutique_lat, boutique.boutique_lng];

  const handleClic = async (lat, lng) => {
    const numero = ++derniereRequete.current;
    setPoint({ lat, lng });
    setEstimation(null);
    setErreur(null);
    setChargement(true);
    onChange(null);

    try {
      const { data } = await livraisonApi.estimer(sousDomaine, { lat, lng, montantSousTotal });
      if (numero !== derniereRequete.current) return;
      setEstimation(data);
      onChange({ lat, lng, estimation: data });
    } catch {
      if (numero !== derniereRequete.current) return;
      setErreur("Impossible de calculer les frais de livraison. Réessaie.");
    } finally {
      if (numero === derniereRequete.current) setChargement(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-[13px] font-medium text-[#12181B]/70">Lieu de livraison</label>

      {/* relative z-0 : garde la carte sous le header sticky et les modales */}
      <div className="relative z-0 aspect-[4/3] min-h-[280px] w-full overflow-hidden rounded-xl border border-[#12181B]/10">
        <MapContainer center={centre} zoom={13} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Circle
            center={centre}
            radius={Number(boutique.rayon_max_km) * 1000}
            pathOptions={{ color: "#0E7C66", weight: 1, fillOpacity: 0.06 }}
          />
          <CircleMarker
            center={centre}
            radius={7}
            pathOptions={{ color: "#12181B", fillColor: "#12181B", fillOpacity: 1 }}
          />
          {point && (
            <CircleMarker
              center={[point.lat, point.lng]}
              radius={9}
              pathOptions={{ color: "#0E7C66", fillColor: "#0E7C66", fillOpacity: 0.9 }}
            />
          )}
          <CapteurClic onClic={handleClic} />
        </MapContainer>
      </div>

      <div aria-live="polite" className="w-full text-[13px]">
        {!point && (
          <p className="text-[#12181B]/50">
            Clique sur la carte à l'endroit où tu veux être livré. Le cercle montre la zone de livraison, le point noir est la boutique.
          </p>
        )}
        {chargement && <p className="text-[#12181B]/50">Calcul en cours...</p>}
        {erreur && <p className="text-red-600">{erreur}</p>}
        {estimation?.livrable && (
          <p className="text-[#12181B]/70">
            Distance estimée :{" "}
            {Number(estimation.distance_km).toLocaleString("fr-MG", { maximumFractionDigits: 1 })} km (à vol d'oiseau) ·{" "}
            <span className="font-medium text-[#12181B]">
              {estimation.livraison_offerte
                ? "Livraison offerte"
                : `Frais de livraison : ${Number(estimation.frais).toLocaleString("fr-MG")} ${boutique.devise}`}
            </span>
          </p>
        )}
        {estimation && !estimation.livrable && (
          <p className="text-red-600">
            {estimation.raison === "hors_zone"
              ? `Cet emplacement est en dehors de la zone de livraison (rayon de ${Number(boutique.rayon_max_km).toLocaleString("fr-MG")} km).`
              : "La livraison n'est pas disponible pour le moment."}
          </p>
        )}
      </div>
    </div>
  );
}