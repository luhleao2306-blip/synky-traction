"use client";

import { useState } from "react";
import { BarChart3, BookOpenText, BriefcaseBusiness, Building2, ChevronRight, FileText, GitBranch, LayoutDashboard, Plus, RefreshCw, ShieldCheck, Target, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrganizationSummary } from "./traction-types";
import { ModuleHeading, moduleIntros } from "./traction-module-heading";

export function StructureEntry({ organizations, onCreate, onCompanies, onModules, onGuide, onOpen, onRefresh }: {
  organizations: OrganizationSummary[]; onCreate: () => void; onCompanies: () => void; onModules: () => void; onGuide: () => void; onOpen: (id: string) => void; onRefresh: () => Promise<void>;
}) {
  const [companyId, setCompanyId] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  async function refresh() {
    setRefreshing(true); setError("");
    try { await onRefresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível atualizar as empresas. Tente novamente."); } finally { setRefreshing(false); }
  }
  return <div className="structure-entry">
    <header className="structure-entry-heading"><ModuleHeading intro={moduleIntros.structure} /><div className="structure-entry-controls"><span className="structure-entry-access"><ShieldCheck size={16} />Acesso master ativo</span><div><Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />{refreshing ? "Atualizando…" : "Atualizar"}</Button><Button variant="outline" size="sm" onClick={onCompanies}><Building2 size={16} />Central de empresas</Button><Button className="action-primary" size="sm" onClick={onCreate}><Plus size={18} />Cadastrar empresa</Button><Button className="structure-entry-modules" size="sm" onClick={onModules}><LayoutDashboard size={16} />Todos os módulos</Button></div></div></header>
    {error && <p className="structure-entry-error" role="alert">{error}</p>}
    <div className="structure-entry-layout">
      <aside className="structure-entry-setup"><span className="structure-entry-building"><Building2 size={25} /></span><h2>Desenhe a estrutura <br />da sua empresa.</h2><p>{organizations.length ? "Selecione uma empresa para organizar suas áreas e cargos." : "Cadastre uma empresa para definir áreas e cargos."}</p><Button className="structure-entry-create" onClick={onCreate}><Plus size={20} />Cadastrar empresa</Button><div className="structure-entry-links"><button onClick={onCompanies}><Building2 size={24} /><span><strong>Central de empresas</strong><small>Gerencie suas empresas</small></span><ChevronRight size={17} /></button><button onClick={onGuide}><BookOpenText size={24} /><span><strong>Como funciona?</strong><small>Veja o guia rápido</small></span><ChevronRight size={17} /></button></div></aside>
      <section className="structure-entry-preview" aria-labelledby="structure-preview-title"><header><GitBranch size={27} /><div><h2 id="structure-preview-title">Prévia da estrutura</h2><p>Visualização ilustrativa de como suas áreas e cargos serão organizados.</p></div><div className="structure-entry-legend" aria-label="Legenda do organograma"><span><i />Áreas</span><span><i />Cargos</span><span><i />Responsabilidades</span></div></header>
        <div className="structure-entry-diagram" role="img" aria-label="Exemplo ilustrativo: uma empresa conecta áreas, cada área reúne cargos e cada cargo possui responsabilidades. Não representa registros cadastrados.">
          <svg viewBox="0 0 660 265" preserveAspectRatio="none" fill="none" aria-hidden="true"><path d="M330 40V67M110 89V79Q110 67 123 67H537Q550 67 550 79V89M330 67V89" />{[110,330,550].map(x => <g key={x}><path d={`M${x} 119V141M${x-49} 160V153Q${x-49} 141 ${x-37} 141H${x+37}Q${x+49} 141 ${x+49} 153V160`} />{[x-49,x+49].map(cx => <path key={cx} d={`M${cx} 190V208M${cx-20} 229V219Q${cx-20} 208 ${cx-9} 208H${cx+9}Q${cx+20} 208 ${cx+20} 219V229`} />)}</g>)}</svg>
          <span className="structure-node structure-node-company"><Building2 size={25} /></span>
          <div className="structure-diagram-branches">{[0,1,2].map(area => <div className="structure-diagram-area" key={area}><span className="structure-node structure-node-area"><UsersRound size={21} /></span><div className="structure-diagram-roles">{[0,1].map(role => <div key={role}><span className="structure-node structure-node-role"><BriefcaseBusiness size={19} /></span><div className="structure-diagram-duties">{[0,1].map(duty => <span key={duty} className="structure-node structure-node-duty"><FileText size={16} /></span>)}</div></div>)}</div></div>)}</div>
        </div>
        {organizations.length > 0 && <div className="structure-entry-picker"><label htmlFor="structure-company">Empresa</label><select id="structure-company" value={companyId} onChange={event => setCompanyId(event.target.value)}><option value="">Selecione uma empresa</option>{organizations.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select><Button className="action-primary" size="sm" disabled={!companyId} onClick={() => onOpen(companyId)}>Abrir estrutura</Button></div>}
      </section>
    </div>
    <section className="structure-entry-features" aria-label="O que definir em cada cargo">{[{title:"Responsabilidades",text:"Defina o que cada cargo é responsável por entregar.",Icon:FileText},{title:"Competências",text:"Estabeleça as competências necessárias para cada cargo.",Icon:BarChart3},{title:"Critérios",text:"Crie critérios claros para avaliação e desenvolvimento.",Icon:Target}].map(({title,text,Icon}) => <div key={title}><span><Icon size={24} /></span><div><h2>{title}</h2><p>{text}</p></div></div>)}</section>
  </div>;
}
