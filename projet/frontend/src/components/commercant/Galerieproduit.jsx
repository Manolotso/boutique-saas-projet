import { useState, useRef } from "react";
import { ImagePlus, Star, Trash2, Loader2 } from "lucide-react";
import { catalogueApi } from "../../api/catalogue";

export default function GalerieProduit({ produitId, imagesInitiales = [], onImagesChange }) {
  const [images, setImages] = useState(imagesInitiales);
  const [televersement, setTeleversement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const inputRef = useRef(null);

  const notifierParent = (nouvellesImages) => {
    setImages(nouvellesImages);
    onImagesChange?.(nouvellesImages);
  };

  const handleFichiers = async (e) => {
    const fichiers = Array.from(e.target.files || []);
    if (fichiers.length === 0) return;
    setErreur(null);
    setTeleversement(true);
    try {
      const nouvelles = [];
      for (const fichier of fichiers) {
        const formData = new FormData();
        formData.append("image", fichier);
        // Première image ajoutée au produit = principale par défaut
        formData.append("est_principale", images.length === 0 && nouvelles.length === 0);
        const response = await catalogueApi.ajouterImageProduit(produitId, formData);
        nouvelles.push(response.data);
      }
      notifierParent([...images, ...nouvelles]);
    } catch (err) {
      setErreur("Certaines images n'ont pas pu être envoyées. Réessaie.");
    } finally {
      setTeleversement(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const definirPrincipale = async (imageId) => {
    const precedent = images;
    // Mise à jour optimiste
    notifierParent(images.map((img) => ({ ...img, est_principale: img.id === imageId })));
    try {
      await catalogueApi.definirImagePrincipale(produitId, imageId);
    } catch (err) {
      notifierParent(precedent);
      setErreur("Impossible de changer l'image principale.");
    }
  };

  const supprimer = async (imageId) => {
    const precedent = images;
    notifierParent(images.filter((img) => img.id !== imageId));
    try {
      await catalogueApi.supprimerImageProduit(imageId);
    } catch (err) {
      notifierParent(precedent);
      setErreur("Impossible de supprimer cette image.");
    }
  };

  return (
    <div className="space-y-4">
      {erreur && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-[13px] text-red-600">
          {erreur}
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 group ${
                img.est_principale ? "border-[#0E7C66]" : "border-[#12181B]/10"
              }`}
            >
              <img src={img.image} alt="" className="w-full h-full object-cover" />

              {img.est_principale && (
                <span className="absolute top-1.5 left-1.5 rounded-full bg-[#0E7C66] text-white text-[10px] font-medium px-2 py-0.5">
                  Principale
                </span>
              )}

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {!img.est_principale && (
                  <button
                    type="button"
                    onClick={() => definirPrincipale(img.id)}
                    title="Définir comme principale"
                    className="rounded-full bg-white/90 p-1.5 hover:bg-white transition-colors duration-200"
                  >
                    <Star size={14} className="text-[#12181B]" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => supprimer(img.id)}
                  title="Supprimer"
                  className="rounded-full bg-white/90 p-1.5 hover:bg-white transition-colors duration-200"
                >
                  <Trash2 size={14} className="text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={televersement}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#12181B]/15 py-6 text-[13px] font-medium text-[#12181B]/60 hover:border-[#0E7C66]/40 hover:text-[#0E7C66] transition-colors duration-200 disabled:opacity-50"
      >
        {televersement ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Envoi en cours...
          </>
        ) : (
          <>
            <ImagePlus size={16} />
            Ajouter des photos
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFichiers}
        className="hidden"
      />

      {images.length === 0 && !televersement && (
        <p className="text-[12px] text-[#12181B]/40 text-center">
          Aucune photo pour l'instant. La première ajoutée devient l'image principale.
        </p>
      )}
    </div>
  );
}