import type { TractionRecord } from "./traction-model";
import { recordCycle } from "./traction-permissions";

export type AgendaItem = { id: string; kind: TractionRecord["kind"]; title: string; reason: string; priorityId?: string };

export function decisionsForCycle(records: TractionRecord[], cycleId?: string) {
  if (!cycleId) return [];
  const visible = records.filter((record) => !record.archived_at);
  const byId = new Map(visible.map((record) => [record.id, record]));
  return visible.filter((record) => record.kind === "decision" && recordCycle(record, byId) === cycleId);
}

export function priorityFor(record: TractionRecord, records: TractionRecord[]): string {
  if (record.kind === "priority") return record.id;
  if (record.data.priorityId) return record.data.priorityId;
  const parent = records.find((item) => item.id === (record.data.resultId || record.data.initiativeId || record.data.riskId));
  return parent ? priorityFor(parent, records) : "";
}

export function latestProgress(records: TractionRecord[], targetId: string) {
  return records.filter((item) => item.kind === "progress" && !item.archived_at && [item.data.priorityId, item.data.resultId, item.data.initiativeId].includes(targetId))
    .sort((a, b) => `${b.data.observedAt || ""} ${b.created_at}`.localeCompare(`${a.data.observedAt || ""} ${a.created_at}`))[0];
}

export function latestPriorityProgress(records: TractionRecord[], priorityId: string) {
  return records.filter((item) => item.kind === "progress" && !item.archived_at && priorityFor(item, records) === priorityId)
    .sort((a, b) => `${b.data.observedAt || ""} ${b.created_at}`.localeCompare(`${a.data.observedAt || ""} ${a.created_at}`))[0];
}

export function savedReviewAgenda(review: TractionRecord): AgendaItem[] | null {
  if (!review.data.agenda) return null;
  try {
    const parsed: unknown = JSON.parse(review.data.agenda);
    return Array.isArray(parsed) ? parsed.filter((item): item is AgendaItem => !!item && typeof item === "object" && typeof item.id === "string" && typeof item.title === "string" && typeof item.reason === "string") : null;
  } catch { return null; }
}

export function reviewAgenda(records: TractionRecord[], cycleId: string, today = new Date().toISOString().slice(0, 10)): AgendaItem[] {
  const active = records.filter((item) => !item.archived_at);
  const priorities = active.filter((item) => item.kind === "priority" && item.data.cycleId === cycleId);
  const ids = new Set(priorities.map((item) => item.id));
  const decisionIds = new Set(decisionsForCycle(active, cycleId).map((item) => item.id));
  const items: AgendaItem[] = [];
  const add = (record: TractionRecord, reason: string, priorityId = priorityFor(record, active)) => items.push({ id: record.id, kind: record.kind, title: record.title, reason, priorityId });
  for (const priority of priorities) {
    if (priority.data.status === "Concluída") continue;
    if (priority.data.status === "Atenção") add(priority, `Em risco: ${priority.data.riskReason || "motivo não informado"}`);
    if (priority.data.due && priority.data.due < today) add(priority, "Prazo vencido");
    if (!priority.data.owner) add(priority, "Sem responsável");
    if (!active.some((item) => item.kind === "result" && item.data.priorityId === priority.id) && !priority.data.indicator) add(priority, "Sem resultado definido");
    const progress = latestPriorityProgress(active, priority.id);
    const last = progress?.data.observedAt || priority.created_at.slice(0, 10);
    if (last && Math.floor((Date.parse(today) - Date.parse(last)) / 86400000) >= 7) add(priority, "Sem atualização há 7 dias ou mais");
  }
  for (const item of active) {
    const priorityId = priorityFor(item, active);
    if (item.kind === "decision") {
      if (item.data.status !== "Concluída" && decisionIds.has(item.id)) add(item, `Decisão pendente${item.data.due && item.data.due < today ? " e atrasada" : ""}`, priorityId);
      continue;
    }
    if (!ids.has(priorityId)) continue;
    if (item.kind === "initiative" && item.data.status !== "Concluída") {
      if (!item.data.owner) add(item, "Iniciativa sem responsável", priorityId);
      if (item.data.due && item.data.due < today) add(item, "Iniciativa atrasada", priorityId);
      if (item.data.status === "Atenção") add(item, `Iniciativa em risco: ${item.data.riskReason || "motivo não informado"}`, priorityId);
    }
    if (item.kind === "risk" && item.data.status !== "Resolvido") add(item, `Impedimento: ${item.data.impact || "impacto não definido"}`, priorityId);
    if (item.kind === "progress" && item.data.status === "Bloqueado") {
      const targetId = item.data.resultId || item.data.initiativeId || item.data.priorityId;
      if (latestProgress(active, targetId)?.id === item.id) add(item, "Atualização bloqueada", priorityId);
    }
  }
  return items;
}
