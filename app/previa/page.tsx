import type { Metadata } from "next";
import TractionApp from "../traction-app";

export const metadata: Metadata = {
  title: "Prévia do painel | Synky Traction",
  description: "Explore as áreas do Synky Traction sem entrar ou exibir dados de empresas.",
  robots: { index: false, follow: false },
};

export default function PreviewPage() {
  return <TractionApp displayName="Visitante" preview />;
}
