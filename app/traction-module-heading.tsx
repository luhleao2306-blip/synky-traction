import type { Section } from "./traction-types";

type ModuleIntro = { eyebrow: string; title: string; description: string };

export const moduleIntros: Record<Section, ModuleIntro> = {
  overview: { eyebrow: "VISÃO GERAL", title: "Dashboard", description: "Prioridades e próximos passos da sua empresa." },
  guide: { eyebrow: "GUIA DE USO", title: "Boas práticas", description: "Saiba por onde começar e como usar cada módulo." },
  planning: { eyebrow: "PLANEJAMENTO", title: "Plano do ciclo", description: "Defina objetivos, prioridades e responsáveis." },
  reviews: { eyebrow: "ACOMPANHAMENTO", title: "Reuniões e decisões", description: "Organize pautas, decisões e próximos compromissos." },
  results: { eyebrow: "ACOMPANHAMENTO", title: "Resultados", description: "Compare metas e resultados com evidências." },
  structure: { eyebrow: "ESTRUTURA DA EMPRESA", title: "Áreas e cargos", description: "Organize áreas, responsabilidades e critérios." },
  hiring: { eyebrow: "PESSOAS", title: "Contratações", description: "Acompanhe vagas, entrevistas e decisões." },
  promotions: { eyebrow: "PESSOAS", title: "Evolução interna", description: "Conecte avaliações, promoções e desenvolvimento." },
  admin: { eyebrow: "CONFIGURAÇÕES", title: "Administração", description: "Configure a empresa, a marca e os acessos." },
};

export const companyIntro: ModuleIntro = {
  eyebrow: "CONTROLE DA PLATAFORMA", title: "Central de empresas", description: "Gerencie suas empresas e abra cada espaço de trabalho.",
};

export function ModuleHeading({ intro, title, description, titleId }: {
  intro: ModuleIntro; title?: string; description?: string; titleId?: string;
}) {
  return <div className="synky-module-heading">
    <span className="synky-module-eyebrow">{intro.eyebrow}</span>
    <h1 className="synky-module-title" id={titleId}>{title ?? intro.title}</h1>
    <p className="synky-module-description">{description ?? intro.description}</p>
  </div>;
}
