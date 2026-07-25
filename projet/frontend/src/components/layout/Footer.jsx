import { Store, Globe2, Rss, MessageCircle, Mail } from "lucide-react";

const FOOTER_COLUMNS = [
  {
    title: "Produit",
    links: ["Fonctionnalités", "Mode hors-ligne", "Paiements mobiles", "Tarifs"],
  },
  {
    title: "Ressources",
    links: ["Guide de démarrage", "Export des données", "Statut du service", "Nouveautés"],
  },
  {
    title: "Entreprise",
    links: ["À propos", "Carrières", "Presse", "Contact"],
  },
  {
    title: "Légal",
    links: ["Confidentialité", "Conditions d'utilisation", "Cookies"],
  },
];

const SOCIAL_ICONS = [Globe2, Rss, MessageCircle];

export default function Footer() {
  return (
    <footer className="bg-[#12181B] px-6 lg:px-8 pt-20 pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[1.4fr_2fr] gap-16 pb-16 border-b border-white/10">
          <div>
            <a href="#top" className="flex items-center gap-2.5 mb-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
                <Store size={18} strokeWidth={2.2} />
              </span>
              <span className="font-display text-[19px] font-medium tracking-tight text-white">
                Varotra
              </span>
            </a>
            <p className="text-[14.5px] leading-relaxed text-white/50 max-w-xs">
              La caisse, le stock et vos clients dans la poche — pensée pour les
              commerçants de Madagascar.
            </p>
            <div className="flex items-center gap-3 mt-7">
              {SOCIAL_ICONS.map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-[13px] font-mono-custom text-white/40 uppercase tracking-wide mb-4">
                  {col.title}
                </p>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-[14px] text-white/60 hover:text-white transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
          <p className="text-[13px] text-white/40">
            © {new Date().getFullYear()} Varotra. Tous droits réservés.
          </p>
          <div className="flex items-center gap-2 text-[13px] text-white/40">
            <Mail size={13} />
            bonjour@varotra.mg
          </div>
        </div>
      </div>
    </footer>
  );
}
