import { companyIntro, moduleIntros } from "./traction-module-heading";
import type { Section } from "./traction-types";

const groups: Record<Section, string> = {
  overview: "Visão geral", guide: "Guia de uso", planning: "Gestão e execução",
  reviews: "Gestão e execução", results: "Gestão e execução", structure: "Estrutura da empresa",
  hiring: "Pessoas", promotions: "Pessoas", team: "Pessoas", admin: "Configurações",
};

export function WorkspaceContext({ section, masterView, hasCompany, preview, isMaster, cycle }: {
  section: Section; masterView: boolean; hasCompany: boolean; preview: boolean; isMaster: boolean;
  cycle?: { title: string; status: string };
}) {
  const title = masterView ? companyIntro.title : moduleIntros[section].title;
  return <div className="workspace-header-context">
    <nav className="workspace-breadcrumb" aria-label="Localização no painel">
      <span>{masterView ? "Plataforma" : groups[section]}</span><i aria-hidden="true">/</i><strong>{title}</strong>
    </nav>
    {hasCompany && !masterView ? <p className="workspace-cycle-context">
      {cycle ? <><span className="workspace-context-label">Ciclo</span><span className="workspace-cycle-name" title={cycle.title}>{cycle.title}</span><span className="workspace-cycle-status">{cycle.status}</span></> : <span className="workspace-context-empty">Nenhum ciclo definido</span>}
    </p> : <p className="workspace-context-empty">{preview ? "Prévia pública" : isMaster ? "Visão global da plataforma" : "Configure ou conecte sua empresa"}</p>}
  </div>;
}
