"use client";

import { ReferenceArt } from "./traction-reference-art";
import { useState } from "react";
import { BriefcaseBusiness, Building2, ChevronRight, CircleCheck, CirclePlus, LayoutDashboard, MessagesSquare, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrganizationSummary } from "./traction-types";
import { ModuleHeading, moduleIntros } from "./traction-module-heading";

export function HiringEntry({ organizations, onCreate, onCompanies, onModules, onOpen, onRefresh }: {
  organizations: OrganizationSummary[]; onCreate: () => void; onCompanies: () => void; onModules: () => void; onOpen: (id: string) => void; onRefresh: () => Promise<void>;
}) {
  const [companyId, setCompanyId] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  async function refresh() {
    setRefreshing(true); setError("");
    try { await onRefresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível atualizar as empresas. Tente novamente."); } finally { setRefreshing(false); }
  }
  const prompt = organizations.length ? "Selecione uma empresa" : "Cadastre uma empresa";
  return <div className="hiring-entry">
    <header className="hiring-entry-heading"><ModuleHeading intro={moduleIntros.hiring} /></header>
    <section className="hiring-entry-hero" aria-labelledby="hiring-hero-title"><div className="hiring-entry-hero-copy"><h2 id="hiring-hero-title">Construa seu <em>próximo time.</em></h2><p>{prompt} para organizar suas contratações.</p><div><Button className="hiring-entry-create" onClick={onCreate}><CirclePlus size={18} />Cadastrar empresa</Button><Button variant="outline" className="hiring-entry-central" onClick={onCompanies}><Building2 size={17} />Central de empresas</Button></div></div><div className="hiring-entry-access"><span><ShieldCheck size={18} />Acesso master ativo</span><p>Como administrador master, você pode cadastrar empresas e acessar seus módulos.</p></div><ReferenceArt name="hiring" className="hiring-entry-art" /></section>
    <section className="hiring-entry-flow" aria-labelledby="hiring-flow-title"><header><div><span>Prévia do módulo</span><h2 id="hiring-flow-title">Fluxo de contratações</h2><p>Visualize como suas vagas evoluem, da abertura à decisão.</p></div><div className="hiring-entry-actions"><Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />{refreshing ? "Atualizando…" : "Atualizar"}</Button><Button className="action-primary" size="sm" onClick={onModules}><LayoutDashboard size={16} />Todos os módulos</Button></div></header>
      {error && <p className="hiring-entry-error" role="alert">{error}</p>}
      <ol className="hiring-entry-stages" aria-label="Etapas do processo de contratação">{[{title:"Vagas",text:"para criar suas vagas.",Icon:BriefcaseBusiness},{title:"Entrevistas",text:"para iniciar entrevistas.",Icon:MessagesSquare},{title:"Decisões",text:"para registrar as decisões.",Icon:CircleCheck}].map(({title,text,Icon},index) => <li key={title}><header><span><Icon size={25} /></span><div><h3>{title}</h3><p>Prévia do módulo</p></div></header><i className="hiring-stage-accent" aria-hidden="true" /><div className="hiring-stage-empty"><Icon size={28} /><p>{prompt}<br />{text}</p><span aria-hidden="true" /><span aria-hidden="true" /></div>{index < 2 && <ChevronRight className="hiring-stage-connector" size={21} aria-hidden="true" />}</li>)}</ol>
      {organizations.length > 0 && <footer className="hiring-entry-picker"><label htmlFor="hiring-company">Empresa</label><select id="hiring-company" value={companyId} onChange={event => setCompanyId(event.target.value)}><option value="">Selecione uma empresa</option>{organizations.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select><Button className="action-primary" disabled={!companyId} onClick={() => onOpen(companyId)}>Abrir contratações</Button></footer>}
    </section>
  </div>;
}
