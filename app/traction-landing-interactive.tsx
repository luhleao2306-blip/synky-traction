"use client";
/* eslint-disable @next/next/no-img-element -- Real product captures served as small local WebP assets. */
import { useState } from "react";
import { ArrowRight, BriefcaseBusiness, GitBranch, Maximize2, Target, UsersRound, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const modules = [
  { id: "structure", label: "Áreas e cargos", icon: GitBranch, height: 831, title: "Cada cargo, um papel claro.", text: "Defina responsabilidades, competências e critérios para cada função." },
  { id: "hiring", label: "Contratações", icon: BriefcaseBusiness, height: 821, title: "Contrate com critérios.", text: "Organize vagas, entrevistas e evidências até a decisão." },
  { id: "development", label: "Evolução interna", icon: UsersRound, height: 801, title: "Acompanhe cada pessoa.", text: "Compare o desempenho com o cargo desejado e registre os próximos passos." },
  { id: "planning", label: "Plano do ciclo", icon: Target, height: 821, title: "Veja o que está avançando.", text: "Reúna objetivos, responsáveis e prazos do trabalho em andamento." },
];

export function LandingPreview() {
  const [selected, setSelected] = useState("structure");
  return <Tabs value={selected} onValueChange={setSelected} className="lp-preview">
    <div className="lp-preview-stage">
      <div className="lp-preview-menu">
        <span className="lp-eyebrow">EXPLORE O PAINEL</span>
        <p>Da estrutura à evolução das pessoas.</p>
        <TabsList className="lp-preview-tabs" aria-label="Áreas do sistema">{modules.map((module,index) => <TabsTrigger key={module.id} value={module.id}><span className="lp-tab-index">0{index + 1}</span><module.icon size={20} aria-hidden="true" /><span>{module.label}</span><ArrowRight size={16} className="lp-tab-arrow" aria-hidden="true" /></TabsTrigger>)}</TabsList>
        <span className="lp-preview-caption">Telas reais. Nenhum dado de empresa é exibido.</span>
      </div>
      <div className="lp-preview-display">
      {modules.map((module,index) => <TabsContent forceMount hidden={selected !== module.id} key={module.id} value={module.id} className="lp-preview-content">
        <div className="lp-product-frame">
          <Dialog>
            <DialogTrigger asChild><button type="button" className="lp-screen-button" aria-label={`Ampliar tela de ${module.label}`}><img src={`/product/${module.id}.webp`} width={1265} height={module.height} alt={`Tela real de ${module.label}, antes dos cadastros da empresa`} loading={index === 0 ? "eager" : "lazy"} decoding="async" /><span><Maximize2 size={15} /> Ampliar tela</span></button></DialogTrigger>
            <DialogContent className="lp-zoom-dialog" showCloseButton={false}><DialogClose className="lp-zoom-close" aria-label="Fechar ampliação"><X size={20} /></DialogClose><DialogHeader><DialogTitle>{module.label}</DialogTitle><DialogDescription>Tela real do primeiro acesso, sem dados de empresas.</DialogDescription></DialogHeader><div className="lp-zoom-image"><img src={`/product/${module.id}.webp`} width={1265} height={module.height} alt={`Interface ampliada de ${module.label}`} /></div></DialogContent>
          </Dialog>
        </div>
        <div className="lp-screen-description"><div><span className="lp-eyebrow">{module.label}</span><h3>{module.title}</h3><p>{module.text}</p></div><a href="/previa" className="lp-text-link">Explorar painel <ArrowRight size={17} aria-hidden="true" /></a></div>
      </TabsContent>)}
      </div>
    </div>
  </Tabs>;
}


const questions = [
  ["Para quem é o Synky Traction?", "Para empresas que precisam conectar o planejamento à execução e dar critérios às decisões de pessoas. Direção, RH e lideranças podem organizar objetivos, cargos, contratações, desenvolvimento e revisões no mesmo espaço."],
  ["Como começo a usar?", "Clique em Painel e entre com seu e-mail e senha. Se já faz parte de uma empresa, peça o acesso ao administrador. No primeiro acesso autorizado, você pode criar o espaço da empresa e seguir as etapas para cadastrar seu primeiro ciclo."],
  ["Ele decide quem contratar ou promover?", "Não. A equipe registra critérios e evidências, compara as informações e toma a decisão. O Traction organiza o contexto, os responsáveis e o histórico para tornar essa decisão explicável."],
  ["De onde vêm os resultados?", "Dos registros da própria empresa: objetivos, indicadores, atualizações, avaliações, riscos e decisões. Informações ausentes aparecem como pendências. A prévia desta página apresenta o fluxo, sem expor dados de empresas."],
  ["Posso usar a logo e as cores da minha empresa?", "Sim. Na Administração, você pode aplicar a logo, definir as cores e personalizar a mensagem do espaço. Também é possível configurar as funções e os acessos da equipe."],
  ["Qual é a diferença entre o acesso gratuito e o completo?", "O gratuito apresenta indicadores essenciais e uma síntese curta. O completo aprofunda a leitura dos registros com estrutura, execução, avaliações, desenvolvimento, riscos, decisões e histórico, conforme o acesso contratado pela empresa."],
];

export function LandingQuestions() {
  return <Accordion type="single" collapsible className="lp-questions">{questions.map(([title, answer], index) => <AccordionItem value={`question-${index}`} key={title}><AccordionTrigger><span className="lp-question-index">0{index + 1}</span><span className="lp-question-title">{title}</span></AccordionTrigger><AccordionContent>{answer}</AccordionContent></AccordionItem>)}</Accordion>;
}

