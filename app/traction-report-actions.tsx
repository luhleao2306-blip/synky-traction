"use client";

import { ArrowRight, BarChart3, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { latestProgress, priorityFor } from "@/lib/traction-flow";
import type { TractionRecord } from "@/lib/traction-model";
import type { SectionProps } from "./traction-types";

const active = (records: TractionRecord[], kind: TractionRecord["kind"]) => records.filter((item) => item.kind === kind && !item.archived_at);

export function TractionReportActions({ records, onNavigate, onCreate, canCreate, onOpen }: SectionProps) {
  const cycle = active(records, "cycle").find((item) => item.data.status === "Ativo") || active(records, "cycle").find((item) => item.data.status === "Planejado");
  const priorities = active(records, "priority").filter((item) => item.data.cycleId === cycle?.id);
  const objectives = active(records, "objective").filter((item) => item.data.cycleId === cycle?.id);
  const priorityIds = new Set(priorities.map((item) => item.id));
  const results = active(records, "result").filter((item) => priorities.some((priority) => priority.id === item.data.priorityId));
  const roles = active(records, "role");
  const risks = active(records, "risk").filter((item) => item.data.status !== "Resolvido" && priorityIds.has(priorityFor(item, records)));
  const decisions = active(records, "decision").filter((item) => item.data.status !== "Concluída" && priorityIds.has(priorityFor(item, records)));
  const items: { title: string; detail: string; label: string; run: () => void }[] = [];
  if (!cycle) items.push({ title: "Iniciar um ciclo", detail: "Defina o período e o foco para que os indicadores tenham contexto.", label: "Abrir planejamento", run: () => onNavigate("planning") });
  else if (!objectives.length) items.push({ title: "Definir o objetivo do ciclo", detail: "Registre a direção antes de distribuir prioridades.", label: canCreate("objective") ? "Criar objetivo" : "Abrir planejamento", run: () => canCreate("objective") ? onCreate("objective", undefined, { cycleId: cycle.id }) : onNavigate("planning") });
  else if (!priorities.length) items.push({ title: "Escolher a primeira prioridade", detail: "Transforme o objetivo em uma entrega acompanhável.", label: canCreate("priority") ? "Criar prioridade" : "Abrir planejamento", run: () => canCreate("priority") ? onCreate("priority", undefined, { cycleId: cycle.id }) : onNavigate("planning") });
  if (!roles.length) items.push({ title: "Descrever os cargos", detail: "Cargos e critérios sustentam contratações e promoções consistentes.", label: "Abrir estrutura", run: () => onNavigate("structure") });
  const missingResult = priorities.find((item) => !results.some((result) => result.data.priorityId === item.id));
  if (missingResult) items.push({ title: `Medir: ${missingResult.title}`, detail: "Esta prioridade ainda não tem indicador, alvo e fonte vinculados.", label: canCreate("result") ? "Definir resultado" : "Abrir prioridade", run: () => canCreate("result") ? onCreate("result", undefined, { priorityId: missingResult.id }) : onOpen(missingResult) });
  const missingUpdate = results.find((item) => !latestProgress(records, item.id));
  if (missingUpdate) items.push({ title: `Atualizar: ${missingUpdate.title}`, detail: "O resultado foi definido, mas ainda não há valor observado registrado.", label: canCreate("progress") ? "Registrar avanço" : "Abrir resultado", run: () => canCreate("progress") ? onCreate("progress", undefined, { resultId: missingUpdate.id, priorityId: missingUpdate.data.priorityId }) : onOpen(missingUpdate) });
  if (risks[0]) items.push({ title: `Tratar risco: ${risks[0].title}`, detail: "Risco sem resolução registrada no espaço da empresa.", label: "Abrir risco", run: () => onOpen(risks[0]) });
  if (decisions[0]) items.push({ title: `Acompanhar decisão: ${decisions[0].title}`, detail: "A conclusão e o efeito desta decisão ainda estão pendentes.", label: "Abrir decisão", run: () => onOpen(decisions[0]) });
  return <section className="report-action-board"><div className="report-action-heading"><div><span className="section-label">DA ANÁLISE À AÇÃO</span><h3>O que merece atenção agora</h3><p>Sugestões calculadas a partir dos registros visíveis para sua função.</p></div></div>{items.length ? <div className="report-action-grid">{items.slice(0, 4).map((item) => <button className="report-action-card" key={item.title} onClick={item.run}><span><BarChart3 size={18} /></span><strong>{item.title}</strong><p>{item.detail}</p><small>{item.label} <ArrowRight size={14} /></small></button>)}</div> : <div className="report-current-note"><CheckCircle2 size={19} /><span>Não há lacunas destacadas nesta leitura. Consulte os detalhes e continue registrando avanços e decisões.</span></div>}<div className="report-related-links"><Button variant="outline" onClick={() => onNavigate("planning")}>Ver planejamento <ArrowRight size={15} /></Button><Button variant="outline" onClick={() => onNavigate("reviews")}>Ver revisões <ArrowRight size={15} /></Button></div></section>;
}
