"use client";

import { ReferenceArt } from "./traction-reference-art";
import { useState } from "react";
import { BarChart3, Building2, CirclePlus, ClipboardList, LayoutDashboard, RefreshCw, ShieldCheck, Sprout, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrganizationSummary } from "./traction-types";
import { ModuleHeading, moduleIntros } from "./traction-module-heading";

export function GrowthEntry({ organizations, onCreate, onCompanies, onModules, onOpen, onRefresh }: {
  organizations: OrganizationSummary[]; onCreate: () => void; onCompanies: () => void; onModules: () => void; onOpen: (id: string) => void; onRefresh: () => Promise<void>;
}) {
  const [companyId, setCompanyId] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  async function refresh() {
    setRefreshing(true); setError("");
    try { await onRefresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível atualizar as empresas. Tente novamente."); } finally { setRefreshing(false); }
  }
  return <div className="growth-entry">
    <header className="growth-entry-heading"><ModuleHeading intro={moduleIntros.promotions} /><div className="growth-entry-controls"><div><span className="growth-entry-access"><ShieldCheck size={15} />Acesso master ativo</span><Button variant="outline" size="sm" onClick={onModules}><LayoutDashboard size={15} />Todos os módulos</Button></div><div><Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />{refreshing ? "Atualizando…" : "Atualizar"}</Button><Button variant="outline" size="sm" onClick={onCompanies}><Building2 size={16} />Central de empresas</Button><Button className="action-primary" size="sm" onClick={onCreate}><CirclePlus size={16} />Cadastrar empresa</Button></div></div></header>
    {error && <p className="growth-entry-error" role="alert">{error}</p>}
    <div className="growth-entry-layout">
      <section className="growth-entry-journey" aria-labelledby="growth-journey-title"><header><span className="growth-preview-label">PRÉVIA DO MÓDULO</span><h2 id="growth-journey-title">Jornada de desenvolvimento</h2><p>Estruture avaliações, planos e acompanhamentos<br className="growth-copy-break" /> para impulsionar o crescimento interno.</p></header>
        <div className="growth-entry-process" aria-label="Jornada ilustrativa: avaliação, plano de desenvolvimento e acompanhamento. Não representa avaliações ou resultados cadastrados."><svg viewBox="0 0 600 240" preserveAspectRatio="none" fill="none" aria-hidden="true"><defs><linearGradient id="growth-process-line" x1="0" y1="0" x2="600" y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="#eaf1d1"/><stop offset=".5" stopColor="#bfd9ca"/><stop offset="1" stopColor="#bfdfa2"/></linearGradient></defs><path d="M0 195C55 220 94 135 174 167S250 230 310 207S388 142 446 167S512 214 579 147" stroke="url(#growth-process-line)" strokeWidth="5"/><path d="M108 137V174M300 154V208M492 133V179" stroke="#8e9e98" strokeDasharray="4 3" />{[[108,174],[300,208],[492,179]].map(([cx,cy])=><g key={cx}><circle cx={cx} cy={cy} r="12" fill="#f1f7db"/><circle cx={cx} cy={cy} r="5" fill="#fff" stroke="#163c31" strokeWidth="1.3"/></g>)}<circle cx="579" cy="147" r="13" fill="#f0f9d8"/><path d="M575 151L583 143M576 142L583 143L584 150" stroke="#006447" strokeWidth="1.5"/></svg><ol>{[{title:"Avaliação",text:"Mapeie competências e identifique potenciais.",Icon:ClipboardList},{title:"Plano de desenvolvimento",text:"Defina ações e trilhas de crescimento.",Icon:Sprout},{title:"Acompanhamento",text:"Monitore a evolução e fortaleça a continuidade.",Icon:BarChart3}].map(({title,text,Icon})=><li key={title}><span><Icon size={26}/></span><h3>{title}</h3><p>{text}</p></li>)}</ol></div>
        {organizations.length > 0 && <footer className="growth-entry-picker"><label htmlFor="growth-company">Empresa</label><select id="growth-company" value={companyId} onChange={event => setCompanyId(event.target.value)}><option value="">Selecione uma empresa</option>{organizations.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select><Button className="action-primary" size="sm" disabled={!companyId} onClick={() => onOpen(companyId)}>Abrir evolução interna</Button></footer>}
      </section>
      <aside className="growth-entry-setup" aria-labelledby="growth-setup-title"><div><span className="growth-preview-label">PRÉVIA DO MÓDULO</span><h2 id="growth-setup-title">Potencial que<br />vira <em>evolução.</em></h2><p>{organizations.length ? "Selecione uma empresa para conectar avaliações e planos de desenvolvimento." : "Cadastre uma empresa para conectar avaliações e planos de desenvolvimento."}</p><Button className="growth-entry-create" onClick={onCreate}><CirclePlus size={19} />Cadastrar empresa</Button></div><ReferenceArt name="growth" className="growth-reference-art" /></aside>
    </div>
    <section className="growth-entry-features" aria-label="Desenvolvimento com critérios"><div><span><Target size={30}/></span><div><h2>Promoção com critérios</h2><p>Baseie as decisões de promoção em avaliações e planos estruturados, com transparência e alinhamento.</p></div></div><div><span><BarChart3 size={30}/></span><div><h2>Desenvolvimento com continuidade</h2><p>Transforme avaliação em planos práticos e acompanhe a evolução ao longo do tempo.</p></div></div></section>
  </div>;
}
