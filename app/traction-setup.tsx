"use client";

import { useState } from "react";
import { Building2, MailCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Section } from "./traction-types";

const sectionNames: Record<Section, string> = {
  overview: "Dashboard", guide: "Boas práticas", planning: "Plano do ciclo", reviews: "Reuniões", results: "Resultados",
  structure: "Áreas e cargos", hiring: "Contratações", promotions: "Evolução interna", admin: "Administração",
};

export function WorkspaceSetup({ section, onCreate, onRefresh }: { section: Section; onCreate: () => void; onRefresh: () => Promise<void> }) {
  const [path, setPath] = useState<"create" | "invite">("create");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setChecking(true);
    try { setError(""); await onRefresh(); }
    catch (issue) { setError(issue instanceof Error ? issue.message : "Não foi possível verificar o acesso."); }
    finally { setChecking(false); }
  }

  return <section className="workspace-setup panel" aria-labelledby="workspace-setup-title">
    <div className="workspace-setup-head"><span className="section-label">PRIMEIRO ACESSO</span><h2 id="workspace-setup-title">Falta conectar uma empresa.</h2><p>Você escolheu <strong>{sectionNames[section]}</strong>. Vamos abrir essa área assim que seu espaço estiver pronto.</p></div>
    <div className="workspace-setup-switch" role="group" aria-label="Como você vai acessar uma empresa">
      <button type="button" className={path === "create" ? "active" : ""} aria-pressed={path === "create"} onClick={() => setPath("create")}><Building2 size={18} /> Vou criar a empresa</button>
      <button type="button" className={path === "invite" ? "active" : ""} aria-pressed={path === "invite"} onClick={() => setPath("invite")}><MailCheck size={18} /> Estou aguardando acesso</button>
    </div>
    {path === "create" ? <div className="workspace-setup-action"><div><strong>Crie o espaço da sua empresa</strong><p>Informe o nome para começar. Você será o administrador e poderá configurar marca e acessos.</p></div><Button className="action-primary" onClick={onCreate}>Criar empresa</Button></div> : <div className="workspace-setup-action"><div><strong>Aguarde o convite de um administrador</strong><p>Peça acesso usando o mesmo email desta conta. Quando ele cadastrar sua permissão, atualize a lista de empresas.</p></div><Button variant="outline" disabled={checking} onClick={refresh}><RefreshCw size={16} />{checking ? "Verificando…" : "Verificar acesso"}</Button></div>}
    {error && <p className="workspace-setup-error" role="alert">{error}</p>}
  </section>;
}
