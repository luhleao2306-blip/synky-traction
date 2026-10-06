import type { Metadata } from "next";
import "./globals.css";
import "./traction-visual.css";

export const metadata: Metadata = {
  title: "Synky Traction | Estratégia em execução",
  description: "Planeje ciclos, acompanhe prioridades e resultados, resolva impedimentos e tome decisões com contexto.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
