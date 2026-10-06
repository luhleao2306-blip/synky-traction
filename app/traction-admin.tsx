"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArchiveRestore, Building2, Download, FileText, LockKeyhole, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { MemberRow, SectionProps } from "./traction-types";
import { BrandStudio } from "./traction-brand-studio";
import { labelFor } from "@/lib/traction-model";

const roleInfo: Record<string, { title: string; access: string }> = {
  admin: { title: "Administrador", access: "Marca, equipe, dados e todos os módulos" },
  direcao: { title: "Direção", access: "Planejamento, reuniões e resultados" },
  gestor: { title: "Gestor de área", access: "Pessoas e trabalho da área atribuída" },
  responsavel: { title: "Responsável", access: "Iniciativas atribuídas e suas atualizações" },
  leitor: { title: "Leitor", access: "Consulta aos registros permitidos" },
};

const auditLabels: Record<string, string> = {
  created: "Registro criado", updated: "Registro atualizado", archived: "Registro arquivado", restored: "Registro restaurado",
  organization_created: "Empresa criada", settings_updated: "Empresa alterada", brand_updated: "Cores alteradas", brand_logo_updated: "Logo alterada", brand_logo_removed: "Logo removida",
  member_invited: "Acesso cadastrado", member_login_created: "Login criado", member_updated: "Acesso atualizado", member_removed: "Acesso removido", personal_data_removed: "Dados pessoais removidos",
};

const date = (value?: string) => value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR") : "Data não informada";
const now = Date.now();

export function TractionAdmin(props: SectionProps) {
  const { workspace, records, demo, onExport, onPost, onReload, onManageMember, onRemoveMember, onProvisionMember, onOpen } = props;
  const [name, setName] = useState(workspace?.organization.name || "");
  const [retention, setRetention] = useState(workspace?.organization.retention_days?.toString() || "");
  const [contact, setContact] = useState(workspace?.organization.privacy_contact || "");
  const [saving, setSaving] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [provisionTarget, setProvisionTarget] = useState<MemberRow | null>(null);
  const archived = records.filter((record) => !!record.archived_at);
  const candidates = records.filter((record) => record.kind === "person" && record.data.type === "Candidato" && !record.archived_at);
  const due = retention && Number(retention) > 0 ? candidates.filter((record) => (now - new Date(record.created_at.replace(" ", "T") + "Z").getTime()) / 86400000 >= Number(retention)) : [];

  async function saveSettings() {
    if (!workspace) { props.onCreateOrganization(); return; }
    if (!name.trim()) { toast.error("Informe o nome da empresa."); return; }
    if (retention && (!Number.isInteger(Number(retention)) || Number(retention) < 1 || Number(retention) > 3650)) { toast.error("Informe um prazo entre 1 e 3650 dias."); return; }
    if (contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) { toast.error("Informe um email de privacidade válido."); return; }
    setSaving(true);
    try {
      await onPost({ action: "updateOrganization", organizationId: workspace.organization.id, name, retentionDays: retention || null, privacyContact: contact });
      await onReload(); toast.success("Dados da empresa salvos.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível salvar."); }
    finally { setSaving(false); }
  }

  if (workspace && workspace.role !== "admin") return <section className="panel"><div className="panel-head"><div><span className="section-label">SEU ACESSO</span><h2>Permissões do espaço</h2></div></div><div className="permission-view"><LockKeyhole size={22} /><div><strong>{roleInfo[workspace.role].title}</strong><p>{roleInfo[workspace.role].access}</p></div></div></section>;

  return <div className="admin-workspace">
    <nav className="admin-section-nav" aria-label="Áreas da administração"><a href="#admin-company">Empresa</a><a href="#admin-brand">Identidade visual</a><a href="#admin-people">Pessoas e acessos</a><a href="#admin-data">Dados e arquivo</a></nav>

    <section id="admin-company" className="panel admin-section"><div className="panel-head"><div><span className="section-label">01 · EMPRESA</span><h2>Dados da empresa</h2><p>Nome e contatos usados neste espaço.</p></div><Building2 size={22} /></div><div className="admin-company-grid"><label className="field-label">Nome da empresa<Input value={name} maxLength={100} onChange={(event) => setName(event.target.value)} disabled={demo} /></label><label className="field-label">Contato de privacidade<Input type="email" value={contact} onChange={(event) => setContact(event.target.value)} disabled={demo} placeholder="privacidade@empresa.com" /></label><label className="field-label">Prazo de retenção de candidaturas (dias)<Input type="number" min="1" max="3650" value={retention} onChange={(event) => setRetention(event.target.value)} disabled={demo} placeholder="Definir com a empresa" /></label><div className="admin-company-save"><p>O prazo indica quando revisar os dados. A remoção de uma pessoa exige confirmação no registro dela.</p><Button className="action-primary" disabled={saving || (demo && !workspace)} onClick={saveSettings}>{saving ? "Salvando…" : "Salvar dados"}</Button></div></div></section>

    <div id="admin-brand" className="admin-section"><div className="admin-section-title"><span>02 · IDENTIDADE VISUAL</span><p>Somente administradores podem aplicar a logo e as cores para a empresa.</p></div><BrandStudio workspace={workspace} demo={demo} onPost={onPost} onReload={onReload} onCreateOrganization={props.onCreateOrganization} /></div>

    <section id="admin-people" className="panel admin-section"><div className="panel-head"><div><span className="section-label">03 · PESSOAS E ACESSOS</span><h2>Equipe e permissões</h2><p>Confira o alcance de cada papel antes de cadastrar alguém.</p></div><Button className="action-primary" size="sm" onClick={() => demo ? props.onCreateOrganization() : onManageMember()}><Plus size={15} />Adicionar acesso</Button></div><div className="admin-role-guide">{Object.entries(roleInfo).map(([role, info]) => <div key={role}><strong>{info.title}</strong><span>{info.access}</span></div>)}</div>{workspace?.members.length ? <div className="admin-table-scroll"><table className="admin-people-table"><thead><tr><th>Pessoa</th><th>Papel e alcance</th><th>Ações</th></tr></thead><tbody>{workspace.members.map((member) => <tr key={member.email}><td><strong>{member.name || member.email.split("@")[0]}</strong><small>{member.email}</small></td><td><strong>{roleInfo[member.role]?.title || member.role}</strong><small>{member.area_id ? records.find((record) => record.id === member.area_id)?.title || "Área indisponível" : roleInfo[member.role]?.access || ""}</small></td><td>{member.user_id !== workspace.organization.created_by && <div className="admin-row-actions">{!member.has_account && <Button variant="outline" size="sm" onClick={() => setProvisionTarget(member)}>Criar login</Button>}<Button variant="ghost" size="sm" onClick={() => onManageMember(member)}>Editar</Button><Button variant="ghost" size="sm" onClick={() => onRemoveMember(member)}>Remover</Button></div>}</td></tr>)}</tbody></table></div> : <p className="admin-empty">A equipe aparecerá aqui após o primeiro acesso ser cadastrado.</p>}</section>

    <section id="admin-data" className="admin-section"><div className="admin-section-title"><span>04 · DADOS E ARQUIVO</span><p>Revisão de retenção, registros arquivados e exportação.</p></div><div className="admin-data-grid"><div className="panel"><div className="panel-head"><div><span className="section-label">REVISÃO DE DADOS</span><h2>Prazo de candidaturas</h2></div><span className="count-chip">{retention ? due.length : "—"}</span></div>{!retention ? <p className="admin-empty">Defina acima o prazo de retenção da empresa.</p> : due.length ? due.map((record) => <button key={record.id} className="admin-record-row" onClick={() => onOpen(record)}><strong>{record.title}</strong><span>Cadastrado em {date(record.created_at)} · revisar dados</span></button>) : <p className="admin-empty">Nenhuma candidatura atingiu o prazo configurado.</p>}</div><div className="panel"><div className="panel-head"><div><span className="section-label">ARQUIVO</span><h2>Registros arquivados</h2></div><ArchiveRestore size={20} /></div>{archived.length ? archived.map((record) => <button key={record.id} className="admin-record-row" onClick={() => onOpen(record)}><strong>{record.title}</strong><span>{labelFor(record.kind)} · arquivado em {date(record.archived_at || "")}</span></button>) : <p className="admin-empty">Ainda não há registros arquivados.</p>}</div></div><div className="panel admin-export"><div><span className="section-label">PORTABILIDADE</span><h2>Exportar dados da empresa</h2><p>Baixe registros e alterações em um arquivo JSON para análise fora do painel.</p></div><Button variant="outline" disabled={demo} onClick={() => setExportOpen(true)}><Download size={16} /> Exportar dados</Button></div>{!!workspace?.audit.length && <div className="panel admin-audit"><div className="panel-head"><div><span className="section-label">HISTÓRICO REAL</span><h2>Alterações recentes</h2></div><FileText size={19} /></div>{workspace.audit.slice(0, 10).map((event) => <div className="audit-item" key={event.id}><ShieldCheck size={16} /><span><strong>{auditLabels[event.action] || event.action}</strong><small>{new Date(event.created_at.replace(" ", "T") + "Z").toLocaleString("pt-BR")} · {(event.actor === workspace.currentUser.id ? workspace.currentUser.name : workspace.members.find((member) => member.user_id === event.actor)?.name) || "Autor não identificado"}</small></span></div>)}</div>}</section>

    <AlertDialog open={exportOpen} onOpenChange={setExportOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Exportar dados da empresa?</AlertDialogTitle><AlertDialogDescription>O arquivo inclui dados de pessoas, avaliações e histórico. Guarde-o em um local autorizado pela empresa.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><Button onClick={() => { setExportOpen(false); onExport(); }}>Baixar arquivo</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={!!provisionTarget} onOpenChange={(open) => { if (!open) setProvisionTarget(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Criar login para {provisionTarget?.email}?</AlertDialogTitle><AlertDialogDescription>Uma senha inicial será mostrada uma única vez. Compartilhe-a diretamente com esta pessoa por um canal seguro.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><Button onClick={() => { const target = provisionTarget; setProvisionTarget(null); if (target) onProvisionMember(target); }}>Criar login</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
