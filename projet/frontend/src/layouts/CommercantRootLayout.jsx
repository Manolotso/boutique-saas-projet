import { Outlet } from "react-router-dom";
import { BoutiqueProvider } from "../context/BoutiqueContext";

export default function CommercantRootLayout() {
  return (
    <BoutiqueProvider>
      <Outlet />
    </BoutiqueProvider>
  );
}