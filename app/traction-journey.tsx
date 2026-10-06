"use client";

import { useState } from "react";
import { ArrowRight, Check, CircleDot, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { priorityFor } from "@/lib/traction-flow";
import type { TractionRecord } from "@/lib/traction-model";
import type { SectionProps } from "./traction-types";

const active = (records: TractionRecord[], kind: TractionRecord["kind"]) => records.filter((item) => item.kind === kind && !item.archived_at);

export function TractionJourney(props: SectionProps) {
  const { records, onCreate, onNavigate, canCreate } = props;
  const [chosen, setChosen] = useState("");
  const cycle = active(records, "cycle").find((item) => item.data.status === "Ativo") || active(records, "cycle").find((item) => item.data.status === "Planejado");
  const objectives = active(records, "objective").filter((item) => item.data.cycleId === cycle?.id);
  const priorities = active(records, "priority").filter((item) => item.data.cycleId === cycle?.id);
  const results = active(records, "result").filter((item) => priorities.some((priority) => priority.id === item.data.priorityId));
  const progress = active(records, "progress").filter((item) => priorities.some((priority) => priority.id === priorityFor(item, records)));
  const reviews = active(records, "review").filter((item) => item.data.cycleId === cycle?.id);
  const missingResult = priorities.find((item) => !results.some((result) => result.data.priorityId === item.id));
  const firstResult = results[0];
  const today = new Date().toISOString().slice(0, 10);
  const steps = [
    { id: "cycle", label: "Ciclo", done: !!cycle, title: "Escolha um período de trabalho", detail: "O ciclo reúne objetivos, prioridades e revisões no mesmo trimestre. Assim, todos acompanham o mesmo plano.", output: "Um período e um ritmo de revisão definidos.", action: !cycle && canCreate("cycle") ? "Criar ciclo" : "Abrir planejamento", run: () => !cycle && canCreate("cycle") ? onCreate("cycle") : onNavigate("planning") },
    { id: "objective", label: "Objetivo", done: objectives.length > 0, title: "Diga onde a empresa quer chegar", detail: "Registre a direção do ciclo e por que ela importa. Cada prioridade será ligada a um objetivo.", output: "Uma direção comum para a equipe.", action: cycle && !objectives.length && canCreate("objective") ? "Definir objetivo" : "Ver objetivos", run: () => cycle && !objectives.length && canCreate("objective") ? onCreate("objective", undefined, { cycleId: cycle.id }) : onNavigate("planning") },
    { id: "priority", label: "Prioridades", done: priorities.length > 0, title: "Escolha o que merece foco", detail: "Selecione poucas entregas, defina responsável e deixe claro o que entra e sai do escopo.", output: "Prioridades com dono e contexto.", action: cycle && objectives.length > 0 && !priorities.length && canCreate("priority") ? "Criar prioridade" : "Ver prioridades", run: () => cycle && objectives.length > 0 && !priorities.length && canCreate("priority") ? onCreate("priority", undefined, { cycleId: cycle.id, objectiveId: objectives[0].id }) : onNavigate("planning") },
    { id: "result", label: "Como medir", done: priorities.length > 0 && !missingResult, title: "Defina como reconhecer o avanço", detail: "Para cada prioridade, registre o resultado esperado, indicador, valor inicial, alvo, fonte e responsável.", output: "Uma medida verificável, além da lista de atividades.", action: missingResult && canCreate("result") ? "Definir resultado" : "Ver indicadores", run: () => missingResult && canCreate("result") ? onCreate("result", undefined, { priorityId: missingResult.id }) : onNavigate("planning") },
    { id: "progress", label: "Avanços", done: progress.length > 0, title: "Mostre o que mudou desde a última vez", detail: "Registre o valor observado e uma nota curta sobre o que ajudou ou bloqueou o trabalho.", output: "Histórico de avanço com data e autor.", action: firstResult && canCreate("progress") ? "Registrar avanço" : "Ver execução", run: () => firstResult && canCreate("progress") ? onCreate("progress", undefined, { resultId: firstResult.id, priorityId: firstResult.data.priorityId }) : onNavigate("planning") },
    { id: "review", label: "Revisão", done: reviews.length > 0, title: "Use a reunião para destravar decisões", detail: "A pauta reúne riscos, atrasos e pontos sem atualização. Registre quem decide, o prazo e o efeito esperado.", output: "Decisões acompanháveis até a próxima reunião.", action: cycle && canCreate("review") ? "Preparar revisão" : "Ver revisões", run: () => cycle && canCreate("review") ? onCreate("review", undefined, { cycleId: cycle.id, cadence: cycle.data.cadence || "Semanal", meetingDate: cycle.data.startDate > today ? cycle.data.startDate : today }) : onNavigate("reviews") },
  ];
  const next = steps.find((item) => !item.done);
  const current = steps.find((item) => item.id === chosen) || next || steps[steps.length - 1];
  const complete = steps.filter((item) => item.done).length;
  return <section className="traction-journey" aria-label="Percurso do ciclo"><div className="traction-journey-heading"><div><span className="section-label">DO PLANO À DECISÃO</span><h2>{cycle ? `O caminho de ${cycle.title}` : "Seu primeiro ciclo começa aqui"}</h2><p>Abra uma etapa para ver o que registrar e por que isso ajuda a equipe.</p></div><span className="traction-journey-count">{complete} de {steps.length} etapas com registro</span></div><div className="traction-journey-steps" role="group" aria-label="Etapas do ciclo">{steps.map((step, index) => <button key={step.id} type="button" className={`${current.id === step.id ? "selected" : ""} ${step.done ? "done" : ""}`} aria-pressed={current.id === step.id} onClick={() => setChosen(step.id)}><span className="traction-journey-number">{step.done ? <Check size={16} /> : String(index + 1).padStart(2, "0")}</span><strong>{step.label}</strong><small>{step.done ? "Registrado" : current.id === step.id ? "Em foco" : "A fazer"}</small></button>)}</div><div className="traction-journey-detail"><div className="traction-journey-detail-icon">{current.done ? <Check size={20} /> : <CircleDot size={20} />}</div><div><span>{current.done ? "ETAPA REGISTRADA" : "PRÓXIMO REGISTRO"}</span><h3>{current.title}</h3><p>{current.detail}</p><small><Route size={15} /> {current.output}</small></div><Button className="action-primary" onClick={current.run}>{current.action} <ArrowRight size={16} /></Button></div></section>;
}
