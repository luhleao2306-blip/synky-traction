"use client";
/* eslint-disable @next/next/no-img-element -- Company identity previews use local object URLs. */
import { useEffect, useState } from "react";
import { Building2, Check, ImagePlus, LayoutDashboard, Palette, ShieldCheck, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brandPresets, contrastWithWhite, defaultBrand, validBrandColor } from "@/lib/traction-brand";
import { readBrandLogo } from "@/lib/traction-logo";
import "./traction-company-setup.css";

type Props = { onClose: () => void; onComplete: (id: string) => Promise<void> };
export function CompanySetupDialog({ onClose, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [privacy, setPrivacy] = useState("");
  const [retention, setRetention] = useState("");
  const [primary, setPrimary] = useState(defaultBrand.primary);
  const [sidebar, setSidebar] = useState(defaultBrand.sidebar);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkingLogo, setCheckingLogo] = useState(false);
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState("");
  const [requestId] = useState(() => crypto.randomUUID());
  const primaryValid = validBrandColor(primary);
  const sidebarValid = validBrandColor(sidebar, 0.14);
  const shownName = name.trim() || "Sua empresa";
  const previewStyle = { "--setup-primary": primaryValid ? primary : defaultBrand.primary, "--setup-sidebar": sidebarValid ? sidebar : defaultBrand.sidebar } as React.CSSProperties;
  useEffect(() => () => { if (logoUrl) URL.revokeObjectURL(logoUrl); }, [logoUrl]);

  function validateData() {
    if (name.trim().length < 2) return "Informe um nome de empresa com pelo menos 2 caracteres.";
    if (privacy && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(privacy.trim())) return "Confira o email do contato de privacidade.";
    if (retention && (!Number.isInteger(Number(retention)) || Number(retention) < 1 || Number(retention) > 3650)) return "Use um prazo de retenção entre 1 e 3650 dias.";
    return "";
  }
  function go(next: number) {
    const message = next > 0 ? validateData() : "";
    if (message) { setError(message); return; }
    if (next > 1 && (!primaryValid || !sidebarValid)) { setError("Escolha cores com contraste suficiente antes de continuar."); return; }
    setError(""); setStep(next);
  }
  async function chooseLogo(file?: File) {
    if (!file) return;
    setCheckingLogo(true); setError("");
    try {
      const image = await readBrandLogo(file);
      if ("error" in image) throw new Error(image.error);
      const decoded = await createImageBitmap(file); decoded.close();
      setLogo(file); setLogoUrl(URL.createObjectURL(file));
    } catch (failure) { const message = failure instanceof Error ? failure.message : ""; setError(message.startsWith("Envie") || message.startsWith("Formato") ? message : "Não foi possível abrir essa imagem. Escolha outro arquivo PNG, JPG ou WebP."); }
    finally { setCheckingLogo(false); }
  }
  async function finish() {
    const message = validateData();
    if (!createdId && (message || !primaryValid || !sidebarValid)) { setError(message || "Confira o contraste das cores."); return; }
    setBusy(true); setError("");
    let id = createdId;
    try {
      if (!id) {
        const form = new FormData();
        Object.entries({ action: "createOrganization", requestId, name: name.trim(), brandTagline: tagline.trim(), brandPrimary: primary, brandSidebar: sidebar, privacyContact: privacy.trim(), retentionDays: retention }).forEach(([key, value]) => form.set(key, value));
        if (logo) form.set("logo", logo);
        const response = await fetch("/api/workspace", { method: "POST", body: form });
        const result = await response.json() as { id?: string; error?: string };
        if (!response.ok || !result.id) throw new Error(result.error || "Não foi possível criar a empresa. Tente novamente.");
        id = result.id; setCreatedId(id);
      }
      await onComplete(id);
    } catch (failure) { setError(id ? "A empresa foi criada, mas não conseguimos abrir o painel. Tente abrir novamente; o cadastro está salvo." : failure instanceof Error ? failure.message : "Não foi possível concluir. Suas escolhas continuam aqui para tentar novamente."); }
    finally { setBusy(false); }
  }
  return <Dialog open onOpenChange={(open) => { if (!open && !busy && !checkingLogo) onClose(); }}><DialogContent className="company-setup-dialog synky-dialog" showCloseButton={!busy && !checkingLogo} onEscapeKeyDown={(event) => { if (busy || checkingLogo) event.preventDefault(); }} onPointerDownOutside={(event) => { if (busy || checkingLogo) event.preventDefault(); }}>
    <DialogHeader><span className="company-setup-eyebrow">ESPAÇO DA EMPRESA</span><DialogTitle>Seu painel, com a sua marca.</DialogTitle><DialogDescription>Configure a empresa uma vez. Toda a equipe verá essa identidade.</DialogDescription></DialogHeader>
    <nav className="company-setup-steps" aria-label="Etapas do cadastro">{["Empresa", "Identidade", "Revisar"].map((label, index) => <button key={label} type="button" aria-current={step === index ? "step" : undefined} disabled={busy || checkingLogo || !!createdId} onClick={() => go(index)}><span>{index < step ? <Check size={14} /> : index + 1}</span>{label}</button>)}</nav>
    <div className="company-setup-layout"><div className="company-setup-fields">
      {step === 0 && <><h3>Como sua empresa será apresentada?</h3><label className="field-label">Nome da empresa <span aria-hidden="true">*</span><Input autoFocus autoComplete="organization" value={name} disabled={busy} maxLength={100} onChange={(event) => setName(event.target.value)} placeholder="Nome que aparecerá no painel" /></label><label className="field-label">Frase da empresa <small>Opcional</small><Input value={tagline} maxLength={100} onChange={(event) => setTagline(event.target.value)} placeholder="Uma frase que represente sua equipe" /></label><details className="company-extra"><summary>Contato e gestão de dados <span>Opcional</span></summary><label className="field-label">Contato de privacidade<Input value={privacy} type="email" maxLength={254} onChange={(event) => setPrivacy(event.target.value)} placeholder="privacidade@empresa.com" /></label><label className="field-label">Prazo de retenção de candidaturas (dias)<Input type="number" min={1} max={3650} value={retention} onChange={(event) => setRetention(event.target.value)} placeholder="Ex.: 180" /><small>Indica quando revisar os dados. Não exclui registros automaticamente.</small></label></details></>}
      {step === 1 && <><h3>Escolha a identidade do seu espaço</h3><div className="company-logo-upload"><span>{logoUrl ? <img src={logoUrl} alt={`Logo de ${shownName}`} /> : <ImagePlus size={26} />}</span><div><label className="company-file-button">{checkingLogo ? "Conferindo imagem…" : logo ? "Trocar logo" : "Adicionar logo"}<input aria-label="Logo da empresa" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy || checkingLogo} onChange={(event) => { void chooseLogo(event.target.files?.[0]); event.target.value = ""; }} /></label><small>PNG, JPG ou WebP · até 2 MB</small>{logo && <button type="button" className="company-logo-remove" onClick={() => { setLogo(null); setLogoUrl(""); }}><X size={13} /> Remover</button>}</div></div><span className="field-label">Comece com uma paleta</span><div className="company-preset-grid">{brandPresets.map(preset => <button key={preset.name} type="button" aria-label={`Usar paleta ${preset.name}`} aria-pressed={primary.toUpperCase() === preset.primary.toUpperCase() && sidebar.toUpperCase() === preset.sidebar.toUpperCase()} onClick={() => { setPrimary(preset.primary); setSidebar(preset.sidebar); setError(""); }}><i style={{ background: preset.sidebar }} /><i style={{ background: preset.primary }} />{preset.name}</button>)}</div><div className="company-color-grid">{[{label:"Cor principal",color:primary,set:setPrimary,valid:primaryValid},{label:"Cor de apoio",color:sidebar,set:setSidebar,valid:sidebarValid}].map(field=><label key={field.label} className="field-label">{field.label}<div className="company-color-input"><input aria-label={`Escolher ${field.label.toLowerCase()}`} type="color" value={/^#[\da-fA-F]{6}$/.test(field.color) ? field.color : defaultBrand.primary} onChange={event=>field.set(event.target.value)} /><Input aria-label={`Código da ${field.label.toLowerCase()}`} value={field.color} maxLength={7} onChange={event=>field.set(event.target.value)} /></div><small className={field.valid ? "brand-contrast-pass" : "brand-contrast-fail"}>{contrastWithWhite(field.color)?.toFixed(1) || "—"}:1 com branco · {field.valid ? "legível" : "ajuste o contraste"}</small></label>)}</div><p className="company-setup-note">A cor principal destaca botões e a seleção do menu. A cor de apoio aparece no dashboard e na área da conta.</p></>}
      {step === 2 && <><h3>Pronto para abrir seu espaço</h3><dl className="company-review"><div><dt>Empresa</dt><dd>{name.trim()}</dd></div><div><dt>Logo</dt><dd>{logo ? logo.name : "Usar nome da empresa"}</dd></div><div><dt>Cores</dt><dd><i style={{background:primary}} />{primary.toUpperCase()}<i style={{background:sidebar}} />{sidebar.toUpperCase()}</dd></div>{tagline && <div><dt>Frase</dt><dd>{tagline}</dd></div>}{privacy && <div><dt>Contato de privacidade</dt><dd>{privacy}</dd></div>}{retention && <div><dt>Retenção</dt><dd>{retention} dias</dd></div>}</dl><p className="company-review-note"><ShieldCheck size={20} /><span>Você será administrador desta empresa. Logo, cores e nome ficam salvos para todos os integrantes.</span></p><p className="company-setup-note">Você pode alterar essas escolhas em Administração. Os registros começam vazios, prontos para a sua equipe.</p></>}
    </div><aside className="company-live-preview" style={previewStyle} aria-label="Prévia da identidade da empresa"><div className="company-preview-label"><Palette size={16} /> Prévia ao vivo</div><div className="company-preview-screen"><div className="company-preview-nav"><div className="company-preview-brand">{logoUrl ? <img src={logoUrl} alt="Logo na prévia" /> : <Building2 size={28} />}<strong>{shownName}</strong><small>NO SYNKY TRACTION</small></div><span className="company-preview-selected"><LayoutDashboard size={16} /> Dashboard</span><span>Plano do ciclo</span><span>Áreas e cargos</span><span>Resultados</span></div><div className="company-preview-main"><span className="company-preview-company">{shownName}</span><strong>Dashboard</strong><p>{tagline || "Seu espaço de trabalho"}</p><div className="company-preview-empty"><Building2 size={22} /><b>Próximo ciclo</b><small>Organize prioridades e responsáveis.</small></div><span className="company-preview-action">Criar ciclo</span></div></div><p>Prévia de aparência. Seus dados serão cadastrados depois.</p></aside></div>
    {error && <p className="company-setup-error" role="alert">{error}</p>}
    <footer className="company-setup-footer"><Button type="button" variant="outline" disabled={busy || checkingLogo} onClick={() => step > 0 && !createdId ? go(step - 1) : onClose()}>{step > 0 && !createdId ? "Voltar" : "Cancelar"}</Button><small>Etapa {step + 1} de 3</small>{step < 2 ? <Button type="button" className="action-primary" disabled={busy || checkingLogo} onClick={() => go(step + 1)}>Continuar</Button> : <Button type="button" className="action-primary" disabled={busy || checkingLogo} onClick={finish}>{busy ? "Preparando seu painel…" : createdId ? "Abrir painel" : "Criar empresa e abrir painel"}</Button>}</footer>
  </DialogContent></Dialog>;
}
