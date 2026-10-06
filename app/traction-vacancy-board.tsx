"use client";

import { useRef, useState, type PointerEvent } from "react";
import { GripVertical, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import type { TractionRecord } from "@/lib/traction-model";
import { canWriteRecord } from "@/lib/traction-permissions";
import type { SectionProps } from "./traction-types";
import "./traction-vacancy-board.css";

export const vacancyStages = ["Planejada", "Aberta", "Entrevistas", "Decisão", "Fechada"] as const;
type VacancyStage = typeof vacancyStages[number];
type Drag = { id: string; x: number; y: number; target: VacancyStage | null };
type Gesture = { id: string; pointerId: number; x: number; y: number; started: boolean };
const stageOf = (record: TractionRecord) => record.data.status || "Planejada";
const isStage = (value: string | undefined | null): value is VacancyStage => vacancyStages.some(stage => stage === value);

export function VacancyBoard({ vacancies, stage, query, nextStep, records, workspace, onOpen, onPost, onReload }: Pick<SectionProps,"records" | "workspace" | "onOpen" | "onPost" | "onReload"> & {
  vacancies: TractionRecord[]; stage: string; query: string; nextStep: (record: TractionRecord) => string;
}) {
  const [overrides, setOverrides] = useState<Record<string, TractionRecord>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const saving = useRef<string | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const byId = new Map(records.map(record => [record.id, record]));
  const canMove = (record: TractionRecord) => !!workspace && !record.archived_at && canWriteRecord({ role: workspace.role, email: workspace.currentUser.email, area_id: workspace.areaId }, record, byId);
  const nameOf = (id?: string) => byId.get(id || "")?.title || "Não vinculado";
  // Keep the saved response until the refreshed workspace reaches the same version.
  const displayed = vacancies.map(record => overrides[record.id]?.version > record.version ? overrides[record.id] : record).filter(record => (stage === "all" || stageOf(record) === stage) && `${record.title} ${record.data.reason || ""} ${nameOf(record.data.roleId)}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")));

  async function move(record: TractionRecord, target: VacancyStage) {
    if (saving.current || !canMove(record) || stageOf(record) === target) return;
    saving.current = record.id;
    setSavingId(record.id);
    setAnnouncement(`Movendo ${record.title} para ${target}.`);
    const next = { ...record, data: { ...record.data, status: target }, version: record.version + 1 };
    setOverrides(current => ({ ...current, [record.id]: next }));
    try {
      const result = await onPost({ action: "updateRecord", organizationId: workspace!.organization.id, id: record.id, version: record.version, kind: "vacancy", title: record.title, data: next.data }) as { version?: number };
      setOverrides(current => ({ ...current, [record.id]: { ...next, version: result.version || next.version } }));
      setAnnouncement(`${record.title} movida para ${target}.`);
      toast.success(`Vaga movida para ${target}.`);
      try { await onReload(); } catch { toast.warning("A etapa foi salva. Recarregue o painel para atualizar os demais registros."); }
    } catch (error) {
      setOverrides(current => ({ ...current, [record.id]: record }));
      const message = error instanceof Error ? error.message : "Não foi possível mover a vaga. Tente novamente.";
      setAnnouncement(`Não foi possível mover ${record.title}. ${message}`);
      toast.error(message);
      // A concurrent edit or a changed permission may require fresh server data.
      try { await onReload(); } catch { /* Original record remains visible; the failure is announced. */ }
    } finally { saving.current = null; setSavingId(null); }
  }

  function start(event: PointerEvent<HTMLButtonElement>, record: TractionRecord) {
    if (event.button !== 0 || !event.isPrimary || saving.current || !canMove(record)) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { id: record.id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, started: false };
  }
  function locateTarget(x: number, y: number) {
    const value = document.elementFromPoint(x,y)?.closest<HTMLElement>("[data-vacancy-stage]")?.dataset.vacancyStage;
    return isStage(value) ? value : null;
  }
  function pointerMove(event: PointerEvent<HTMLButtonElement>) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (!current.started && Math.hypot(event.clientX-current.x,event.clientY-current.y) < 6) return;
    current.started = true;
    const bounds = board.current?.getBoundingClientRect();
    if (bounds && board.current && board.current.scrollWidth > board.current.clientWidth) {
      if (event.clientX > bounds.right - 40) board.current.scrollLeft += 18;
      if (event.clientX < bounds.left + 40) board.current.scrollLeft -= 18;
    }
    if (event.clientY > window.innerHeight - 56) window.scrollBy(0,18);
    if (event.clientY < 72) window.scrollBy(0,-18);
    setDrag({ id: current.id, x: event.clientX, y: event.clientY, target: locateTarget(event.clientX,event.clientY) });
  }
  function finish(event: PointerEvent<HTMLButtonElement>) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const target = current.started ? locateTarget(event.clientX,event.clientY) : null;
    const record = displayed.find(item => item.id === current.id);
    gesture.current = null;
    setDrag(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (target && record) void move(record,target);
  }
  function cancel() { gesture.current = null; setDrag(null); }
  const dragged = displayed.find(record => record.id === drag?.id);
  const movable = displayed.some(canMove);

  return <div className="vacancy-board">
    {movable && <p className="vacancy-board-hint"><GripVertical size={16} aria-hidden="true" />Arraste pela alça para mudar a etapa ou use “Mover para”.</p>}
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
    <div className="pipeline" ref={board}>
      {vacancyStages.filter(item => stage === "all" || item === stage).map(item => {
        const cards = displayed.filter(record => stageOf(record) === item);
        return <section key={item} className={`pipeline-stage vacancy-drop-zone ${drag?.target === item ? "vacancy-drop-active" : ""}`} data-vacancy-stage={item} aria-label={`Etapa ${item}`}>
          <div className="pipeline-stage-head"><span>{item}</span><strong>{cards.length}</strong></div>
          {cards.map(record => <article key={record.id} className={`pipeline-card vacancy-card ${drag?.id === record.id ? "vacancy-card-dragging" : ""}`} aria-busy={savingId === record.id}>
            <div className="vacancy-card-heading"><button className="vacancy-title" disabled={savingId === record.id} onClick={() => onOpen(record)} aria-label={`Abrir vaga ${record.title}`}><strong>{record.title}</strong></button>{canMove(record) && <button className="vacancy-drag-handle" aria-label={`Arrastar vaga ${record.title}`} title="Arrastar para outra etapa" disabled={!!savingId} onPointerDown={event => start(event,record)} onPointerMove={pointerMove} onPointerUp={finish} onPointerCancel={cancel} onLostPointerCapture={cancel} onKeyDown={event => { if (event.key === "Escape") cancel(); }}><GripVertical size={18} aria-hidden="true" /></button>}</div>
            <button className="vacancy-card-detail" disabled={savingId === record.id} onClick={() => onOpen(record)} aria-label={`Ver detalhes de ${record.title}`}><small>{nameOf(record.data.roleId)}</small><span>{record.data.reason || "Justificativa pendente"}</span><em>Próximo passo: {nextStep(record)}</em></button>
            {canMove(record) && <label className="vacancy-stage-control"><span>{savingId === record.id ? <><LoaderCircle size={13} className="animate-spin" aria-hidden="true" />Salvando…</> : "Mover para"}</span><select aria-label={`Mover vaga ${record.title} para outra etapa`} value={stageOf(record)} disabled={!!savingId} onChange={event => { if (isStage(event.target.value)) void move(record,event.target.value); }}>{vacancyStages.map(target => <option key={target} value={target}>{target}</option>)}</select></label>}
          </article>)}
          {!cards.length && <div className="vacancy-stage-empty">{drag ? "Solte a vaga aqui" : "Nenhuma vaga nesta etapa"}</div>}
        </section>;
      })}
    </div>
    {drag && dragged && <div className="vacancy-drag-preview" style={{ left: `clamp(8px,${drag.x+12}px,calc(100vw - 232px))`, top: `clamp(8px,${drag.y+12}px,calc(100vh - 120px))` }} aria-hidden="true"><GripVertical size={17} /><strong>{dragged.title}</strong><span>{drag.target ? `Mover para ${drag.target}` : "Escolha uma etapa"}</span></div>}
  </div>;
}
