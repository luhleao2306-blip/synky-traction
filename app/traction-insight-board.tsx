"use client";

import { useState } from "react";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, ChevronDown, GitBranch, Sparkles, Target } from "lucide-react";
import { decisionsForCycle, latestPriorityProgress, priorityFor } from "@/lib/traction-flow";
import type { TractionRecord } from "@/lib/traction-model";
import type { Section, SectionProps } from "./traction-types";

type Lens = "execution" | "structure" | "hiring" | "people";
type Insight = { id: string; title: string; detail: string; action: string; open: () => void };

const live = (records: TractionRecord[], kind: TractionRecord["kind"]) => records.filter((item) => item.kind === kind && !item.archived_at);
const today = () => new Date().toISOString().slice(0, 10);
const overdue = (due?: string) => !!due && due < today();

export function TractionInsightBoard({ records, workspace, onOpen, onCreate, canCreate, onNavigate, mode = "overview" }: SectionProps & { mode?: Section }) {
  const [selected, setSelected] = useState<Lens>(mode === "structure" ? "structure" : mode === "hiring" ? "hiring" : mode === "promotions" ? "people" : "execution");
  const cycle = live(records, "cycle").find((item) => item.data.status === "Ativo") || live(records, "cycle").find((item) => item.data.status === "Planejado");
  const priorities = live(records, "priority").filter((item) => item.data.cycleId === cycle?.id);
  const priorityIds = new Set(priorities.map((item) => item.id));
  const results = live(records, "result");
  const vacancies = live(records, "vacancy");
  const candidates = live(records, "person").filter((item) => item.data.type === "Candidato");
  const employees = live(records, "person").filter((item) => item.data.type === "Colaborador");
  const assessments = live(records, "assessment");
  const canSeePeople = !workspace || ["admin", "gestor"].includes(workspace.role);
  const insights: Record<Lens, Insight[]> = { execution: [], structure: [], hiring: [], people: [] };
  const add = (lens: Lens, id: string, title: string, detail: string, action: string, open: () => void) => insights[lens].push({ id, title, detail, action, open });

  if (!cycle && canCreate("cycle")) add("execution", "cycle-start", "Abra o próximo ciclo", "Defina o período e o norte estratégico antes de distribuir prioridades.", "Criar ciclo", () => onCreate("cycle"));
  if (cycle) {
    const objectives = live(records, "objective").filter((item) => item.data.cycleId === cycle.id);
    if (!objectives.length && canCreate("objective")) add("execution", "objective-start", "Defina o objetivo do ciclo", "Sem objetivo, as prioridades ficam sem uma direção comum.", "Criar objetivo", () => onCreate("objective", undefined, { cycleId: cycle.id }));
    else if (!priorities.length && canCreate("priority")) add("execution", "priority-start", "Escolha a primeira prioridade", "Transforme o objetivo em uma entrega com responsável e prazo.", "Criar prioridade", () => onCreate("priority", undefined, { cycleId: cycle.id }));
    for (const item of decisionsForCycle(records, cycle.id)) if (item.data.status !== "Concluída" && overdue(item.data.due)) add("execution", `decision-${item.id}`, item.title, `Decisão vencida; responsável: ${item.data.decisionMaker || "a definir"}.`, "Abrir decisão", () => onOpen(item));
    for (const item of live(records, "risk")) if (item.data.status !== "Resolvido" && priorityIds.has(priorityFor(item, records))) add("execution", `risk-${item.id}`, item.title, item.data.impact || "Risco ainda em tratamento.", "Tratar risco", () => onOpen(item));
    for (const item of priorities) {
      if (!results.some((result) => result.data.priorityId === item.id)) add("execution", `result-${item.id}`, item.title, "Ainda não há um resultado verificável para esta prioridade.", "Definir resultado", () => canCreate("result") ? onCreate("result", undefined, { priorityId: item.id }) : onOpen(item));
      else if (cycle.data.status === "Ativo" && !latestPriorityProgress(records, item.id)) add("execution", `progress-${item.id}`, item.title, "Há um alvo definido, mas nenhum avanço foi registrado.", "Registrar avanço", () => canCreate("progress") ? onCreate("progress", undefined, { priorityId: item.id }) : onOpen(item));
      else if (cycle.data.status === "Ativo") {
        const latest = latestPriorityProgress(records, item.id);
        if (latest?.data.observedAt && (Date.parse(today()) - Date.parse(latest.data.observedAt)) / 86400000 >= 7 && item.data.status !== "Concluída") add("execution", `stale-${item.id}`, item.title, `Última atualização em ${new Date(`${latest.data.observedAt}T12:00:00`).toLocaleDateString("pt-BR")}.`, "Atualizar", () => canCreate("progress") ? onCreate("progress", undefined, { priorityId: item.id }) : onOpen(item));
      }
    }
  }

  {
    if (!live(records, "area").length && canCreate("area")) add("structure", "area-start", "Desenhe a primeira área", "Defina o papel da equipe antes de distribuir cargos e responsabilidades.", "Criar área", () => onCreate("area"));
    else if (!live(records, "role").length && canCreate("role")) add("structure", "structure-role-start", "Descreva o primeiro cargo", "A missão e os critérios tornam vagas e promoções mais consistentes.", "Criar cargo", () => onCreate("role"));
    for (const item of live(records, "area")) if (!item.data.mission || !item.data.lead) add("structure", `area-${item.id}`, item.title, !item.data.mission ? "Descreva a entrega esperada desta área." : "Defina quem responde pela área.", "Completar área", () => onOpen(item));
    for (const item of live(records, "role")) if (!item.data.mission || !item.data.competencies || !item.data.criteria) add("structure", `role-${item.id}`, item.title, !item.data.mission ? "Descreva por que o cargo existe." : !item.data.competencies ? "Registre as competências ligadas ao trabalho." : "Defina critérios de evolução para este nível.", "Completar cargo", () => onOpen(item));
  }
  if (canSeePeople) {
    if (!live(records, "role").length && canCreate("role")) add("hiring", "role-start", "Descreva os cargos antes de abrir vagas", "A missão e os critérios do cargo orientam entrevistas consistentes.", "Ir para estrutura", () => onNavigate("structure"));
    for (const item of vacancies) {
      if (item.data.status === "Fechada") continue;
      if (!item.data.interviewRubric || !item.data.interviewQuestions) add("hiring", `vacancy-${item.id}`, item.title, "Faltam perguntas equivalentes ou critérios claros para comparar candidaturas.", "Preparar entrevista", () => onOpen(item));
    }
    for (const item of candidates) {
      if (item.data.vacancyId && vacancies.some((vacancy) => vacancy.id === item.data.vacancyId && vacancy.data.status !== "Fechada") && !assessments.some((assessment) => assessment.data.personId === item.id && assessment.data.type === "Contratação")) add("hiring", `candidate-${item.id}`, item.title, "Candidatura vinculada a uma vaga, ainda sem avaliação registrada.", "Registrar avaliação", () => canCreate("assessment") ? onCreate("assessment", "Candidato", { personId: item.id, vacancyId: item.data.vacancyId }) : onOpen(item));
    }
    for (const item of assessments) if (item.data.type === "Contratação" && (!item.data.criteriaEvidence || item.data.decision === "Em análise")) add("hiring", `assessment-${item.id}`, item.title, !item.data.criteriaEvidence ? "Relacione as evidências aos critérios do cargo." : "A avaliação aguarda uma decisão da equipe.", "Abrir avaliação", () => onOpen(item));

    for (const item of employees) if (!item.data.currentRoleId) add("people", `employee-${item.id}`, item.title, "Defina o cargo atual para dar contexto à evolução profissional.", "Completar cadastro", () => onOpen(item));
    if (!employees.length && canCreate("person")) add("people", "people-start", "Cadastre a primeira pessoa da equipe", "O cargo atual é o ponto de partida para uma análise de promoção.", "Adicionar colaborador", () => onCreate("person", "Colaborador"));
    for (const item of assessments) if (item.data.type === "Promoção" && (item.data.decision === "Em análise" || !item.data.decision)) add("people", `promotion-${item.id}`, item.title, "Compare evidências, lacunas e critérios do cargo alvo antes de decidir.", "Abrir análise", () => onOpen(item));
    for (const item of live(records, "development")) if (item.data.status !== "Concluído" && overdue(item.data.due)) add("people", `development-${item.id}`, item.title, "O prazo do plano de desenvolvimento passou sem conclusão registrada.", "Revisar plano", () => onOpen(item));
  }

  const lenses: { id: Lens; label: string; icon: React.ReactNode }[] = [
    { id: "execution", label: "Execução", icon: <Target size={16} /> },
    { id: "structure", label: "Estrutura", icon: <GitBranch size={16} /> },
    { id: "hiring", label: "Contratações", icon: <BriefcaseBusiness size={16} /> },
    { id: "people", label: "Talentos", icon: <Sparkles size={16} /> },
  ];
  const visibleLenses = mode === "overview" ? lenses.filter((lens) => ["execution", "structure"].includes(lens.id) || canSeePeople) : lenses.filter((lens) => lens.id === selected);
  const lens = visibleLenses.some((item) => item.id === selected) ? selected : visibleLenses[0]?.id || "execution";
  const current = insights[lens];
  const targetSection: Section = lens === "execution" ? "planning" : lens === "people" ? "promotions" : lens;
  const heading = mode === "overview" ? "Pendências nos registros" : mode === "structure" ? "Pendências de áreas e cargos" : mode === "hiring" ? "Pendências de contratação" : "Pendências de evolução interna";

  const content = <section className="insight-board" aria-label="Ações sugeridas a partir dos registros">
    <div className="insight-board-head"><div><span className="section-label">LEITURA DOS REGISTROS</span><h2>{heading}</h2><p>Uma fila calculada com as informações cadastradas. Abra cada item para agir.</p></div><span className="insight-board-total">{current.length} {current.length === 1 ? "item" : "itens"}</span></div>
    {mode === "overview" && <div className="insight-board-tabs" role="group" aria-label="Área de atenção">{visibleLenses.map((item) => <button type="button" aria-pressed={lens === item.id} className={lens === item.id ? "active" : ""} key={item.id} onClick={() => setSelected(item.id)}>{item.icon}<span>{item.label}</span><b>{insights[item.id].length}</b></button>)}</div>}
    {current.length ? <div className="insight-board-list">{current.slice(0, mode === "overview" ? 5 : 4).map((item, index) => <button type="button" className="insight-board-item" key={item.id} onClick={item.open}><span className="insight-board-number">{String(index + 1).padStart(2, "0")}</span><span className="insight-board-copy"><strong>{item.title}</strong><small>{item.detail}</small></span><span className="insight-board-action">{item.action}<ArrowRight size={15} /></span></button>)}{current.length > (mode === "overview" ? 5 : 4) && <button type="button" className="insight-board-more" onClick={() => onNavigate(targetSection)}>Mais {current.length - (mode === "overview" ? 5 : 4)} {current.length - (mode === "overview" ? 5 : 4) === 1 ? "item" : "itens"}. Abrir {lenses.find((item) => item.id === lens)?.label.toLowerCase()} <ArrowRight size={14} /></button>}</div> : <div className="insight-board-clear"><CheckCircle2 size={21} /><span><strong>Nenhum ponto pendente nesta leitura</strong><small>{lens === "execution" ? "O painel acompanha resultados, atualizações, riscos e decisões do ciclo." : lens === "structure" ? "As áreas e os cargos cadastrados têm os campos essenciais desta verificação." : lens === "hiring" ? "As vagas, candidaturas e avaliações cadastradas não têm lacunas nesta verificação." : "Os cadastros, análises e planos cadastrados não têm lacunas nesta verificação."}</small></span></div>}
    {mode === "overview" && <div className="insight-board-foot"><GitBranch size={15} /> Esta leitura considera somente registros visíveis para seu acesso; ela não substitui a análise da equipe.</div>}
  </section>;
  return mode === "overview" ? content : <details className="insight-disclosure"><summary><Target size={18} /><strong>{heading}</strong><span>{current.length} {current.length === 1 ? "item" : "itens"}</span><ChevronDown size={18} /></summary>{content}</details>;
}
