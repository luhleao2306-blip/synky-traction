"use client";

import { ReferenceArt } from "./traction-reference-art";
import { useState } from "react";
import { BookOpenText, Building2, Database, LockKeyhole, Palette, Plus, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrganizationSummary } from "./traction-types";
import { ModuleHeading, moduleIntros } from "./traction-module-heading";

const settings = [
  { title: "Empresa", description: "Dados e identificação", Icon: Building2 },
  { title: "Identidade visual", description: "Logo e cores da empresa", Icon: Palette },
  { title: "Pessoas e acessos", description: "Equipe e permissões", Icon: Users },
  { title: "Dados", description: "Informações do ambiente", Icon: Database },
];

export function AdminEntry({ organizations, onCreate, onCompanies, onModules, onGuide, onOpen, onRefresh }: {
  organizations: OrganizationSummary[]; onCreate: () => void; onCompanies: () => void;
  onModules: () => void; onGuide: () => void; onOpen: (id: string) => void | Promise<void>;
  onRefresh: () => Promise<void>;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function refresh() {
    setRefreshing(true); setError("");
    try { await onRefresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível atualizar as empresas. Tente novamente."); }
    finally { setRefreshing(false); }
  }
  async function open(id: string) {
    setOpening(id); setError("");
    try { await onOpen(id); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível abrir a empresa. Tente novamente."); }
    finally { setOpening(null); }
  }
  return <div className="admin-entry">
    <header className="admin-entry-heading"><ModuleHeading intro={moduleIntros.admin} /><div className="admin-entry-heading-actions"><span className="admin-entry-master"><ShieldCheck size={17} />Acesso master ativo</span><Button variant="outline" onClick={onModules}>Todos os módulos</Button></div></header>
    <div className="admin-entry-layout">
      <section className="admin-entry-settings" aria-labelledby="admin-entry-settings-title"><header><h2 id="admin-entry-settings-title">Configurações da empresa</h2><span>Prévia das configurações</span></header><p>{organizations.length ? "Selecione uma empresa abaixo para configurar seu espaço." : "Disponíveis após cadastrar uma empresa."}</p><ul>{settings.map(({ title, description, Icon }) => <li key={title}><span className="admin-entry-setting-icon"><Icon size={23} /></span><div><h3>{title}</h3><p>{description}</p></div><LockKeyhole size={17} aria-hidden="true" /><span className="sr-only">Selecione uma empresa para acessar</span></li>)}</ul></section>
      <aside className="admin-entry-space" aria-labelledby="admin-entry-space-title"><h2 id="admin-entry-space-title">Tudo começa pelo<br />seu espaço.</h2><p>{organizations.length ? "Abra uma empresa para configurar sua identidade, equipe e dados." : "Cadastre uma empresa para configurar sua identidade, equipe e dados."}</p><div className="admin-entry-count"><strong>{organizations.length}</strong><span>{organizations.length === 1 ? "empresa cadastrada" : "empresas cadastradas"}</span></div><div className="admin-entry-space-actions"><Button className="admin-entry-create" onClick={onCreate}><Plus size={18} />Cadastrar empresa</Button><Button variant="outline" onClick={onCompanies}>Central de empresas</Button></div><ReferenceArt name="admin" className="admin-entry-diagram" /></aside>
    </div>
    <section className="admin-entry-companies" aria-labelledby="admin-entry-companies-title" aria-busy={refreshing}><header><div><h2 id="admin-entry-companies-title">Empresas <span>{organizations.length}</span></h2>{!organizations.length && <p>Nenhuma empresa cadastrada.</p>}</div><Button size="sm" variant="outline" onClick={refresh} disabled={refreshing}><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />{refreshing ? "Atualizando…" : "Atualizar"}</Button></header>{error && <p className="admin-entry-error" role="alert">{error}</p>}{organizations.length > 0 && <ul>{organizations.map(company => <li key={company.id}><span className="admin-entry-setting-icon"><Building2 size={21} /></span><div><h3>{company.name}</h3><p>Empresa autorizada · Configurações e acessos</p></div><Button variant="outline" size="sm" disabled={!!opening || refreshing} onClick={() => open(company.id)}>{opening === company.id ? "Abrindo…" : "Configurar"}</Button></li>)}</ul>}</section>
    <footer className="admin-entry-footer"><button type="button" onClick={onGuide}><BookOpenText size={17} />Consultar boas práticas</button><span><ShieldCheck size={17} />Administração master</span></footer>
  </div>;
}
