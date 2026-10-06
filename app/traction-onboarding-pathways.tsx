"use client";

import { useState } from "react";
import { ArrowRight, BriefcaseBusiness, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Section, SectionProps } from "./traction-types";

type Pathway = "hiring" | "promotions" | "planning";

const pathways: { id: Pathway; label: string; icon: React.ReactNode; eyebrow: string; title: string; description: string; steps: { title: string; detail: string }[]; output: string; section: Section }[] = [
  {
    id: "hiring", label: "Contratar", icon: <BriefcaseBusiness size={17} />, eyebrow: "DO CARGO À DECISÃO", title: "Contrate com critérios que todos conseguem explicar.",
    description: "A equipe prepara o que avaliar antes de conhecer candidaturas e registra a evidência usada em cada decisão.",
    steps: [
      { title: "Estruture o cargo", detail: "Defina missão, resultados, competências e critérios por nível." },
      { title: "Prepare a vaga", detail: "Vincule o cargo, registre a necessidade e use perguntas equivalentes." },
      { title: "Compare evidências", detail: "Avalie as pessoas pelos mesmos critérios e documente a decisão humana." },
    ],
    output: "Registros conectados: cargo, vaga, candidatura e avaliação.", section: "hiring",
  },
  {
    id: "promotions", label: "Promover", icon: <Sparkles size={17} />, eyebrow: "EVOLUÇÃO COM CONTEXTO", title: "Torne a conversa de promoção mais clara.",
    description: "O cargo atual e o cargo alvo dão contexto à análise. Resultados, lacunas e próximos passos ficam registrados.",
    steps: [
      { title: "Localize a pessoa", detail: "Registre sua área, cargo atual e o papel que pretende alcançar." },
      { title: "Compare com o cargo alvo", detail: "Relacione entregas observadas às competências e aos critérios definidos." },
      { title: "Acompanhe o depois", detail: "Documente a decisão e transforme lacunas em um plano de desenvolvimento." },
    ],
    output: "Registros conectados: colaborador, cargo, avaliação e plano.", section: "promotions",
  },
  {
    id: "planning", label: "Executar estratégia", icon: <Target size={17} />, eyebrow: "DO PLANO À ROTINA", title: "Toda prioridade precisa virar avanço visível.",
    description: "Um ciclo une objetivos, prioridades, resultados e responsáveis. As revisões mantêm riscos e decisões à vista.",
    steps: [
      { title: "Escolha o foco", detail: "Abra um ciclo e conecte poucas prioridades aos objetivos." },
      { title: "Defina como medir", detail: "Registre valor inicial, alvo, fonte e responsável para cada resultado." },
      { title: "Revise e aprenda", detail: "Atualize avanços, trate riscos, registre decisões e encerre com aprendizados." },
    ],
    output: "Registros conectados: ciclo, prioridade, indicador, revisão e decisão.", section: "planning",
  },
];

export function TractionOnboardingPathways({ onNavigate, onCreateOrganization }: Pick<SectionProps, "onNavigate" | "onCreateOrganization">) {
  const [choice, setChoice] = useState<Pathway>("planning");
  const current = pathways.find((item) => item.id === choice) || pathways[0];
  return <section className="pathway-showcase" aria-label="Como usar o Synky Traction">
    <div className="pathway-heading"><div><span className="section-label">OUTRAS DECISÕES, O MESMO MÉTODO</span><h3>Escolha o que precisa resolver</h3><p>O percurso mostra o que registrar e qual decisão isso ajuda a tomar.</p></div><div className="pathway-switch" role="group" aria-label="Jornada">{[pathways[2], pathways[0], pathways[1]].map((item) => <button type="button" key={item.id} aria-pressed={choice === item.id} className={choice === item.id ? "active" : ""} onClick={() => setChoice(item.id)}>{item.icon}{item.label}</button>)}</div></div>
    <div className="pathway-content" key={current.id}><div className="pathway-intro"><span>{current.eyebrow}</span><h4>{current.title}</h4><p>{current.description}</p><div className="pathway-actions"><Button onClick={onCreateOrganization}>Criar empresa e começar <ArrowRight size={15} /></Button><button type="button" onClick={() => onNavigate(current.section)}>Abrir esta área <ArrowRight size={15} /></button></div></div><div className="pathway-timeline">{current.steps.map((step, index) => <div key={step.title} className="pathway-step"><b>{String(index + 1).padStart(2, "0")}</b><span><strong>{step.title}</strong><small>{step.detail}</small></span></div>)}<p>{current.output}</p></div></div>
  </section>;
}
