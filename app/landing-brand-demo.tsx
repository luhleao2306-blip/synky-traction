"use client";
/* eslint-disable @next/next/no-img-element -- A visitor's logo is shown only through a temporary local object URL. */

import { useEffect, useState } from "react";
import { Building2, ImagePlus, ShieldCheck, X } from "lucide-react";

const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
const maxFileSize = 2 * 1024 * 1024;

export function LandingBrandDemo() {
  const [logo, setLogo] = useState<{ url: string; name: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => () => { if (logo) URL.revokeObjectURL(logo.url); }, [logo]);

  function chooseLogo(file?: File) {
    if (!file) return;
    if (!allowedTypes.includes(file.type) || file.size === 0 || file.size > maxFileSize) {
      setError("Escolha uma imagem PNG, JPG ou WebP de até 2 MB.");
      return;
    }
    setError("");
    setLogo({ url: URL.createObjectURL(file), name: file.name });
  }

  return <div className="lp-brand-display" aria-label="Teste a identidade visual da sua empresa">
    <div className="lp-brand-display-header"><span>IDENTIDADE DO ESPAÇO</span><span>Synky Traction</span></div>
    <div className="lp-brand-display-card">
      <div className="lp-brand-display-identity">
        <span className={`lp-brand-display-mark ${logo ? "has-logo" : ""}`}>{logo ? <img src={logo.url} alt="Prévia da logo escolhida" /> : <Building2 size={28} strokeWidth={1.8} />}</span>
        <div className="lp-brand-display-identity-copy"><strong>{logo ? "Sua logo na prévia" : "Sua logo"}</strong><small>{logo ? logo.name : "Seu espaço de trabalho"}</small></div>
      </div>
      <div className="lp-brand-demo-upload">
        <label className="lp-brand-demo-file"><input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Escolher logo para testar na prévia" onChange={(event) => { chooseLogo(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} /><span><ImagePlus size={16} aria-hidden="true" /> {logo ? "Trocar logo" : "Testar minha logo"}</span></label>
        {logo && <button type="button" className="lp-brand-demo-remove" onClick={() => { setLogo(null); setError(""); }}><X size={15} aria-hidden="true" /> Remover</button>}
        <small>Prévia temporária. Desaparece ao atualizar.</small>
      </div>
      {error && <p className="lp-brand-demo-error" role="alert">{error}</p>}
      <div className="lp-brand-display-setting lp-brand-display-color-choice" role="group" aria-label="Teste uma cor"><span>TESTE UMA COR</span><div className="lp-brand-display-colors"><label><input type="radio" name="brand-demo-color" value="green" aria-label="Verde" defaultChecked /><span /></label><label><input type="radio" name="brand-demo-color" value="blue" aria-label="Azul" /><span /></label><label><input type="radio" name="brand-demo-color" value="clay" aria-label="Terracota" /><span /></label><label><input type="radio" name="brand-demo-color" value="purple" aria-label="Roxo" /><span /></label></div></div>
      <div className="lp-brand-display-setting"><span>ACESSOS POR FUNÇÃO</span><div className="lp-brand-display-roles"><b>Administrador</b><b>Gestor</b><b>Leitor</b></div></div>
    </div>
    <div className="lp-brand-display-footer"><ShieldCheck size={17} /><span>Uma identidade para cada empresa</span></div>
  </div>;
}
