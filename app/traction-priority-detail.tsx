"use client";

import { ArrowRight, CalendarDays, CircleAlert, Clock3, Target } from "lucide-react";
import { latestProgress, priorityFor } from "@/lib/traction-flow";
import type { TractionRecord } from "@/lib/traction-model";

const dateLabel = (value?: string) => value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR") : "Sem prazo";
const numberLabel = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

function resultTrend(result: TractionRecord, records: TractionRecord[]) {
  if (result.data.measureType !== "Número") return "";
  const history = records.filter((item) => item.kind === "progress" && !item.archived_at && item.data.resultId === result.id)
    .sort((a, b) => `${b.data.observedAt} ${b.created_at}`.localeCompare(`${a.data.observedAt} ${a.created_at}`));
  if (!history.length) return "";
  const current = Number(history[0].data.value);
  const previous = Number(history[1]?.data.value ?? result.data.baseline);
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return "";
  const difference = current - previous;
  const reference = history.length > 1 ? "à medição anterior" : "ao valor inicial";
  return difference === 0 ? `Sem variação em relação ${reference}` : `${numberLabel.format(Math.abs(difference))} ${result.data.unit} ${difference > 0 ? "acima" : "abaixo"} em relação ${reference}`;
}

export function PriorityDetail({ priority, records, onOpen, closed }: { priority: TractionRecord; records: TractionRecord[]; onOpen: (record: TractionRecord) => void; closed: boolean }) {
  const related = records.filter((record) => !record.archived_at && record.id !== priority.id && priorityFor(record, records) === priority.id);
  const results = related.filter((record) => record.kind === "result");
  const initiatives = related.filter((record) => record.kind === "initiative");
  const risks = related.filter((record) => record.kind === "risk" && record.data.status !== "Resolvido");
  const decisions = related.filter((record) => record.kind === "decision" && record.data.status !== "Concluída");
  const updates = related.filter((record) => record.kind === "progress").sort((a, b) => `${b.data.observedAt} ${b.created_at}`.localeCompare(`${a.data.observedAt} ${a.created_at}`));
  const objective = records.find((record) => record.id === priority.data.objectiveId);

  return <div className="priority-detail">
    <div className="priority-detail-intro">
      <div><span className="section-label">OBJETIVO E ESCOPO</span><strong>{objective?.title || "Objetivo não encontrado"}</strong><p>{priority.data.outcome || "A mudança esperada ainda não foi descrita."}</p></div>
      <div className="priority-detail-facts"><span><b>Responsável</b>{priority.data.owner || "A definir"}</span><span><b>Prazo</b>{dateLabel(priority.data.due)}</span><span><b>{closed ? "Desfecho" : "Situação"}</b>{closed ? priority.data.closeOutcome || "Não classificada" : priority.data.status || "Planejada"}</span></div>
    </div>
    {(priority.data.rationale || priority.data.impact || priority.data.inScope || priority.data.outOfScope) && <div className="priority-detail-context">
      {priority.data.rationale && <p><b>Por que importa</b>{priority.data.rationale}</p>}
      {priority.data.impact && <p><b>Impacto esperado</b>{priority.data.impact}</p>}
      {priority.data.inScope && <p><b>Dentro do escopo</b>{priority.data.inScope}</p>}
      {priority.data.outOfScope && <p><b>Fora do escopo</b>{priority.data.outOfScope}</p>}
    </div>}
    {priority.data.status === "Atenção" && <div className="priority-detail-warning"><CircleAlert size={17} /><span><b>{priority.data.riskReason || "Motivo não registrado"}</b><small>Próxima ação: {priority.data.nextAction || "A definir"}</small></span></div>}

    <section className="priority-detail-section"><div className="priority-detail-heading"><Target size={17} /><h3>Resultados e indicadores</h3><small>{results.length}</small></div>
      {results.length ? results.map((result) => { const latest = latestProgress(records, result.id); const trend = resultTrend(result, records); return <button className="priority-detail-row" key={result.id} onClick={() => onOpen(result)}><span><strong>{result.title}</strong><small>{result.data.indicator} · {result.data.indicatorKind || "Classificação pendente"} · {result.data.source || "Fonte a definir"}</small><em>Inicial {result.data.baseline} {result.data.unit} · {latest ? `Atual ${latest.data.value} ${result.data.unit} em ${dateLabel(latest.data.observedAt)}` : "Sem medição atual"} · Alvo {result.data.target} {result.data.unit}</em>{trend && <em className="priority-detail-trend">Variação: {trend}</em>}</span><ArrowRight size={16} /></button>; }) : <p className="priority-detail-empty">Defina um resultado verificável para saber se esta prioridade avançou.</p>}
    </section>
    <section className="priority-detail-section"><div className="priority-detail-heading"><CalendarDays size={17} /><h3>Iniciativas e responsáveis</h3><small>{initiatives.length}</small></div>
      {initiatives.length ? initiatives.map((item) => <button className="priority-detail-row" key={item.id} onClick={() => onOpen(item)}><span><strong>{item.title}</strong><small>{item.data.owner || "Sem responsável"} · {item.data.status || "Planejada"} · {dateLabel(item.data.due)}</small>{item.data.nextAction && <em>Próxima ação: {item.data.nextAction}</em>}</span><ArrowRight size={16} /></button>) : <p className="priority-detail-empty">Associe um compromisso de alto nível e quem responde por ele.</p>}
    </section>
    <div className="priority-detail-columns"><section className="priority-detail-section"><div className="priority-detail-heading"><CircleAlert size={17} /><h3>Riscos e impedimentos</h3><small>{risks.length}</small></div>{risks.length ? risks.map((item) => <button className="priority-detail-row" key={item.id} onClick={() => onOpen(item)}><span><strong>{item.title}</strong><small>{item.data.owner || "Sem responsável"} · {dateLabel(item.data.due)}</small><em>{item.data.nextAction || item.data.impact}</em></span><ArrowRight size={16} /></button>) : <p className="priority-detail-empty">Nenhum impedimento aberto.</p>}</section>
      <section className="priority-detail-section"><div className="priority-detail-heading"><Clock3 size={17} /><h3>Decisões pendentes</h3><small>{decisions.length}</small></div>{decisions.length ? decisions.map((item) => <button className="priority-detail-row" key={item.id} onClick={() => onOpen(item)}><span><strong>{item.title}</strong><small>{item.data.decisionMaker || "Quem decide a definir"} · {dateLabel(item.data.due)}</small><em>{item.data.status || "Pendente"}</em></span><ArrowRight size={16} /></button>) : <p className="priority-detail-empty">Nenhuma decisão pendente.</p>}</section></div>
    <section className="priority-detail-section"><div className="priority-detail-heading"><Clock3 size={17} /><h3>Histórico de atualizações</h3><small>{updates.length}</small></div>{updates.length ? updates.map((item) => <button className="priority-detail-row" key={item.id} onClick={() => onOpen(item)}><span><strong>{dateLabel(item.data.observedAt)} · {item.data.author || "Equipe"}</strong><small>{item.data.note}</small><em>{item.data.status || "Em dia"}{item.data.value ? ` · ${item.data.value}` : ""}</em></span><ArrowRight size={16} /></button>) : <p className="priority-detail-empty">Nenhuma atualização registrada ainda.</p>}</section>
  </div>;
}
