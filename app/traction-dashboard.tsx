"use client";

import { ReferenceArt } from "./traction-reference-art";
import { ArrowUpRight, BarChart3, BookOpenText, BriefcaseBusiness, Building2, CalendarDays, GitBranch, Settings2, TrendingUp, UsersRound, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, UserRound } from "lucide-react";
import type { OrganizationSummary, Section, Workspace } from "./traction-types";

const modules: { section: Section; title: string; note: string; icon: LucideIcon; group: string }[] = [
  { section: "structure", title: "Áreas e cargos", note: "Defina responsabilidades e critérios.", icon: GitBranch, group: "Estrutura" },
  { section: "hiring", title: "Contratações", note: "Acompanhe vagas, entrevistas e decisões.", icon: BriefcaseBusiness, group: "Pessoas" },
  { section: "promotions", title: "Evolução interna", note: "Conecte avaliações a planos de desenvolvimento.", icon: UsersRound, group: "Pessoas" },
  { section: "planning", title: "Plano do ciclo", note: "Organize objetivos, prioridades e responsáveis.", icon: TrendingUp, group: "Execução" },
  { section: "reviews", title: "Reuniões e decisões", note: "Prepare a pauta e acompanhe compromissos.", icon: CalendarDays, group: "Execução" },
  { section: "results", title: "Resultados", note: "Consulte metas, medições e evidências.", icon: BarChart3, group: "Acompanhamento" },
];

const workflows = [
  { title: "Defina a direção", note: "Estrutura e prioridades", sections: ["structure", "planning"] },
  { title: "Desenvolva pessoas", note: "Entrada e desenvolvimento", sections: ["hiring", "promotions"] },
  { title: "Faça acontecer", note: "Decisões e resultados", sections: ["reviews", "results"] },
];

const moduleNotes: Partial<Record<Section, string>> = {
  structure: "Estrutura e responsabilidades.", planning: "Objetivos e prioridades.",
  hiring: "Vagas e seleção.", promotions: "Avaliações e desenvolvimento.",
  reviews: "Pautas e compromissos.", results: "Metas e evidências.",
};

export function DashboardShortcuts({ workspace, onNavigate }: { workspace: Workspace; onNavigate: (section: Section) => void }) {
  const peopleAccess = ["admin", "gestor"].includes(workspace.role);
  const choices = modules.filter(item => peopleAccess ? ["structure", "hiring", "promotions", "results"].includes(item.section) : ["structure", "planning", "reviews", "results"].includes(item.section));
  return <nav className="dashboard-shortcuts" aria-label="Atalhos do dashboard">{choices.map(item => <button key={item.section} onClick={() => onNavigate(item.section)}><item.icon size={20} /><span>{item.title}</span></button>)}</nav>;
}

export function PlatformDashboard({ displayName, organizations, onNavigate, onCreate, onCompanies }: {
  displayName: string; organizations: OrganizationSummary[]; onNavigate: (section: Section) => void;
  onCreate: () => void; onCompanies: () => void;
}) {
  const hasCompanies = organizations.length > 0;
  const steps = [
    { title: hasCompanies ? "Selecione sua empresa" : "Cadastre sua empresa", note: "Nome, identidade e acessos.", action: hasCompanies ? onCompanies : onCreate },
    { title: "Organize a estrutura", note: "Áreas, cargos e critérios.", action: () => onNavigate("structure") },
    { title: "Abra seu primeiro ciclo", note: "Prioridades e responsáveis.", action: () => onNavigate("planning") },
  ];
  return <div className="platform-dashboard platform-dashboard-reference" aria-label={`Dashboard de ${displayName}`}>
    <section className="reference-hero" aria-labelledby="reference-hero-title">
      <div className="reference-hero-copy"><span>SYNKY TRACTION / ADMIN MASTER</span><h2 id="reference-hero-title">Toda empresa começa<br />com direção<span>.</span></h2><p>Conecte pessoas, estrutura e execução.</p><div className="reference-hero-actions"><Button onClick={hasCompanies ? onCompanies : onCreate}>{hasCompanies ? "Gerenciar empresas" : "Cadastrar primeira empresa"}<ArrowRight size={17} /></Button><button onClick={() => onNavigate("guide")}>Conhecer o fluxo <ArrowRight size={16} /></button></div></div>
      <ReferenceArt name="dashboard" className="reference-hero-art" />
      <div className="reference-hero-count"><strong>{organizations.length}</strong><span>{organizations.length === 1 ? "empresa cadastrada" : "empresas cadastradas"}</span></div>
    </section>
    <div className="reference-workspace-grid">
      <section className="reference-modules" aria-labelledby="reference-modules-title"><header><h2 id="reference-modules-title">Da estrutura à execução</h2><p>Escolha por onde começar.</p></header><div className="reference-workflows">{workflows.map((flow, index) => <section className="reference-workflow" key={flow.title}><h3><span>0{index + 1}</span>{flow.title}</h3><div className="reference-module-pair">{flow.sections.map(section => modules.find(item => item.section === section)!).map(item => { const Icon = item.section === "promotions" ? UserRound : item.icon; return <button key={item.section} aria-label={`Abrir ${item.title}`} onClick={() => onNavigate(item.section)}><Icon size={27} strokeWidth={1.8} /><span><strong>{item.title}</strong><small>{moduleNotes[item.section]}</small></span><ArrowRight size={16} /></button>; })}</div></section>)}</div></section>
      <aside className="reference-onboarding" aria-labelledby="reference-onboarding-title"><header><h2 id="reference-onboarding-title">Primeiros passos</h2>{!hasCompanies && <span>0 de 3 etapas</span>}</header>{!hasCompanies ? <Progress value={0} aria-label="Configuração inicial: 0 de 3 etapas concluídas" /> : <p className="reference-onboarding-context">Escolha uma empresa para conferir sua estrutura e seu ciclo.</p>}<ol>{steps.map((step, index) => <li key={step.title}><button onClick={step.action}><span className={`reference-step ${index === 0 ? "current" : ""}`}>{index + 1}</span><span><strong>{step.title}</strong><small>{step.note}</small></span></button></li>)}</ol><button className="reference-guide-link" onClick={() => onNavigate("guide")}>Ver boas práticas <ArrowRight size={16} /></button></aside>
    </div>
    <button className="reference-company-strip" onClick={onCompanies}><span className="reference-company-icon"><Building2 size={25} /></span><span><strong>Central de empresas</strong><small>{hasCompanies ? `${organizations.length} ${organizations.length === 1 ? "empresa cadastrada" : "empresas cadastradas"}.` : "Nenhuma empresa cadastrada."}</small></span><span className="reference-company-link">Abrir central <ArrowRight size={16} /></span></button>
  </div>;
}

export function DashboardEmptyCycle({ workspace, canCreate, onCreate, onNavigate }: {
  workspace: Workspace; canCreate: boolean; onCreate: () => void; onNavigate: (section: Section) => void;
}) {
  const records = workspace.records.filter(record => !record.archived_at);
  const areas = records.filter(record => record.kind === "area").length;
  const roles = records.filter(record => record.kind === "role").length;
  const peopleAccess = ["admin", "gestor"].includes(workspace.role);
  const vacancies = records.filter(record => record.kind === "vacancy").length;
  return <div className="dashboard-no-cycle"><section className="dashboard-welcome"><div className="dashboard-welcome-copy"><span className="dashboard-access"><TrendingUp size={16} /> Próximo ciclo</span><h2>Organize o próximo período.</h2><p>A estrutura da empresa já tem um espaço. Defina o ciclo para acompanhar prioridades, prazos e resultados.</p><div className="dashboard-welcome-actions">{canCreate ? <Button onClick={onCreate}>Criar ciclo de trabalho</Button> : <Button onClick={() => onNavigate("planning")}>Consultar planejamento</Button>}<Button variant="ghost" onClick={() => onNavigate("guide")}>Como começar</Button></div></div><div className="dashboard-company-total"><CalendarDays size={25} /><strong className="dashboard-no-cycle-label">Sem ciclo</strong><span>Período ainda não definido</span><small>As medições aparecerão após o cadastro.</small></div></section><div className="dashboard-summary-grid"><button onClick={() => onNavigate("structure")}><GitBranch size={22} /><span>Áreas</span><strong>{areas}</strong></button><button onClick={() => onNavigate("structure")}><BriefcaseBusiness size={22} /><span>Cargos</span><strong>{roles}</strong></button>{peopleAccess && <button onClick={() => onNavigate("hiring")}><UsersRound size={22} /><span>Vagas cadastradas</span><strong>{vacancies}</strong></button>}{workspace.role === "admin" && <button onClick={() => onNavigate("admin")}><Settings2 size={22} /><span>Identidade e acessos</span><strong className="dashboard-summary-link">Configurar</strong></button>}</div><DashboardShortcuts workspace={workspace} onNavigate={onNavigate} /></div>;
}
