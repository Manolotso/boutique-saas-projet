import { ShoppingBag, ReceiptText, Wallet, Package, Users, WifiOff } from "lucide-react";

export const FEATURES = [
  {
    icon: ShoppingBag,
    title: "Catalogue produit",
    desc: "Présentez vos articles avec photos, prix et variantes (taille, couleur) — aucune compétence technique requise.",
  },
  {
    icon: ReceiptText,
    title: "Prise de commande rapide",
    desc: "Composez une commande en quelques tapotements, que ce soit au comptoir ou pour une livraison.",
  },
  {
    icon: Wallet,
    title: "Encaissement mobile",
    desc: "Acceptez Mvola, Orange Money, Airtel Money ou les espèces, avec un reçu généré automatiquement.",
  },
  {
    icon: Package,
    title: "Suivi de stock",
    desc: "Chaque vente met à jour votre stock en temps réel, avec une alerte dès qu'un article se fait rare.",
  },
  {
    icon: Users,
    title: "Fiches client",
    desc: "Retrouvez l'historique d'achat de chaque client pour mieux le reconnaître et le fidéliser.",
  },
  {
    icon: WifiOff,
    title: "Fonctionne sans réseau",
    desc: "Continuez à vendre même en cas de coupure : tout se synchronise automatiquement au retour du signal.",
  },
];
