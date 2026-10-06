"use client";

import { ReferenceArt } from "./traction-reference-art";
import { useState } from "react";
import { ArrowRight, BarChart3, Building2, Info, RefreshCw, Search, ShieldCheck, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrganizationSummary } from "./traction-types";

export function CyclePlanningEntry({ organizations, onOpen, onCreate, onRefresh, onCompanies, onModules }: {
  organizations: OrganizationSummary[];
  onOpen: (id: string) => void;
  onCreate: () => void;
  onRefresh: () => Promise<void>;
  onCompanies: () => void;
  onModules: () => void;
}) {
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const filtered = organizations.filter(company => company.name.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR")));
  async function refresh() {
    setRefreshing(true); setError("");
    try { await onRefresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível atualizar as empresas. Tente novamente."); } finally { setRefreshing(false); }
  }
  return <div className="cycle-entry">
    <section className="cycle-entry-access" aria-label="Acesso master"><span className="cycle-entry-shield"><ShieldCheck size={20} /></span><div><strong>Acesso master ativo</strong><p>Selecione uma empresa para abrir seu plano.</p></div><button onClick={onModules}>Todos os módulos<ArrowRight size={16} /></button></section>
    <div className="cycle-entry-workspace">
      <section className="cycle-entry-direction" aria-labelledby="cycle-direction-title"><span>DIREÇÃO PARA O PRÓXIMO CICLO</span><h2 id="cycle-direction-title">Clareza para decidir.<br />Foco para executar.</h2><p>Objetivos, prioridades e responsáveis conectados.</p><ReferenceArt name="cycle" className="cycle-reference-art" /></section>
      <section className="cycle-entry-companies" aria-labelledby="cycle-entry-companies-title">
        <header><h2 id="cycle-entry-companies-title">Empresas <span>{organizations.length}</span></h2><Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />{refreshing ? "Atualizando…" : "Atualizar"}</Button></header>
        {error && <p className="cycle-entry-error" role="alert">{error}</p>}
        {organizations.length > 0 ? <>
          <label className="cycle-entry-search"><Search size={17} /><input type="search" aria-label="Buscar empresa para planejar" placeholder="Buscar empresa" value={search} onChange={event => setSearch(event.target.value)} /></label>
          {filtered.length ? <div className="cycle-entry-company-list">{filtered.map(company => <button key={company.id} aria-label={`Abrir plano de ${company.name}`} onClick={() => onOpen(company.id)}><Building2 size={22} /><span><strong>{company.name}</strong><small>Abrir plano do ciclo</small></span><ArrowRight size={17} /></button>)}</div> : <div className="cycle-entry-search-empty"><Search size={24} /><h3>Nenhuma empresa encontrada</h3><p>Revise o nome ou limpe a busca.</p><Button variant="outline" size="sm" onClick={() => setSearch("")}>Limpar busca</Button></div>}
          <footer><Info size={16} /><span>{filtered.length} {filtered.length === 1 ? "empresa encontrada" : "empresas encontradas"}.</span><button onClick={onCompanies}>Abrir central de empresas</button></footer>
        </> : <>
          <div className="cycle-entry-empty"><span className="cycle-entry-building"><Building2 size={32} /></span><h3>Cadastre uma empresa para começar.</h3><p>O plano do ciclo é organizado por empresa.<br />Crie seu primeiro espaço para definir objetivos e prioridades.</p><Button className="action-primary" onClick={onCreate}>Cadastrar primeira empresa<ArrowRight size={17} /></Button><button className="cycle-entry-central-link" onClick={onCompanies}>Abrir central de empresas</button></div>
          <footer><Info size={16} /><span>Nenhuma empresa cadastrada.</span></footer>
        </>}
      </section>
    </div>
    <ol className="cycle-entry-steps" aria-label="Como organizar seu ciclo"><li><span>01</span><Building2 size={24} /><div><strong>Escolha a empresa</strong><small>Abra o espaço de trabalho.</small></div></li><li><span>02</span><Target size={24} /><div><strong>Defina o ciclo</strong><small>Estabeleça objetivos e prioridades.</small></div></li><li><span>03</span><BarChart3 size={24} /><div><strong>Acompanhe a execução</strong><small>Conecte responsáveis e resultados.</small></div></li></ol>
  </div>;
}
