"use client";

import { useState } from "react";
import { BarChart3, Building2, ChevronRight, FileText, LayoutDashboard, Lightbulb, RefreshCw, ShieldCheck, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrganizationSummary } from "./traction-types";
import { ModuleHeading, moduleIntros } from "./traction-module-heading";

export function ResultsEntry({ organizations, onCreate, onCompanies, onModules, onOpen, onRefresh }: {
  organizations: OrganizationSummary[]; onCreate: () => void; onCompanies: () => void; onModules: () => void; onOpen: (id: string) => void; onRefresh: () => Promise<void>;
}) {
  const [companyId, setCompanyId] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  async function refresh() {
    setRefreshing(true); setError("");
    try { await onRefresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível atualizar as empresas. Tente novamente."); } finally { setRefreshing(false); }
  }
  return <div className="results-entry">
    <section className="results-entry-hero" aria-labelledby="results-entry-title">
      <ModuleHeading intro={moduleIntros.results} titleId="results-entry-title" />
      <svg className="results-hero-lines" viewBox="0 0 560 180" fill="none" aria-hidden="true"><path d="M0 170C65 100 85 133 120 139S180 43 228 73S303 179 371 111S442 5 550 15" stroke="#8cdb76" strokeWidth="1.2" /><path d="M0 173C64 184 84 92 142 114S210 99 264 107S297 29 337 42S430 172 500 95" stroke="#168161" strokeWidth="1.2" />{[[120,139],[228,73],[371,111]].map(([cx,cy]) => <circle key={cx} cx={cx} cy={cy} r="4" fill="#d5f58c" />)}</svg>
      <span className="results-hero-icon" aria-hidden="true"><BarChart3 size={31} /></span>
    </section>
    <div className="results-entry-layout">
      <section className="results-entry-preview" aria-labelledby="results-preview-title">
        <header><span className="results-preview-icon"><BarChart3 size={26} /></span><div><span>Prévia do módulo</span><h2 id="results-preview-title">Resultados</h2><p>Acompanhe suas metas, valores observados e evidências do período.</p></div><div className="results-preview-actions"><Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />{refreshing ? "Atualizando…" : "Atualizar"}</Button><Button variant="outline" size="sm" onClick={onModules}><LayoutDashboard size={16} />Todos os módulos</Button></div></header>
        {error && <p className="results-entry-error" role="alert">{error}</p>}
        <div className="results-entry-metrics" aria-label="Indicadores sem empresa selecionada">{([{label:"Metas",Icon:Target},{label:"Valores observados",Icon:BarChart3},{label:"Evidências",Icon:FileText}]).map(({label,Icon}) => <div key={label}><span><Icon size={24} /></span><div><h3>{label}</h3><strong aria-label="Sem empresa selecionada">—</strong><i aria-hidden="true" /><i aria-hidden="true" /></div></div>)}</div>
        <div className="results-entry-empty"><svg className="results-reference-empty-chart" viewBox="0 0 760 155" fill="none" aria-hidden="true"><path d="M0 130C45 132 56 66 95 91S145 121 166 88S214 35 245 61S288 120 330 54S369 8 410 51S475 140 525 82S578 10 615 47S662 133 727 40" stroke="#dce4e9" strokeWidth="1.6" strokeDasharray="6 5" />{[[166,88],[245,61],[369,25],[525,82],[615,47],[727,40]].map(([cx,cy])=><g key={cx}><path d={`M${cx} ${cy+9}V145`} stroke="#edf0f3" strokeDasharray="5 5"/><circle cx={cx} cy={cy} r="4" fill="#fff" stroke="#dce4e9" strokeWidth="2"/></g>)}</svg><span><BarChart3 size={29} /></span><h3>Seus indicadores aparecerão aqui.</h3><p>{organizations.length ? "Selecione uma empresa para visualizar metas, valores observados e evidências do período." : "Cadastre uma empresa para visualizar suas metas, valores observados e evidências no módulo Resultados."}</p><small>Nenhum resultado é exibido sem uma empresa selecionada.</small></div>
        {organizations.length > 0 && <div className="results-entry-picker"><label htmlFor="results-company">Empresa</label><select id="results-company" value={companyId} onChange={event => setCompanyId(event.target.value)}><option value="">Selecione uma empresa</option>{organizations.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select><Button className="action-primary" disabled={!companyId} onClick={() => onOpen(companyId)}>Abrir resultados</Button></div>}
      </section>
      <aside className="results-entry-setup" aria-labelledby="results-setup-title"><span className="results-entry-access"><ShieldCheck size={20} />Acesso master ativo</span><h2 id="results-setup-title">{organizations.length ? "Abra uma empresa" : "Comece com uma empresa"}</h2><p>{organizations.length ? "Escolha uma empresa para consultar os resultados do seu período." : "Para utilizar o módulo Resultados, primeiro cadastre uma empresa no seu ambiente master."}</p><Button className="action-primary" onClick={onCreate}><Building2 size={20} />Cadastrar empresa<ChevronRight size={18} /></Button><Button variant="outline" onClick={onCompanies}><Building2 size={20} />Central de empresas<ChevronRight size={18} /></Button><div className="results-entry-next"><span><Lightbulb size={21} /></span><div><h3>Depois de cadastrar</h3><p>Defina metas no plano do ciclo e registre valores e evidências para acompanhar a evolução.</p></div></div></aside>
    </div>
  </div>;
}
