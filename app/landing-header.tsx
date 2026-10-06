"use client";

import { useEffect, useState } from "react";
import { SynkyLogo } from "./synky-logo";

const links = [
  { href: "#como-funciona", label: "Como funciona", id: "como-funciona" },
  { href: "#sistema", label: "O painel", id: "sistema" },
  { href: "#resultados", label: "Resultados", id: "resultados" },
];

type Section = "inicio" | "como-funciona" | "sistema" | "resultados" | "duvidas" | "final" | "rodape";

export function LandingHeader() {
  const [section, setSection] = useState<Section>("inicio");

  useEffect(() => {
    let frame = 0;
    const sectionIds: Section[] = ["inicio", "como-funciona", "sistema", "resultados", "duvidas", "final", "rodape"];

    function update() {
      frame = 0;
      const marker = Math.min(window.innerHeight * 0.33, 260);
      let current: Section = "inicio";
      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= marker) current = id;
      }
      setSection(current);
    }

    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const tone = section === "sistema" || section === "final" ? "dark" : section === "inicio" ? "hero" : "light";
  const nav = (className: string, label: string) => (
    <nav className={className} aria-label={label}>
      {links.map((link) => <a key={link.id} href={link.href} aria-current={section === link.id ? "location" : undefined}>{link.label}</a>)}
    </nav>
  );

  return <header className="lp-header" data-tone={tone}>
    <div className="lp-container lp-header-inner">
      <a href="#inicio" className="lp-logo" aria-label="Synky Traction — início"><SynkyLogo /></a>
      {nav("lp-desktop-nav", "Navegação principal")}
      <a className="lp-panel-button" href="/acessar">Painel</a>
    </div>
    {nav("lp-mobile-nav", "Seções da página")}
  </header>;
}
