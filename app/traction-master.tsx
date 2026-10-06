"use client";

import { ReferenceArt } from "./traction-reference-art";
import { useState } from "react";
import { ArrowRight, BarChart3, BookOpenText, Building2, LayoutGrid, RefreshCw, Search, ShieldCheck, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrganizationSummary } from "./traction-types";

export function MasterConsole({ organizations, onOpen, onCreate, onRefresh, onModules, onGuide, displayName, module }: {
  organizations: OrganizationSummary[]; onOpen: (id: string) => void; onCreate: () => void; onRefresh: () => Promise<void>; onModules: () => void; onGuide: () => void; displayName: string; module?: string;
}) {
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const filtered = organizations.filter(company => company.name.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR")));
  async function refresh() {
    setRefreshing(true);
    try { await onRefresh(); } finally { setRefreshing(false); }
  }
  return <div className="master-console company-directory-reference">
    <div className="directory-access-banner"><span className="directory-shield"><ShieldCheck size={29} /></span><div><strong><span className="directory-access-dot" />Acesso master ativo</strong><p>Gerencie empresas, equipes e configurações.</p></div><Button variant="outline" onClick={onModules}><LayoutGrid size={16} />Todos os módulos<ArrowRight size={16} /></Button></div>
    <section className="panel master-companies">
      <div className="panel-head"><div><h2>Empresas <span className="count-chip">{organizations.length}</span></h2><p>{module ? `Selecione uma empresa para abrir ${module}.` : "Espaços cadastrados na plataforma."}</p></div><div className="master-company-actions"><Button variant="outline" disabled={refreshing} onClick={refresh}><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />{refreshing ? "Atualizando…" : "Atualizar"}</Button>{module && <Button className="action-primary" onClick={onCreate}><Building2 size={16} /> Cadastrar empresa</Button>}</div></div>
      {organizations.length > 0 && <div className="master-directory-tools"><label className="master-company-search"><Search size={17} /><input type="search" aria-label="Buscar empresa" placeholder="Buscar pelo nome da empresa" value={search} onChange={event => setSearch(event.target.value)} /></label><span>{filtered.length} {filtered.length === 1 ? "empresa" : "empresas"}</span></div>}
      {organizations.length ? filtered.length ? <div className="master-company-list">{filtered.map(company => <button key={company.id} onClick={() => onOpen(company.id)}><span className="master-company-icon"><Building2 size={22} /></span><span><strong>{company.name}</strong><small>Registros, pessoas e administração</small></span><span className="master-company-open">Abrir empresa <ArrowRight size={18} /></span></button>)}</div> : <div className="master-search-empty"><Search size={24} /><strong>Nenhuma empresa encontrada</strong><p>Revise o nome ou limpe a busca.</p><Button variant="outline" size="sm" onClick={() => setSearch("")}>Limpar busca</Button></div> : <div className="directory-first-company"><div className="directory-company-art"><ReferenceArt name="companies" /></div><div className="directory-first-copy"><h3>Sua primeira empresa<br />começa aqui.</h3><p>Crie um espaço para conectar estrutura, pessoas e execução.</p><Button className="action-primary" onClick={onCreate}><Building2 size={18} />Cadastrar primeira empresa<ArrowRight size={17} /></Button><button className="directory-guide-link" onClick={onGuide}><BookOpenText size={17} />Ver boas práticas</button></div></div>}
      <div className="directory-benefits"><div><span><Building2 size={21} /></span><div><strong>Identidade própria</strong><small>Nome, logo e cores</small></div></div><div><span><UsersRound size={21} /></span><div><strong>Equipe organizada</strong><small>Acessos e responsabilidades</small></div></div><div><span><BarChart3 size={21} /></span><div><strong>Gestão conectada</strong><small>Pessoas, ciclos e resultados</small></div></div></div>
    </section>
    <footer className="directory-footer"><span><ShieldCheck size={15} />Acesso global à plataforma</span><strong>{displayName}</strong></footer>
  </div>;
}
