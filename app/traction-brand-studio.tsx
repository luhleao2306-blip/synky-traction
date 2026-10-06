"use client";
/* eslint-disable @next/next/no-img-element -- Brand previews use authenticated images and local object URLs. */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, ImagePlus, Palette, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brandPresets, contrastWithWhite, defaultBrand, validBrandColor } from "@/lib/traction-brand";
import type { Workspace } from "./traction-types";

type Props = { workspace: Workspace | null; demo: boolean; onPost: (payload: Record<string, unknown>) => Promise<unknown>; onReload: () => Promise<void>; onCreateOrganization: () => void };

export function BrandStudio({ workspace, demo, onPost, onReload, onCreateOrganization }: Props) {
  const [primary, setPrimary] = useState(workspace?.organization.brand_primary || defaultBrand.primary);
  const [sidebar, setSidebar] = useState(workspace?.organization.brand_sidebar || defaultBrand.sidebar);
  const [tagline, setTagline] = useState(workspace?.organization.brand_tagline || "");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const logoUrl = previewUrl || workspace?.organization.brand_logo_url || "";
  const primaryValid = validBrandColor(primary);
  const sidebarValid = validBrandColor(sidebar, 0.14);
  const primaryContrast = contrastWithWhite(primary);
  const sidebarContrast = contrastWithWhite(sidebar);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function chooseFile(next: File | undefined) {
    if (!next) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(next.type) || next.size > 2 * 1024 * 1024) {
      toast.error("Escolha uma imagem PNG, JPG ou WebP de até 2 MB.");
      return;
    }
    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
  }

  async function saveColors() {
    if (!workspace) { onCreateOrganization(); return; }
    if (!validBrandColor(primary) || !validBrandColor(sidebar, 0.14)) {
      toast.error("Escolha cores mais escuras para manter os textos legíveis.");
      return;
    }
    setSaving(true);
    try {
      await onPost({ action: "updateBrand", organizationId: workspace.organization.id, brandPrimary: primary, brandSidebar: sidebar, brandTagline: tagline });
      await onReload();
      toast.success("Identidade visual aplicada à empresa.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível salvar a identidade visual."); }
    finally { setSaving(false); }
  }

  async function changeLogo(action: "upload" | "remove") {
    if (!workspace) { onCreateOrganization(); return; }
    const form = new FormData();
    form.set("organizationId", workspace.organization.id);
    form.set("action", action);
    if (action === "upload") {
      if (!file) return;
      form.set("logo", file);
    }
    setUploading(true);
    try {
      const response = await fetch("/api/brand", { method: "POST", body: form });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível salvar a logo.");
      setFile(null);
      setPreviewUrl("");
      await onReload();
      toast.success(action === "upload" ? "Logo aplicada à empresa." : "Logo removida.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível alterar a logo."); }
    finally { setUploading(false); }
  }

  return <section className="panel brand-studio">
    <div className="panel-head"><div><span className="section-label">IDENTIDADE VISUAL</span><h2>A cara da sua empresa</h2><p>Personalize a experiência de quem trabalha neste espaço. Cada empresa mantém sua própria identidade.</p></div><Palette size={25} /></div>
    <div className="brand-studio-grid">
      <div className="brand-controls">
        <div><strong className="brand-control-title">Logo da empresa</strong><p className="brand-control-hint">Envie PNG, JPG ou WebP com até 2 MB. Uma versão horizontal ou quadrada funciona melhor.</p></div>
        <div className="brand-upload-row"><div className="brand-logo-tile">{logoUrl ? <img src={logoUrl} alt={`Logo de ${workspace?.organization.name || "empresa"}`} /> : <Building2 size={29} />}</div><div className="brand-upload-actions"><label className="brand-file-button"><ImagePlus size={16} /> Escolher imagem<input type="file" accept="image/png,image/jpeg,image/webp" disabled={demo || uploading} onChange={(event) => chooseFile(event.target.files?.[0])} /></label>{file && <Button variant="outline" size="sm" disabled={uploading} onClick={() => changeLogo("upload")}><Upload size={15} />{uploading ? "Enviando…" : "Salvar logo"}</Button>}{!file && workspace?.organization.brand_logo_url && <Button variant="ghost" size="sm" disabled={uploading} onClick={() => changeLogo("remove")}>Remover logo</Button>}</div></div>
        <div className="brand-palette-label"><strong className="brand-control-title">Paletas prontas</strong><span>Escolha um ponto de partida</span></div>
        <div className="brand-presets">{brandPresets.map((preset) => <button key={preset.name} type="button" className={primary.toUpperCase() === preset.primary.toUpperCase() && sidebar.toUpperCase() === preset.sidebar.toUpperCase() ? "selected" : ""} onClick={() => { setPrimary(preset.primary); setSidebar(preset.sidebar); }} aria-label={`Usar paleta ${preset.name}`}><i style={{ background: preset.sidebar }} /><i style={{ background: preset.primary }} /><span>{preset.name}</span></button>)}</div>
        <div className="brand-color-fields"><label className="field-label">Cor principal<div className="brand-color-input"><input type="color" value={primary} onChange={(event) => setPrimary(event.target.value)} aria-label="Escolher cor principal" /><Input aria-label="Código da cor principal" value={primary} onChange={(event) => setPrimary(event.target.value)} maxLength={7} /></div><small className={primaryValid ? "brand-contrast-pass" : "brand-contrast-fail"}>{primaryContrast === null ? "Use uma cor hexadecimal válida." : `${primaryContrast.toFixed(1)}:1 com texto branco · ${primaryValid ? "legível" : "contraste insuficiente"}`}</small></label><label className="field-label">Cor de apoio<div className="brand-color-input"><input type="color" value={sidebar} onChange={(event) => setSidebar(event.target.value)} aria-label="Escolher cor de apoio" /><Input aria-label="Código da cor de apoio" value={sidebar} onChange={(event) => setSidebar(event.target.value)} maxLength={7} /></div><small className={sidebarValid ? "brand-contrast-pass" : "brand-contrast-fail"}>{sidebarContrast === null ? "Use uma cor hexadecimal válida." : `${sidebarContrast.toFixed(1)}:1 com texto branco · ${sidebarValid ? "legível" : "contraste insuficiente"}`}</small></label></div>
        <label className="field-label">Frase da empresa<Input value={tagline} onChange={(event) => setTagline(event.target.value)} maxLength={100} placeholder="Ex.: Pessoas que constroem o futuro" /></label>
        <div className="brand-save-row"><Button className="action-primary" disabled={saving || uploading || !primaryValid || !sidebarValid} onClick={saveColors}>{saving ? "Salvando…" : demo ? "Criar empresa" : "Aplicar identidade"}</Button><button type="button" onClick={() => { setPrimary(defaultBrand.primary); setSidebar(defaultBrand.sidebar); setTagline(""); }}><RotateCcw size={15} /> Voltar às cores Synky</button></div>
      </div>
      <div className="brand-preview-wrap"><span className="section-label">PRÉVIA AO VIVO</span><p>Veja como o painel vai aparecer para esta empresa.</p><div className="brand-preview"><div className="brand-preview-sidebar"><div className="brand-preview-brand"><span>{logoUrl ? <img src={logoUrl} alt="" /> : <Building2 size={19} />}</span><div><strong>{workspace?.organization.name || "Sua empresa"}</strong><small>NO SYNKY TRACTION</small></div></div><div className="brand-preview-menu"><b style={{ background: primaryValid ? primary : defaultBrand.primary }}>Dashboard</b><span>Planejamento</span><span>Estrutura</span><span>Resultados</span></div></div><div className="brand-preview-content" style={{ background: sidebarValid ? sidebar : defaultBrand.sidebar }}><small>PAINEL DA EMPRESA</small><strong>{tagline || "Pessoas e prioridades em movimento."}</strong><p>Acompanhe o trabalho com a identidade da sua empresa.</p><span style={{ background: primaryValid ? primary : defaultBrand.primary }}>Nova prioridade</span></div></div>{(!primaryValid || !sidebarValid) && <small className="brand-contrast-fail">A prévia usa cores Synky onde o contraste escolhido não é suficiente.</small>}<small className="brand-preview-note">A logo, as cores e a frase aparecem somente para integrantes desta empresa.</small></div>
    </div>
  </section>;
}
