"use client";
/* eslint-disable @next/next/no-img-element -- The company logo is served from its private image route. */

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, FileText, LockKeyhole, Printer, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TractionReport } from "@/lib/traction-report";
import type { SectionProps } from "./traction-types";
import { ModuleStart } from "./traction-module-start";
import { TractionReportActions } from "./traction-report-actions";
import { ResultEvidence } from "./traction-result-evidence";

export function TractionReportView(props: SectionProps) {
  const { workspace, onNavigate } = props;
  const [report, setReport] = useState<{ organizationId: string; data: TractionReport } | null>(null);
  const [loadError, setLoadError] = useState<{ organizationId: string; message: string } | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const organizationId = workspace?.organization.id;
  const records = workspace?.records;
  useEffect(() => {
    if (!organizationId) return;
    const controller = new AbortController();
    fetch(`/api/workspace?organizationId=${encodeURIComponent(organizationId)}&report=1`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json() as TractionReport & { error?: string };
        if (!response.ok) throw new Error(data.error || "Não foi possível carregar o resultado.");
        setReport({ organizationId, data: data as TractionReport });
        setLoadError(null);
      })
      .catch((issue) => { if (!controller.signal.aborted) setLoadError({ organizationId, message: issue instanceof Error ? issue.message : "Não foi possível carregar o resultado." }); });
    return () => controller.abort();
  }, [organizationId, refresh, records]);

  const shown = report && report.organizationId === organizationId ? report.data : null;
  const error = loadError && loadError.organizationId === organizationId ? loadError.message : "";

  if (!workspace) return <ModuleStart module="results" onCreateOrganization={props.onCreateOrganization} onNavigate={onNavigate} />;

  if (!shown && !error) return <div className="report-loading"><span className="loading-spinner" /><p>Preparando o resultado da empresa…</p></div>;
  if (error) return <div className="panel report-error"><strong>Não foi possível abrir o resultado</strong><p>{error}</p><div className="report-error-actions"><Button onClick={() => { setLoadError(null); setRefresh((value) => value + 1); }}><RefreshCw size={15} /> Tentar novamente</Button><Button variant="outline" onClick={() => onNavigate("overview")}>Voltar à visão geral</Button></div></div>;
  if (!shown) return null;

  return <div className="report-page">
    <section className="report-intro"><div>{workspace.organization.brand_logo_url && <img className="report-company-logo" src={workspace.organization.brand_logo_url} alt={`Logo de ${workspace.organization.name}`} />}<span className="section-label">RESULTADO DA EMPRESA</span><h2>{shown.organization}</h2><p>Gerado em {new Date(shown.generatedAt).toLocaleDateString("pt-BR")}, a partir dos registros disponíveis neste espaço.</p></div><div className="report-intro-actions"><span className={`report-plan ${shown.plan === "completo" ? "paid" : ""}`}>{shown.plan === "completo" ? <Sparkles size={15} /> : <FileText size={15} />}{shown.plan === "completo" ? "Relatório completo" : "Resumo gratuito"}</span><Button variant="outline" onClick={() => { setReport(null); setRefresh((value) => value + 1); }}><RefreshCw size={16} />Atualizar leitura</Button>{shown.plan === "completo" && <Button variant="outline" onClick={() => window.print()}><Printer size={16} />Imprimir / salvar PDF</Button>}</div></section>
    <div className="report-metrics">{shown.metrics.map((metric) => <div className="report-metric" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small></div>)}</div>
    <ResultEvidence records={props.records} onOpen={props.onOpen} plan={shown.plan} />
    <section className="report-summary"><div><span className="section-label">LEITURA RÁPIDA</span><h3>O que os registros mostram</h3></div><div className="report-highlights">{shown.highlights.map((highlight) => <p key={highlight}><CheckCircle2 size={17} />{highlight}</p>)}</div></section>
    {shown.plan === "completo" && shown.sections ? <><TractionReportActions {...props} /><section className="report-explorer"><div className="report-explorer-head"><span className="section-label">ANÁLISE COMPLETA</span><h3>Explore cada parte do relatório</h3><p>Selecione um tema para focar a leitura ou veja o documento inteiro.</p></div><div className="report-section-nav" role="group" aria-label="Filtrar seções do relatório"><button className={selectedSection === null ? "active" : ""} aria-pressed={selectedSection === null} onClick={() => setSelectedSection(null)}>Todas as seções</button>{shown.sections.map((section, index) => <button key={section.title} className={selectedSection === index ? "active" : ""} aria-pressed={selectedSection === index} onClick={() => setSelectedSection(index)}>{section.title.replace(/^\d+\s*·\s*/, "")}</button>)}</div></section>{shown.sections.filter((_, index) => selectedSection === null || selectedSection === index).map((section) => <section className="report-section" key={section.title}><div className="report-section-head"><h3>{section.title}</h3><p>{section.introduction}</p></div><div className="report-items">{section.items.length ? section.items.map((item, index) => <article className="report-item" key={`${section.title}-${index}`}><div><strong>{item.title}</strong>{item.context && <span>{item.context}</span>}</div><p>{item.detail}</p></article>) : <p className="report-empty">{section.empty}</p>}</div></section>)}<p className="report-method">{shown.method}</p></> : <section className="report-upgrade"><div className="report-lock"><LockKeyhole size={22} /></div><div><span className="section-label">RESULTADO COMPLETO</span><h3>Uma análise para apoiar decisões com contexto</h3><p>O relatório completo organiza cargos e critérios, acompanha indicadores e atualizações, reúne evidências de contratação e promoção, e documenta riscos, decisões e próximos passos. Ele aparece somente para empresas com acesso completo ativo.</p><ul><li>Estrutura, cargos e critérios</li><li>Direção, indicadores e execução</li><li>Contratações, avaliações e desenvolvimento</li><li>Riscos, decisões e próximos passos</li></ul><Button variant="outline" onClick={() => onNavigate("planning")}>Ver planejamento <ArrowRight size={15} /></Button></div></section>}
  </div>;
}
