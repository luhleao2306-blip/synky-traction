"use client";

import { ArrowRight, CheckCircle2, Compass, Flag, Gauge, MessagesSquare, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SectionProps } from "./traction-types";
import { TractionOnboardingPathways } from "./traction-onboarding-pathways";

const questions = [
  { icon: <Target size={21} />, title: "O que importa agora?", detail: "Veja as poucas prioridades escolhidas para o ciclo, quem responde por elas e o resultado esperado.", section: "planning" as const, action: "Conhecer o plano" },
  { icon: <Gauge size={21} />, title: "O que mudou de verdade?", detail: "Compare o alvo com valores observados e leia o contexto da última atualização.", section: "results" as const, action: "Conhecer resultados" },
  { icon: <MessagesSquare size={21} />, title: "O que precisa ser decidido?", detail: "Leve riscos e pendências à revisão, registre responsáveis e acompanhe o efeito depois.", section: "reviews" as const, action: "Conhecer revisões" },
];

export function TractionWelcome({ onNavigate, onCreateOrganization }: Pick<SectionProps, "onNavigate" | "onCreateOrganization">) {
  return <div className="welcome-page">
    <section className="welcome-hero">
      <div className="welcome-copy"><span className="welcome-kicker"><Compass size={16} /> ESTRATÉGIA EM EXECUÇÃO</span><h2>O plano da empresa, vivo em cada decisão.</h2><p>Defina onde chegar, escolha poucas prioridades, acompanhe evidências de avanço e resolva impedimentos nas reuniões. Tudo fica ligado ao mesmo ciclo.</p><div className="welcome-actions"><Button onClick={onCreateOrganization}>Criar minha empresa <ArrowRight size={17} /></Button><button type="button" onClick={() => onNavigate("planning")}>Explorar o primeiro ciclo <ArrowRight size={16} /></button></div><span className="welcome-trust"><CheckCircle2 size={16} /> Sem dados de exemplo: a leitura nasce do que sua equipe registra.</span></div>
      <div className="welcome-map" aria-label="Percurso do trabalho"><div className="welcome-map-head"><span>COMO O TRABALHO FLUI</span><Flag size={18} /></div><button type="button" onClick={() => onNavigate("planning")}><b>01</b><span><strong>Escolha a direção</strong><small>Objetivos e prioridades do ciclo</small></span><ArrowRight size={16} /></button><button type="button" onClick={() => onNavigate("planning")}><b>02</b><span><strong>Defina a evidência</strong><small>Indicador, alvo e responsável</small></span><ArrowRight size={16} /></button><button type="button" onClick={() => onNavigate("reviews")}><b>03</b><span><strong>Revise e decida</strong><small>Avanços, riscos e compromissos</small></span><ArrowRight size={16} /></button><button type="button" onClick={() => onNavigate("results")}><b>04</b><span><strong>Aprenda com o ciclo</strong><small>Histórico e resultado real</small></span><ArrowRight size={16} /></button></div>
    </section>
    <section className="welcome-questions"><div className="welcome-section-head"><span className="section-label">AO ABRIR O PAINEL</span><h3>As respostas que você precisa encontrar</h3><p>O sistema organiza o trabalho para essas respostas aparecerem sem juntar planilhas e mensagens.</p></div><div className="welcome-question-grid">{questions.map((item) => <button type="button" key={item.title} onClick={() => onNavigate(item.section)}><span className="welcome-question-icon">{item.icon}</span><strong>{item.title}</strong><p>{item.detail}</p><small>{item.action} <ArrowRight size={15} /></small></button>)}</div></section>
    <TractionOnboardingPathways onNavigate={onNavigate} onCreateOrganization={onCreateOrganization} />
  </div>;
}
