"use client";

import { latestProgress } from "@/lib/traction-flow";
import type { SectionProps } from "./traction-types";

const value = (entry?: string) => entry !== undefined && entry !== "" ? entry : "Não informado";
const date = (entry?: string) => entry ? new Date(`${entry.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR") : "não definido";

export function ResultEvidence({ records, onOpen, plan }: Pick<SectionProps, "records" | "onOpen"> & { plan: "gratuito" | "completo" }) {
  const results = records.filter((record) => record.kind === "result" && !record.archived_at);
  const visible = plan === "completo" ? results : results.slice(0, 3);
  if (!results.length) return <section className="panel result-evidence"><div className="panel-head"><div><span className="section-label">METAS E EVIDÊNCIAS</span><h2>Nenhum resultado medido ainda</h2><p>Defina um resultado no plano do ciclo para comparar valor observado e alvo.</p></div></div></section>;

  return <section className="panel result-evidence"><div className="panel-head"><div><span className="section-label">METAS E EVIDÊNCIAS</span><h2>O que foi medido</h2><p>Valores e períodos vêm dos registros da empresa. Ausência de medição não equivale a zero.</p></div></div><div className="result-evidence-scroll"><table><thead><tr><th>Resultado</th><th>Período</th><th>Observado / meta</th><th>Fonte e registro</th></tr></thead><tbody>{visible.map((result) => { const progress = latestProgress(records, result.id); const priority = records.find((record) => record.id === result.data.priorityId); return <tr key={result.id}><td><strong>{result.title}</strong><small>{priority?.title || "Prioridade não encontrada"}</small></td><td>{date(result.data.periodStart)} a {date(result.data.periodEnd)}</td><td><strong>{value(progress?.data.value)} {progress?.data.value !== undefined && progress.data.value !== "" ? result.data.unit : ""} / {value(result.data.target)} {result.data.unit}</strong><small>{progress?.data.observedAt ? `Observado em ${date(progress.data.observedAt)}` : "Sem atualização observada"}</small></td><td><span>{result.data.source || "Fonte não informada"}</span><button type="button" onClick={() => onOpen(progress || result)}>{progress ? "Abrir evidência" : "Abrir resultado"}</button></td></tr>; })}</tbody></table></div>{plan === "gratuito" && results.length > visible.length && <p className="result-evidence-note">O resumo gratuito mostra 3 resultados. A análise completa organiza todos os registros disponíveis.</p>}</section>;
}
