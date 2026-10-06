"use client";
/* eslint-disable @next/next/no-img-element -- The authenticated company logo is served from its private image route. */
/* eslint-disable @next/next/no-html-link-for-pages -- Full-page links avoid a client navigation error in the public preview. */

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, ClipboardList, BarChart3, BookOpenText, BriefcaseBusiness, Building2, CalendarRange, GitBranch, KeyRound, LayoutDashboard, LogOut, Search, Settings2, ShieldCheck, TrendingUp, UserRound, UsersRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { labelFor, recordKinds, type RecordKind, type TractionRecord } from "@/lib/traction-model";
import { formSpec } from "./traction-config";
import { latestProgress, priorityFor } from "@/lib/traction-flow";
import { WorkspaceSections } from "./traction-sections";
import type { MemberRow, OrganizationSummary, PersonType, Section, Workspace } from "./traction-types";
import { defaultBrand } from "@/lib/traction-brand";
import { CompanySetupDialog } from "./traction-company-setup";
import { TractionNavigation } from "./traction-navigation";
import { canWriteRecord, recordCycle } from "@/lib/traction-permissions";
import "./traction-premium.css";
import "./traction-theme.css";
import "./traction-typography.css";
import "./traction-dashboard.css";
import "./traction-palette.css";
import "./traction-reference-dashboard.css";
import "./traction-company-directory.css";
import { PriorityDetail } from "./traction-priority-detail";
import { WorkspaceSetup } from "./traction-setup";
import { MasterConsole } from "./traction-master";
import { PlatformDashboard } from "./traction-dashboard";
import { CyclePlanningEntry } from "./traction-cycle-entry";
import "./traction-cycle-entry.css";
import { MeetingsEntry } from "./traction-meetings-entry";
import "./traction-meetings-entry.css";
import { ResultsEntry } from "./traction-results-entry";
import "./traction-results-entry.css";
import { StructureEntry } from "./traction-structure-entry";
import "./traction-structure-entry.css";
import { HiringEntry } from "./traction-hiring-entry";
import "./traction-hiring-entry.css";
import { SynkyLogo } from "./synky-logo";
import { AdminEntry } from "./traction-admin-entry";
import "./traction-admin-entry.css";
import { GrowthEntry } from "./traction-growth-entry";
import "./traction-growth-entry.css";
import { AccessForm } from "./traction-access-form";
import { RecordForm } from "./traction-record-form";
import "./traction-record-form.css";
import "./traction-reference-fidelity.css";
import { ModuleHeading, moduleIntros, companyIntro } from "./traction-module-heading";
import "./traction-module-heading.css";
import "./traction-workspace-spacing.css";
import { TeamPersonDialog, TeamTaskDialog } from "./traction-team";
import "./traction-team.css";

const nav: { id: Section; label: string; description: string; icon: typeof LayoutDashboard; group: string }[] = [
  { id: "overview", label: "Dashboard", description: "Visão geral e próximos passos", icon: LayoutDashboard, group: "COMEÇAR" },
  { id: "guide", label: "Boas práticas", description: "Aprenda a usar o sistema", icon: BookOpenText, group: "COMEÇAR" },
  { id: "planning", label: "Plano do ciclo", description: "Objetivos e prioridades", icon: TrendingUp, group: "PLANEJAR" },
  { id: "reviews", label: "Reuniões e decisões", description: "Resolva impedimentos", icon: CalendarRange, group: "PLANEJAR" },
  { id: "results", label: "Resultados", description: "O que os registros mostram", icon: BarChart3, group: "PLANEJAR" },
  { id: "structure", label: "Áreas e cargos", description: "Critérios para pessoas", icon: GitBranch, group: "PESSOAS" },
  { id: "team", label: "Equipe", description: "Colaboradores, acessos e tarefas", icon: UserRound, group: "PESSOAS" },
  { id: "hiring", label: "Contratações", description: "Vagas e avaliações", icon: BriefcaseBusiness, group: "PESSOAS" },
  { id: "promotions", label: "Evolução interna", description: "Promoções e planos", icon: UsersRound, group: "PESSOAS" },
  { id: "admin", label: "Administração", description: "Marca, acessos e dados", icon: Settings2, group: "SISTEMA" },
];

const moduleForKind: Record<RecordKind, { section: Section; label: string }> = {
  teamTask: { section: "team", label: "Equipe · tarefas" },
  cycle: { section: "planning", label: "Plano do ciclo" }, objective: { section: "planning", label: "Plano do ciclo" }, priority: { section: "planning", label: "Plano do ciclo" },
  result: { section: "planning", label: "Resultados do ciclo" }, progress: { section: "planning", label: "Atualizações" }, initiative: { section: "planning", label: "Iniciativas" }, risk: { section: "reviews", label: "Reuniões e decisões" }, decision: { section: "reviews", label: "Reuniões e decisões" }, review: { section: "reviews", label: "Reuniões e decisões" }, updateRequest: { section: "reviews", label: "Reuniões e decisões" },
  area: { section: "structure", label: "Áreas e cargos" }, role: { section: "structure", label: "Áreas e cargos" }, vacancy: { section: "hiring", label: "Contratações" }, person: { section: "hiring", label: "Pessoas" }, assessment: { section: "hiring", label: "Avaliações" }, development: { section: "promotions", label: "Evolução interna" },
};

function canSeeSection(section: Section, role?: Workspace["role"]) {
  if (!role) return section !== "admin";
  if (section === "admin") return role === "admin";
  if (["hiring", "promotions"].includes(section)) return role === "admin" || role === "gestor";
  return true;
}

const memberRoleDescriptions: Record<string, string> = {
  admin: "Configura empresa, identidade visual, pessoas, acessos e todos os registros.",
  direcao: "Planeja ciclos, conduz revisões e acompanha resultados. Não acessa dados pessoais de candidaturas e avaliações.",
  gestor: "Acompanha e edita registros da própria área, incluindo vagas, avaliações e planos de pessoas vinculadas a ela.",
  responsavel: "Vê o plano e atualiza iniciativas, solicitações e resultados sob sua responsabilidade.",
  leitor: "Consulta o plano e os resultados permitidos, sem editar registros nem acessar dados pessoais.",
};

function recordModule(record: TractionRecord) {
  if (record.kind === "person" || record.kind === "assessment") return record.data.type === "Colaborador" || record.data.type === "Promoção"
    ? record.kind === "person" ? { section: "team" as Section, label: "Equipe" } : { section: "promotions" as Section, label: "Evolução interna" } : { section: "hiring" as Section, label: "Contratações" };
  return moduleForKind[record.kind];
}

function scopeFor(record: TractionRecord) {
  const section = recordModule(record).section;
  return ["hiring", "promotions", "structure", "team"].includes(section) ? "people" : section === "reviews" ? "meetings" : "planning";
}


const formDescriptions: Partial<Record<RecordKind, string>> = {
  area: "Organize a equipe, a liderança e o papel desta área.",
  person: "Registre a pessoa e seus vínculos com a estrutura da empresa.",
  development: "Conecte o objetivo de desenvolvimento a uma ação, responsável e prazo.",
  cycle: "Defina o período, o contexto e o ritmo de acompanhamento deste ciclo.",
  objective: "Explique a direção estratégica e quem responde por ela.",
  priority: "Conecte o objetivo ao resultado esperado, ao responsável e ao escopo.",
  result: "Defina uma medida verificável com valor inicial, alvo, fonte e responsável.",
  progress: "Registre o que mudou. A atualização ficará no histórico deste item.",
  initiative: "Descreva o compromisso, os marcos e quem vai conduzi-lo.",
  risk: "Mostre o impacto, a dependência e a próxima ação para resolver o impedimento.",
  decision: "Registre quem decide, o prazo e o efeito a acompanhar.",
  review: "Prepare o encontro e documente o resumo depois da reunião.",
  role: "Defina missão, resultados e critérios claros para este cargo.",
  vacancy: "Vincule a necessidade ao cargo e prepare critérios consistentes para entrevistas.",
  assessment: "Relacione evidências aos critérios do cargo. A decisão cabe à equipe responsável.",
};

export default function TractionApp({ displayName, preview = false, isMaster = false }: { displayName: string; preview?: boolean; isMaster?: boolean }) {
  const [masterView, setMasterView] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [organizationId, setOrganizationId] = useState("");
  const [section, setSection] = useState<Section>("overview");
  const [search, setSearch] = useState("");
  const [searchScope, setSearchScope] = useState<"all" | "planning" | "people" | "meetings">("all");
  const [loading, setLoading] = useState(!preview);
  const [loadError, setLoadError] = useState("");
  const [dialog, setDialog] = useState<"record" | "detail" | "member" | null>(null);
  const [kind, setKind] = useState<RecordKind>("area");
  const [personType, setPersonType] = useState<PersonType>("Candidato");
  const [selected, setSelected] = useState<TractionRecord | null>(null);
  const [title, setTitle] = useState("");
  const [data, setData] = useState<Record<string, string>>({});
  const [memberTarget, setMemberTarget] = useState<MemberRow | null>(null);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("leitor");
  const [memberArea, setMemberArea] = useState("");
  const [eraseTarget, setEraseTarget] = useState<TractionRecord | null>(null);
  const [eraseConfirmation, setEraseConfirmation] = useState("");
  const [removeMemberTarget, setRemoveMemberTarget] = useState<MemberRow | null>(null);
  const [newCredential, setNewCredential] = useState<{ email: string; password: string } | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [teamTaskTarget, setTeamTaskTarget] = useState<TractionRecord | null>(null);
  const [teamPerson, setTeamPerson] = useState<TractionRecord | "new" | null>(null);
  const [companySetupOpen, setCompanySetupOpen] = useState(false);
  const [recordInitial, setRecordInitial] = useState<{title:string;data:Record<string,string>}>({title:"",data:{}});
  const [memberInitial,setMemberInitial] = useState({email:"",role:"leitor",area:""});
  const [discardOpen,setDiscardOpen] = useState(false);
  function closeRecordDialog() {
    if(saving) return;
    if(dialog === "record" && (title !== recordInitial.title || JSON.stringify(data) !== JSON.stringify(recordInitial.data))) {setDiscardOpen(true);return;}
    if(dialog === "member" && (memberEmail !== memberInitial.email || memberRole !== memberInitial.role || memberArea !== memberInitial.area)) {setDiscardOpen(true);return;}
    setDialog(null);
  }

  const loadWorkspace = useCallback(async (id: string) => {
    const response = await fetch(`/api/workspace?organizationId=${encodeURIComponent(id)}`, { cache: "no-store" });
    const result = await response.json() as Workspace & { error?: string };
    if (!response.ok) throw new Error(result.error || "Não foi possível carregar a empresa.");
    setWorkspace(result);
    setOrganizationId(id);
    setLoadError("");
    return result;
  }, []);

  const loadOrganizations = useCallback(async () => {
    const response = await fetch("/api/workspace", { cache: "no-store" });
    const result = await response.json() as { organizations: OrganizationSummary[]; error?: string };
    if (!response.ok) throw new Error(result.error || "Não foi possível carregar suas empresas.");
    setOrganizations(result.organizations);
    return result.organizations;
  }, []);

  useEffect(() => {
    if (preview) return;
    let live = true;
    (async () => {
      try {
        const orgs = await loadOrganizations();
        if (!live) return;
        let saved: { organizationId?: string; section?: Section; masterView?: boolean } = {};
        try { const preference = JSON.parse(sessionStorage.getItem("synky-traction-navigation") || "{}"); if (preference && typeof preference === "object" && !Array.isArray(preference)) saved = preference; } catch { /* Navigation preferences are optional. */ }
        const selectedCompany = orgs.find(company => company.id === saved.organizationId);
        // Each panel entry starts at the dashboard; the company preference remains access-checked.
        const company = isMaster ? saved.masterView === false ? selectedCompany : undefined : selectedCompany || orgs[0];
        if (company) await loadWorkspace(company.id);
        if (live) {
          setMasterView(false);
          setSection("overview");
        }
      } catch (error) {
        if (live) setLoadError(error instanceof Error ? error.message : "Não foi possível carregar.");
      } finally { if (live) setLoading(false); }
    })();
    return () => { live = false; };
  }, [loadOrganizations, loadWorkspace, preview, isMaster]);

  useEffect(() => {
    if (preview || loading || loadError) return;
    try { sessionStorage.setItem("synky-traction-navigation", JSON.stringify({ organizationId, section, masterView })); } catch { /* Storage may be disabled by the browser. */ }
  }, [organizationId, section, masterView, preview, loading, loadError]);

  const demo = !workspace && !loading && !loadError;
  const records = useMemo(() => workspace?.records || [], [workspace]);
  const activeRecords = useMemo(() => records.filter((record) => !record.archived_at), [records]);
  const activeCycle = activeRecords.find((record) => record.kind === "cycle" && record.data.status === "Ativo") || activeRecords.find((record) => record.kind === "cycle" && record.data.status === "Planejado");
  const canEdit = !!workspace && workspace.role !== "leitor";
  const canAdmin = workspace?.role === "admin";
  const replyOnly = kind === "updateRequest" && !!selected && !!workspace && !["admin", "direcao"].includes(workspace.role);
  const [referenceMenuOpen, setReferenceMenuOpen] = useState(true);
  function navigateTo(next: Section) {
    setMasterView(false);
    setSection(workspace && !canSeeSection(next, workspace.role) ? "overview" : next);
    setSearch("");
    window.scrollTo(0, 0);
  }

  const post = useCallback(async (payload: Record<string, unknown>) => {
    const response = await fetch("/api/workspace", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json() as { id?: string; error?: string; [key: string]: unknown };
    if (!response.ok) throw new Error(result.error || "Não foi possível salvar.");
    return result;
  }, []);

  const reload = useCallback(async () => {
    if (!organizationId) return;
    const next = await loadWorkspace(organizationId);
    setOrganizations(current => current.map(company => company.id === organizationId ? { ...company, name: next.organization.name } : company));
  }, [organizationId, loadWorkspace]);
  const canCreate = useCallback((target: RecordKind) => {
    if (preview) return false;
    if (demo) return true;
    if (!canEdit) return false;
    if (workspace?.role === "admin") return true;
    if (workspace?.role === "direcao") return !["area", "role", "person", "assessment", "development", "vacancy"].includes(target);
    if (workspace?.role === "responsavel") return target === "progress";
    return !["area", "cycle", "objective", "review", "updateRequest"].includes(target);
  }, [preview, demo, canEdit, workspace?.role]);

  function canEditRecord(record: TractionRecord) {
    if (!workspace) return false;
    const byId = new Map(records.map(item => [item.id, item]));
    const cycleId = recordCycle(record, byId);
    if (cycleId && byId.get(cycleId)?.data.status === "Encerrado") return false;
    return canWriteRecord({ role: workspace.role, email: workspace.currentUser.email, area_id: workspace.areaId }, record, byId);
  }

  function createOrganization() {
    if (preview) {
      window.location.assign("/login");
      return;
    }
    setDialog(null); setCompanySetupOpen(true);
  }

  function switchOrganization(id: string) {
    if (id === "__new__") { createOrganization(); return; }
    setMasterView(false);
    setDialog(null);
    setSelected(null);
    setMemberTarget(null);
    setEraseTarget(null);
    setRemoveMemberTarget(null);
    setSearch("");
    setLoading(true);
    loadWorkspace(id).then((next) => { if (!canSeeSection(section, next.role)) setSection("overview"); window.scrollTo(0, 0); }).catch((error) => { setLoadError(error.message); toast.error(error.message); }).finally(() => setLoading(false));
  }

  function createRecord(nextKind: RecordKind, nextPersonType: PersonType = section === "promotions" ? "Colaborador" : "Candidato", preset: Record<string, string> = {}) {
    if (demo) { createOrganization(); return; }
    if (!canCreate(nextKind)) { toast.error("Sua função não permite criar este registro."); return; }
    if (nextKind === "person" && nextPersonType === "Colaborador") { setTeamPerson("new"); return; }
    setKind(nextKind); setPersonType(nextPersonType); setSelected(null); setTitle("");
    const defaults: Record<string, string> = {};
    if (workspace?.areaId) defaults.areaId = workspace.areaId;
    if (workspace && ["objective", "priority", "result", "initiative", "risk", "development"].includes(nextKind)) { defaults.owner = workspace.currentUser.name; if(nextKind !== "development") defaults.ownerEmail = workspace.currentUser.email; }
    if (nextKind === "person") defaults.type = nextPersonType;
    if (nextKind === "assessment") { defaults.type = nextPersonType === "Colaborador" ? "Promoção" : "Contratação"; defaults.decision = "Em análise"; }
    if (nextKind === "priority" || nextKind === "initiative") defaults.status = "Planejada";
    if (nextKind === "vacancy") defaults.status = "Planejada";
    if (nextKind === "decision") defaults.status = "Pendente";
    if (nextKind === "development") defaults.status = "Planejado";
    if (nextKind === "objective") defaults.status = "Ativo";
    if (nextKind === "risk") defaults.status = "Aberto";
    if (nextKind === "cycle") defaults.status = "Planejado";
    const localDate = (date:Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
    if (nextKind === "review") defaults.meetingDate = localDate(new Date());
    if (nextKind === "progress") { defaults.observedAt = localDate(new Date()); defaults.status = "Em dia"; }
    if (nextKind === "result") defaults.measureType = "Número";
    if (nextKind === "review") { defaults.status = "Preparação"; defaults.cadence = "Semanal"; defaults.facilitator = workspace?.currentUser.name || ""; }
    if (nextKind === "cycle") {
      const now = new Date(); const quarter = Math.floor(now.getMonth() / 3);
      defaults.startDate = localDate(new Date(now.getFullYear(), quarter * 3, 1));
      defaults.endDate = localDate(new Date(now.getFullYear(), quarter * 3 + 3, 0));
      defaults.cadence = "Semanal";
    }
    if (["objective", "priority", "review"].includes(nextKind)) defaults.cycleId = activeCycle?.id || "";
    setData({ ...defaults, ...preset }); setRecordInitial({title:"",data:{ ...defaults, ...preset }}); setDialog("record");
  }

  function updateSelect(fieldKey: string, selectedValue: string) {
    const next = selectedValue === "none" ? "" : selectedValue;
    setData((current) => {
      const changed = current[fieldKey] !== next;
      const reset: Record<string, string> = {};
      if (kind === "progress" && ["priorityId", "resultId", "initiativeId"].includes(fieldKey)) Object.assign(reset, { priorityId: "", resultId: "", initiativeId: "" });
      if (changed && fieldKey === "cycleId" && kind === "priority") reset.objectiveId = "";
      if (changed && fieldKey === "cycleId" && kind === "objective") reset.dependsOnId = "";
      if (changed && fieldKey === "cycleId" && kind === "updateRequest") Object.assign(reset, { reviewId: "", priorityId: "" });
      if (changed && fieldKey === "priorityId" && kind === "initiative") reset.resultId = "";
      if (changed && fieldKey === "priorityId" && kind === "risk") reset.initiativeId = "";
      if (changed && fieldKey === "priorityId" && kind === "decision") Object.assign(reset, { riskId: "", reviewId: "" });
      if (changed && fieldKey === "roleId" && kind === "vacancy") reset.areaId = activeRecords.find(record=>record.id===next)?.data.areaId || "";
      if (changed && fieldKey === "areaId" && kind === "person") Object.assign(reset, { currentRoleId: "", vacancyId: "" });
      if (kind === "person" && fieldKey === "type" && next === "Colaborador") reset.vacancyId = "";
      if (changed && kind === "person" && fieldKey === "vacancyId" && next) {
        const vacancy = activeRecords.find(record=>record.id===next);
        const role = activeRecords.find(record=>record.id===vacancy?.data.roleId);
        if(role) reset.areaId = role.data.areaId || "";
        if(current.currentRoleId && activeRecords.find(record=>record.id===current.currentRoleId)?.data.areaId !== reset.areaId) reset.currentRoleId = "";
      }
      if (changed && kind === "person" && fieldKey === "currentRoleId" && next) reset.areaId = activeRecords.find(record=>record.id===next)?.data.areaId || "";
      if (changed && kind === "assessment" && fieldKey === "type") Object.assign(reset,{personId:"",roleId:"",vacancyId:""});
      if (changed && kind === "assessment" && fieldKey === "personId") {
        const person=activeRecords.find(record=>record.id===next);
        const vacancy=activeRecords.find(record=>record.id===person?.data.vacancyId);
        reset.vacancyId=vacancy?.id || "";
        reset.roleId=vacancy?.data.roleId || "";
      }
      if (changed && kind === "assessment" && fieldKey === "roleId") reset.vacancyId=activeRecords.find(record=>record.id===current.personId)?.data.vacancyId || "";
      if (changed && kind === "assessment" && fieldKey === "vacancyId" && next) reset.roleId=activeRecords.find(record=>record.id===next)?.data.roleId || "";
      return { ...current, ...reset, [fieldKey]: next };
    });
    if (kind === "person" && fieldKey === "type" && (next === "Candidato" || next === "Colaborador")) setPersonType(next);
    if (kind === "assessment" && fieldKey === "type" && (next === "Contratação" || next === "Promoção")) setPersonType(next === "Promoção" ? "Colaborador" : "Candidato");
  }

  function openRecord(record: TractionRecord) {
    if (record.kind === "teamTask") { setTeamTaskTarget(record); return; }
    setSelected(record); setKind(record.kind); setTitle(record.title); setData(record.data);
    setPersonType(record.data.type === "Colaborador" || record.data.type === "Promoção" ? "Colaborador" : "Candidato");
    setDialog("detail");
  }

  function editSelected() {
    if (!selected || demo || !canEdit) return;
    if (selected.kind === "person" && selected.data.type === "Colaborador") { setDialog(null); setTeamPerson(selected); return; }
    setRecordInitial({title:selected.title,data:selected.data});
    setDialog("record");
  }

  async function saveRecord() {
    if(saving) return;
    setSaving(true);
    try {
      await post({ action: selected ? "updateRecord" : "createRecord", organizationId, id: selected?.id, version: selected?.version, kind, title, data });
      toast.success(selected ? "Registro atualizado." : "Registro criado.");
      setDialog(null);
      try { await reload(); } catch(error) { setLoadError(error instanceof Error ? error.message : "Não foi possível atualizar a lista."); toast.error("O registro foi salvo, mas a lista não atualizou. Tente carregar novamente."); }
    } finally { setSaving(false); }
  }

  async function openCreatedCompany(id: string) {
    await loadOrganizations();
    await loadWorkspace(id);
    setMasterView(false);
    setSearch(""); setCompanySetupOpen(false);
    toast.success("Empresa criada. Sua identidade já está aplicada ao painel.");
  }

  function showCompanies() {
    setMasterView(true); setSearch("");
    loadOrganizations().catch(error => toast.error(error.message));
    window.scrollTo(0, 0);
  }

  function manageMember(member?: MemberRow) {
    if (!canAdmin) return;
    setMemberInitial({email:member?.email || "",role:member?.role || "leitor",area:member?.area_id || ""});
    setMemberTarget(member || null); setMemberEmail(member?.email || ""); setMemberRole(member?.role || "leitor"); setMemberArea(member?.area_id || ""); setDialog("member");
  }

  async function saveMember() {
    if(saving) return;
    setSaving(true);
    try {
      const result = await post({ action: memberTarget ? "updateMember" : "invite", organizationId, email: memberEmail, role: memberRole, areaId: memberArea });
      setDialog(null);
      try { await reload(); } catch { toast.error("O acesso foi salvo, mas a lista não atualizou. Recarregue o painel."); }
      if (typeof result.temporaryPassword === "string") setNewCredential({ email: memberEmail, password: result.temporaryPassword });
      else toast.success(memberTarget ? "Acesso atualizado." : "Acesso cadastrado. A pessoa já tem uma conta Synky.");
    } finally { setSaving(false); }
  }

  async function provisionMember(member: MemberRow) {
    setSaving(true);
    try {
      const result = await post({ action: "provisionMember", organizationId, email: member.email });
      await reload();
      if (typeof result.temporaryPassword === "string") setNewCredential({ email: member.email, password: result.temporaryPassword });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível criar o login."); }
    finally { setSaving(false); }
  }

  async function logout() {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }); }
    finally { window.location.assign("/login"); }
  }

  async function changePassword() {
    if (nextPassword.length < 12) { toast.error("A nova senha precisa ter pelo menos 12 caracteres."); return; }
    setSaving(true);
    try {
      const response = await fetch("/api/auth/password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword: nextPassword }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível trocar a senha.");
      setPasswordOpen(false); setCurrentPassword(""); setNextPassword("");
      toast.success("Senha atualizada. Entre novamente.");
      window.location.assign("/login");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível trocar a senha."); }
    finally { setSaving(false); }
  }

  async function changeArchive(record: TractionRecord) {
    setSaving(true);
    try {
      await post({ action: record.archived_at ? "restoreRecord" : "archiveRecord", organizationId, id: record.id });
      await reload(); setDialog(null); toast.success(record.archived_at ? "Registro restaurado." : "Registro arquivado.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível alterar o registro."); }
    finally { setSaving(false); }
  }

  async function erasePerson() {
    if (!eraseTarget) return;
    setSaving(true);
    try {
      await post({ action: "erasePerson", organizationId, id: eraseTarget.id, confirmTitle: eraseConfirmation });
      await reload(); setEraseTarget(null); setEraseConfirmation(""); toast.success("Pessoa e avaliações vinculadas removidas.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível remover os dados."); }
    finally { setSaving(false); }
  }

  async function removeMember() {
    if (!removeMemberTarget) return;
    setSaving(true);
    try {
      await post({ action: "removeMember", organizationId, email: removeMemberTarget.email });
      await reload(); setRemoveMemberTarget(null); toast.success("Acesso removido da empresa.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível remover o acesso."); }
    finally { setSaving(false); }
  }

  function exportData() {
    if (!organizationId || !canAdmin) return;
    const link = document.createElement("a");
    link.href = `/api/workspace?organizationId=${encodeURIComponent(organizationId)}&export=1`;
    link.download = "synky-traction-dados.json";
    link.click();
  }
  const searchResults = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return query ? activeRecords.filter((record) => (searchScope === "all" || scopeFor(record) === searchScope) && `${record.title} ${labelFor(record.kind)} ${recordModule(record).label} ${Object.values(record.data).join(" ")}`.toLocaleLowerCase("pt-BR").includes(query)).slice(0, 50) : [];
  }, [activeRecords, search, searchScope]);
  const selectedRelated = selected ? activeRecords.filter((record) => record.id !== selected.id && (
    selected.kind === "priority" ? priorityFor(record, activeRecords) === selected.id :
    selected.kind === "cycle" ? record.data.cycleId === selected.id :
    selected.kind === "review" ? record.data.reviewId === selected.id :
    selected.kind === "result" ? record.data.resultId === selected.id : false
  )) : [];
  const selectedCyclePriorities = selected?.kind === "cycle" ? activeRecords.filter((record) => record.kind === "priority" && record.data.cycleId === selected.id) : [];
  const selectedCycleResults = selected?.kind === "cycle" ? activeRecords.filter((record) => record.kind === "result" && selectedCyclePriorities.some((priority) => priority.id === record.data.priorityId)) : [];
  const selectedResultProgress = selected?.kind === "result" ? latestProgress(activeRecords, selected.id) : undefined;
  const selectedCycleClosed = !!selected && (selected.kind === "cycle" ? selected.data.status === "Encerrado" : activeRecords.some((record) => record.kind === "cycle" && record.data.status === "Encerrado" && record.id === (selected.data.cycleId || activeRecords.find((item) => item.id === priorityFor(selected, activeRecords))?.data.cycleId || activeRecords.find((item) => item.id === selected.data.reviewId)?.data.cycleId)));

  useEffect(() => {
    type Tool = { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: unknown) => Promise<unknown> };
    const context = (document as Document & { modelContext?: { registerTool: (tool: Tool, options: { signal: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: Tool) => { try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(console.error); } catch (error) { console.error(error); } };
    register({ name: "synky_list_workspace_records", title: "Listar registros do Synky Traction", description: "Lista os registros visíveis da empresa aberta.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, async execute() { return { organization: workspace?.organization.name || "Demonstração", demo, records: activeRecords }; } });
    register({ name: "synky_create_workspace_record", title: "Criar registro no Synky Traction", description: "Cria um registro na empresa aberta, com as mesmas validações e permissões da interface.", inputSchema: { type: "object", properties: { kind: { type: "string", enum: recordKinds }, title: { type: "string", minLength: 2 }, data: { type: "object", additionalProperties: { type: "string" } } }, required: ["kind", "title", "data"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: true }, async execute(input) {
      if (!workspace || workspace.role === "leitor") throw new Error("Abra uma empresa com permissão de edição.");
      if (!input || typeof input !== "object") throw new Error("Dados inválidos.");
      const candidate = input as { kind?: RecordKind; title?: string; data?: Record<string, string> };
      if (!candidate.kind || !recordKinds.includes(candidate.kind) || !candidate.title?.trim() || !candidate.data || typeof candidate.data !== "object") throw new Error("Informe tipo, título e dados válidos.");
      const result = await post({ action: "createRecord", organizationId, kind: candidate.kind, title: candidate.title, data: candidate.data });
      await loadWorkspace(organizationId); toast.success("Registro criado.");
      return { id: result.id, kind: candidate.kind, title: candidate.title };
    } });
    return () => lifecycle.abort();
  }, [workspace, demo, activeRecords, organizationId, post, loadWorkspace]);

  const currentIntro = isMaster && masterView ? companyIntro : moduleIntros[section];
  const panelBrand = !masterView && workspace ? { primary: workspace.organization.brand_primary || defaultBrand.primary, sidebar: workspace.organization.brand_sidebar || defaultBrand.sidebar } : defaultBrand;
  const referenceDashboard = isMaster && !masterView && !workspace && section === "overview" && !search && !loading && !loadError;
  const referenceCycleEntry = isMaster && !masterView && !workspace && section === "planning" && !search && !loading && !loadError;
  const referenceMeetingsEntry = isMaster && !masterView && !workspace && section === "reviews" && !search && !loading && !loadError;
  const referenceResultsEntry = isMaster && !masterView && !workspace && section === "results" && !search && !loading && !loadError;
  const referenceStructureEntry = isMaster && !masterView && !workspace && section === "structure" && !search && !loading && !loadError;
  const referenceHiringEntry = isMaster && !masterView && !workspace && section === "hiring" && !search && !loading && !loadError;
  const referenceGrowthEntry = isMaster && !masterView && !workspace && section === "promotions" && !search && !loading && !loadError;
  const referenceAdminEntry = isMaster && !masterView && !workspace && section === "admin" && !search && !loading && !loadError;
  const referenceCompanies = isMaster && masterView;
  const brandStyle = { "--tenant-primary": panelBrand.primary, "--tenant-sidebar": panelBrand.sidebar, "--sidebar": panelBrand.sidebar, "--primary": panelBrand.primary, "--primary-foreground": "#ffffff", "--ring": panelBrand.primary } as React.CSSProperties;
  const referenceFullCanvas = referenceCompanies || referenceCycleEntry || referenceMeetingsEntry || referenceResultsEntry || referenceStructureEntry || referenceHiringEntry || referenceGrowthEntry || referenceAdminEntry;
  return <SidebarProvider open={referenceMenuOpen} onOpenChange={setReferenceMenuOpen} className={`synky-shell ${referenceDashboard || referenceFullCanvas ? "reference-fidelity-shell" : ""} ${referenceFullCanvas ? "reference-full-canvas" : ""} ${referenceDashboard ? "dashboard-reference-shell" : ""} ${referenceCompanies ? "company-directory-shell" : ""} ${referenceCycleEntry ? "cycle-entry-shell" : ""} ${referenceMeetingsEntry ? "meetings-entry-shell" : ""} ${referenceResultsEntry ? "results-entry-shell" : ""} ${referenceStructureEntry ? "structure-entry-shell" : ""} ${referenceHiringEntry ? "hiring-entry-shell" : ""} ${referenceGrowthEntry ? "growth-entry-shell" : ""} ${referenceAdminEntry ? "admin-entry-shell" : ""}`} style={{ ...brandStyle, "--sidebar-width": "clamp(188px, 19.5vw, 240px)" } as React.CSSProperties}>
    <Toaster richColors position="bottom-right" />
    <TractionNavigation displayName={displayName} items={nav.filter(item => canSeeSection(item.id, workspace?.role || (isMaster ? "admin" : undefined)))} section={section} navigate={navigateTo} workspace={workspace} loading={loading} preview={preview} onCreateOrganization={createOrganization} isMaster={isMaster} masterView={masterView} onMaster={showCompanies} />
    <SidebarInset className="main-inset">
      <header className="app-header">
        <div className="header-left"><SidebarTrigger aria-label="Abrir menu" className="menu-trigger" /><span className="header-divider" />{referenceFullCanvas && <><span className="reference-header-brand"><SynkyLogo /></span><span className="header-divider reference-brand-divider" /></>}
          <div className="header-workspace-context">{referenceAdminEntry ? <span>Configurações <i aria-hidden="true">/</i> <b>Administração</b></span> : referenceGrowthEntry ? <span>Pessoas <i aria-hidden="true">/</i> <b>Evolução interna</b></span> : referenceHiringEntry ? <span>Pessoas <i aria-hidden="true">/</i> <b>Contratações</b></span> : referenceStructureEntry ? <span>Estrutura da empresa <i aria-hidden="true">/</i> <b>Áreas e cargos</b></span> : referenceResultsEntry ? <span>Gestão e execução <i aria-hidden="true">/</i> <b>Resultados</b></span> : referenceMeetingsEntry ? <span>Gestão e execução <i aria-hidden="true">/</i> <b>Reuniões e decisões</b></span> : referenceCycleEntry ? <span>Gestão e execução <i aria-hidden="true">/</i> <b>Plano do ciclo</b></span> : referenceCompanies ? <span>Todas as empresas <i aria-hidden="true">/</i> <b>Central de empresas</b></span> : referenceDashboard ? <span>Visão geral <i aria-hidden="true">/</i> Dashboard</span> : <><strong>{masterView ? "Administração master" : workspace?.organization.name || (isMaster ? "Admin master" : preview ? "Prévia pública" : "Sem empresa vinculada")}</strong><span>{masterView ? "Todas as empresas" : activeCycle ? `${activeCycle.title} · ${activeCycle.data.status}` : workspace ? "Ciclo ainda não definido" : isMaster ? "Acesso global" : "Configuração inicial"} <i aria-hidden="true">/</i> {masterView ? "Central de empresas" : nav.find((item) => item.id === section)?.label}</span></>}</div>
        </div>
        <div className="header-right">{preview ? <><Button variant="outline" size="sm" asChild><a href="/">Voltar ao site</a></Button><Button className="action-primary" size="sm" asChild><a href="/login">Entrar no painel</a></Button></> : <>
          {!masterView && workspace && <div className="search-box"><Search size={17} /><Input aria-label="Buscar registros" placeholder="Buscar registros" value={search} onChange={(event) => { setSearch(event.target.value); window.scrollTo(0, 0); }} />{search && <button aria-label="Limpar busca" onClick={() => setSearch("")}><X size={14} /></button>}</div>}
          {organizations.length > 0 && <Select value={organizationId} onValueChange={switchOrganization}><SelectTrigger className="org-switch" aria-label="Selecionar empresa"><Building2 size={14} className="org-switch-icon" /><SelectValue placeholder="Empresa" /></SelectTrigger><SelectContent>{organizations.map((org) => <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>)}<SelectItem value="__new__">+ Criar empresa</SelectItem></SelectContent></Select>}
          <span className={`user-avatar ${referenceFullCanvas ? "reference-hide-avatar" : ""}`} title={displayName}><UserRound size={18} /></span><Button className="header-utility" variant="ghost" size="sm" onClick={() => window.location.assign("https://synky-hub.contato146558.chatgpt.site/painel")} title="Voltar ao Synky One" aria-label="Voltar ao Synky One"><KeyRound size={16} /><span>Synky One</span></Button>{referenceFullCanvas && <span className="reference-header-role"><UserRound size={16} />Admin master</span>}<Button className="header-utility" variant="ghost" size="sm" onClick={logout} title="Sair da conta" aria-label="Sair da conta"><LogOut size={16} /><span>Sair</span></Button>
        </>}</div>
      </header>
      <div className="page-body">
        {preview && <div className="public-preview-banner"><div><strong>Visualização pública do Synky Traction</strong><span>Explore as áreas do sistema. Nenhum dado de empresa ou pessoa é exibido sem acesso autorizado.</span></div><Button size="sm" onClick={createOrganization}>Entrar para usar <ArrowRight size={15} /></Button></div>}
        {loadError && <div className="error-banner"><span>{loadError}</span><Button variant="outline" size="sm" onClick={() => { setLoadError(""); setLoading(true); loadOrganizations().then((orgs) => orgs.length ? loadWorkspace(orgs[0].id) : undefined).catch((error) => setLoadError(error.message)).finally(() => setLoading(false)); }}>Tentar novamente</Button></div>}
        {!referenceResultsEntry && !referenceStructureEntry && !referenceHiringEntry && !referenceGrowthEntry && !referenceAdminEntry && <div className="page-title-row"><ModuleHeading intro={currentIntro} title={search ? "Buscar registros" : undefined} description={search ? `${searchResults.length} ${searchResults.length === 1 ? "registro encontrado" : "registros encontrados"} para “${search}”.` : !referenceCompanies && section === "overview" && workspace?.organization.brand_tagline ? workspace.organization.brand_tagline : undefined} /><div className="title-actions">{referenceMeetingsEntry && <div className="meetings-entry-title-actions"><span className="meetings-master-badge"><ShieldCheck size={17} />Acesso master ativo</span><Button variant="outline" size="sm" onClick={() => navigateTo("overview")}><LayoutDashboard size={16} />Todos os módulos<ArrowRight size={15} /></Button></div>}{referenceCompanies && <Button className="action-primary directory-create-button" onClick={createOrganization}><Building2 size={18} />Cadastrar empresa<span aria-hidden="true">+</span></Button>}{!referenceCompanies && section !== "guide" && (workspace || referenceCycleEntry) && <Button className="guide-shortcut" size="sm" variant="outline" onClick={() => navigateTo("guide")}><BookOpenText size={15} /> Boas práticas</Button>}{!referenceCompanies && workspace && <span className="workspace-chip">{workspace.organization.brand_logo_url ? <img src={workspace.organization.brand_logo_url} alt="" /> : <Building2 size={14} />}<span>{workspace.organization.name}</span></span>}</div></div>}
        {loading || (loadError && !workspace) ? <div className="panel loading-panel"><div className="loading-spinner" /><strong>{loading ? "Preparando seu espaço…" : "Não foi possível abrir este espaço"}</strong><p>{loading ? "Buscando empresas, registros e permissões." : "Use Tentar novamente acima para carregar seus dados."}</p></div>
          : isMaster && masterView ? <MasterConsole displayName={displayName} onModules={() => navigateTo("overview")} onGuide={() => navigateTo("guide")} organizations={organizations} onOpen={switchOrganization} onCreate={createOrganization} onRefresh={async () => { try { await loadOrganizations(); toast.success("Lista de empresas atualizada."); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível atualizar as empresas."); } }} />
          : isMaster && !workspace && section === "overview" ? <PlatformDashboard displayName={displayName} organizations={organizations} onNavigate={navigateTo} onCreate={createOrganization} onCompanies={showCompanies} />
          : referenceCycleEntry ? <CyclePlanningEntry organizations={organizations} onOpen={switchOrganization} onCreate={createOrganization} onCompanies={showCompanies} onModules={() => navigateTo("overview")} onRefresh={async () => { await loadOrganizations(); toast.success("Lista de empresas atualizada."); }} />
          : referenceMeetingsEntry ? <MeetingsEntry organizations={organizations} onOpen={switchOrganization} onCreate={createOrganization} onCompanies={showCompanies} onRefresh={async () => { await loadOrganizations(); toast.success("Lista de empresas atualizada."); }} />
          : referenceResultsEntry ? <ResultsEntry organizations={organizations} onOpen={switchOrganization} onCreate={createOrganization} onCompanies={showCompanies} onModules={() => navigateTo("overview")} onRefresh={async () => { await loadOrganizations(); toast.success("Lista de empresas atualizada."); }} />
          : referenceStructureEntry ? <StructureEntry organizations={organizations} onOpen={switchOrganization} onCreate={createOrganization} onCompanies={showCompanies} onModules={() => navigateTo("overview")} onGuide={() => navigateTo("guide")} onRefresh={async () => { await loadOrganizations(); toast.success("Lista de empresas atualizada."); }} />
          : referenceAdminEntry ? <AdminEntry organizations={organizations} onOpen={switchOrganization} onCreate={createOrganization} onCompanies={showCompanies} onModules={() => navigateTo("overview")} onGuide={() => navigateTo("guide")} onRefresh={async () => { await loadOrganizations(); toast.success("Lista de empresas atualizada."); }} />
          : referenceGrowthEntry ? <GrowthEntry organizations={organizations} onOpen={switchOrganization} onCreate={createOrganization} onCompanies={showCompanies} onModules={() => navigateTo("overview")} onRefresh={async () => { await loadOrganizations(); toast.success("Lista de empresas atualizada."); }} />
          : referenceHiringEntry ? <HiringEntry organizations={organizations} onOpen={switchOrganization} onCreate={createOrganization} onCompanies={showCompanies} onModules={() => navigateTo("overview")} onRefresh={async () => { await loadOrganizations(); toast.success("Lista de empresas atualizada."); }} />
          : isMaster && !workspace && section !== "guide" ? <MasterConsole displayName={displayName} onModules={() => navigateTo("overview")} onGuide={() => navigateTo("guide")} organizations={organizations} module={moduleIntros[section].title} onOpen={switchOrganization} onCreate={createOrganization} onRefresh={async () => { try { await loadOrganizations(); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível atualizar as empresas."); } }} />
          : !workspace && !preview && !isMaster && section !== "guide" ? <WorkspaceSetup section={section} onCreate={createOrganization} onRefresh={async () => { const orgs = await loadOrganizations(); if (orgs.length) await loadWorkspace(orgs[0].id); else toast.info("Seu acesso ainda não foi cadastrado por uma empresa."); }} />
          : search ? <div className="panel search-results"><div className="search-scope" role="group" aria-label="Filtrar resultados por área">{([ ["all", "Tudo"], ["planning", "Plano"], ["meetings", "Reuniões"], ["people", "Pessoas"] ] as const).map(([value, label]) => <button key={value} type="button" className={searchScope === value ? "active" : ""} aria-pressed={searchScope === value} onClick={() => setSearchScope(value)}>{label}</button>)}</div>{searchResults.length ? searchResults.map((record) => { const destination = recordModule(record); return <button key={record.id} className="search-result" onClick={() => { setSection(canSeeSection(destination.section, workspace?.role) ? destination.section : "overview"); setSearch(""); openRecord(record); }}><span className="search-result-module">{destination.label} / {labelFor(record.kind)}</span><strong>{record.title}</strong><span>{record.data.status || record.data.mission || record.data.outcome || record.data.evidence || "Abrir registro"}</span><ArrowRight size={16} /></button>; }) : <div className="empty-note">Nenhum registro nesta área. Tente outra palavra ou escolha “Tudo”.</div>}</div>
          : <>{isMaster && !workspace && section !== "guide" && <section className="master-module-context" aria-label="Contexto da empresa"><div><ShieldCheck size={20} /><span><strong>Nenhuma empresa selecionada</strong><small>{organizations.length ? "Selecione uma empresa para consultar e editar os registros deste módulo." : "Seu acesso master está ativo. Cadastre uma empresa real para começar a usar os registros."}</small></span></div><Button size="sm" variant="outline" onClick={() => { setMasterView(true); setSearch(""); }}>{organizations.length ? "Selecionar empresa" : "Central de empresas"}</Button><Button size="sm" className="action-primary" onClick={createOrganization}>Cadastrar empresa</Button></section>}{workspace && section === "overview" && activeRecords.some(r=>r.kind==="teamTask" && r.data.ownerEmail===workspace.currentUser.email && !["Concluída","Cancelada"].includes(r.data.status)) && <section className="team-dashboard-inbox"><ClipboardList size={22}/><div><strong>Você tem tarefas da equipe para acompanhar</strong><p>Confira as entregas e os prazos combinados.</p></div><Button variant="outline" onClick={()=>navigateTo("team")}>Ver minhas tarefas<ArrowRight size={16}/></Button></section>}<WorkspaceSections key={workspace?.organization.id || "preview"} section={section} records={records} workspace={workspace} demo={demo} onCreate={createRecord} canCreate={canCreate} onOpen={openRecord} onNavigate={navigateTo} onCreateOrganization={createOrganization} onExport={exportData} onPrint={() => window.print()} onPost={(payload) => post(payload)} onReload={reload} onManageMember={manageMember} onRemoveMember={setRemoveMemberTarget} onProvisionMember={provisionMember} /></>}
      </div>
    </SidebarInset>

    <Dialog open={dialog !== null} onOpenChange={(open) => { if (!open) closeRecordDialog(); }}><DialogContent className={`record-dialog synky-dialog ${dialog === "record" ? "record-form-dialog" : dialog === "member" ? "access-form-dialog" : ""}`} style={brandStyle}><DialogHeader><DialogTitle>{dialog === "member" ? memberTarget ? "Editar acesso" : "Adicionar acesso" : dialog === "detail" ? title : `${selected ? "Editar" : "Criar"} ${labelFor(kind).toLowerCase()}`}</DialogTitle><DialogDescription>{dialog === "member" ? "Defina o que esta pessoa poderá ver e alterar." : dialog === "detail" ? `${labelFor(kind)} · ${selected?.archived_at ? "Arquivado" : selectedCycleClosed && selected?.kind === "priority" ? selected.data.closeOutcome || "Ciclo encerrado" : selected?.data.status || "Registro ativo"}` : kind === "assessment" ? "Registre evidências ligadas ao cargo e uma decisão humana." : formDescriptions[kind] || "Preencha os campos necessários para orientar o trabalho."}</DialogDescription></DialogHeader>

      {dialog === "member" && <AccessForm email={memberEmail} role={memberRole} area={memberArea} editing={!!memberTarget} saving={saving} areas={activeRecords.filter(record=>record.kind === "area")} roleDescription={memberRoleDescriptions[memberRole]} onEmail={setMemberEmail} onRole={setMemberRole} onArea={setMemberArea} onSave={saveMember} onCancel={closeRecordDialog} />}
      {dialog === "record" && <RecordForm kind={kind} title={title} data={data} records={activeRecords} personType={personType} selected={selected} replyOnly={replyOnly} saving={saving} companyName={workspace?.organization.name || ""} members={workspace?.members || []} onTitle={setTitle} onData={(key,value)=>setData(current=>({...current,[key]:value}))} onSelect={updateSelect} onSave={saveRecord} onCancel={closeRecordDialog} />}
      {dialog === "detail" && selected && <div className="detail-list">{selected.kind === "priority" && <PriorityDetail priority={selected} records={activeRecords} onOpen={openRecord} closed={selectedCycleClosed} />}{selected.kind !== "priority" && formSpec(kind, activeRecords, personType, data).filter((field) => !!selected.data[field.key]).map((field) => <div key={field.key}><small>{field.label}</small><p>{field.key.endsWith("Id") ? activeRecords.find((record) => record.id === selected.data[field.key])?.title || "Registro relacionado" : field.type === "date" ? new Date(`${selected.data[field.key]}T12:00:00`).toLocaleDateString("pt-BR") : selected.data[field.key]}</p></div>)}{selected.kind === "result" && <div><small>Último valor observado</small><p>{selectedResultProgress ? `${selectedResultProgress.data.value} ${selected.data.unit}` : "Sem atualização"} · alvo {selected.data.target} {selected.data.unit}</p></div>}{selected.updated_at && <div><small>Última alteração do registro</small><p>{new Date(selected.updated_at.replace(" ", "T") + (selected.updated_at.includes("Z") ? "" : "Z")).toLocaleDateString("pt-BR")}</p></div>}{selected.kind === "cycle" && selectedCyclePriorities.length > 0 && <div className="cycle-comparison"><small>RESULTADOS DO CICLO</small>{selectedCyclePriorities.map((priority) => <div key={priority.id}><strong>{priority.title}</strong><span>{priority.data.closeOutcome || "Desfecho pendente"}</span>{selectedCycleResults.filter((result) => result.data.priorityId === priority.id).map((result) => { const update = latestProgress(activeRecords, result.id); return <p key={result.id}>{result.data.indicator}: inicial {result.data.baseline} {result.data.unit} · {update ? `último ${update.data.value} ${result.data.unit}` : "sem atualização"} · alvo {result.data.target} {result.data.unit}</p>; })}</div>)}</div>}{selected.kind !== "priority" && selectedRelated.length > 0 && <div className="detail-related"><small>ITENS RELACIONADOS</small>{selectedRelated.map((record) => <button key={record.id} onClick={() => openRecord(record)}><span>{labelFor(record.kind)} · {record.title}</span><ArrowRight size={15} /></button>)}</div>}{!selected.archived_at && !demo && !selectedCycleClosed && <div className="detail-quick-actions">{selected.kind === "priority" && <>{canCreate("result") && <Button size="sm" variant="outline" onClick={() => createRecord("result", undefined, { priorityId: selected.id })}>Definir resultado</Button>}{canCreate("initiative") && <Button size="sm" variant="outline" onClick={() => createRecord("initiative", undefined, { priorityId: selected.id })}>Criar iniciativa</Button>}{canCreate("risk") && <Button size="sm" variant="outline" onClick={() => createRecord("risk", undefined, { priorityId: selected.id })}>Registrar impedimento</Button>}{canCreate("progress") && <Button size="sm" variant="outline" onClick={() => createRecord("progress", undefined, { priorityId: selected.id })}>Atualizar progresso</Button>}</>}{selected.kind === "result" && canCreate("progress") && <Button size="sm" variant="outline" onClick={() => createRecord("progress", undefined, { resultId: selected.id })}>Atualizar valor</Button>}{selected.kind === "initiative" && canCreate("progress") && <Button size="sm" variant="outline" onClick={() => createRecord("progress", undefined, { initiativeId: selected.id })}>Atualizar iniciativa</Button>}</div>}</div>}
      {dialog === "detail" && <div className="dialog-actions"><Button variant="outline" onClick={closeRecordDialog}>{dialog === "detail" ? "Fechar" : "Cancelar"}</Button>{dialog === "detail" && selected && !demo && canEditRecord(selected) && <><Button variant="outline" disabled={saving} onClick={() => changeArchive(selected)}>{selected.archived_at ? "Restaurar" : "Arquivar"}</Button>{selected.kind === "person" && canAdmin && <Button variant="destructive" onClick={() => { setDialog(null); setEraseTarget(selected); setEraseConfirmation(""); }}>Remover dados</Button>}{selected.kind !== "progress" && <Button className="action-primary" onClick={editSelected} disabled={!!selected.archived_at}>Editar</Button>}</>}</div>}
    </DialogContent></Dialog>

    <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}><AlertDialogContent className="synky-dialog" style={brandStyle}><AlertDialogHeader><AlertDialogTitle>Descartar o preenchimento?</AlertDialogTitle><AlertDialogDescription>Há alterações que ainda não foram salvas. Você pode continuar preenchendo ou fechar sem gravar.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Continuar preenchendo</AlertDialogCancel><Button variant="outline" onClick={()=>{setDiscardOpen(false);setDialog(null);}}>Descartar alterações</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
    {teamTaskTarget && <TeamTaskDialog props={{records,workspace,onPost:post,onReload:reload,onManageMember:manageMember}} people={activeRecords.filter(r=>r.kind==="person" && r.data.type==="Colaborador")} task={teamTaskTarget} onClose={()=>setTeamTaskTarget(null)}/>}
    {teamPerson && <TeamPersonDialog props={{ records, workspace, onPost: post, onReload: reload, onManageMember: manageMember }} person={teamPerson === "new" ? undefined : teamPerson} onClose={() => setTeamPerson(null)} />}
    {companySetupOpen && <CompanySetupDialog onClose={() => setCompanySetupOpen(false)} onComplete={openCreatedCompany} />}
    <Dialog open={passwordOpen} onOpenChange={(open) => { setPasswordOpen(open); if (!open) { setCurrentPassword(""); setNextPassword(""); } }}><DialogContent className="synky-dialog" style={brandStyle}><DialogHeader><DialogTitle>Alterar minha senha</DialogTitle><DialogDescription>Depois da troca, entre novamente com a nova senha.</DialogDescription></DialogHeader><div className="credential-details"><label>Senha atual<Input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label><label>Nova senha (mínimo 12 caracteres)<Input type="password" autoComplete="new-password" value={nextPassword} onChange={(event) => setNextPassword(event.target.value)} /></label></div><div className="dialog-actions"><Button variant="outline" onClick={() => setPasswordOpen(false)}>Cancelar</Button><Button disabled={saving || !currentPassword || nextPassword.length < 12} onClick={changePassword}>Salvar senha</Button></div></DialogContent></Dialog>
    <AlertDialog open={!!newCredential} onOpenChange={(open) => { if (!open) setNewCredential(null); }}><AlertDialogContent className="synky-dialog" style={brandStyle}><AlertDialogHeader><AlertDialogTitle>Login criado</AlertDialogTitle><AlertDialogDescription>Copie estes dados agora e compartilhe com a pessoa de forma segura. A senha não poderá ser consultada depois.</AlertDialogDescription></AlertDialogHeader><div className="credential-details"><label>Email<Input readOnly value={newCredential?.email || ""} /></label><label>Senha inicial<Input readOnly value={newCredential?.password || ""} onFocus={(event) => event.target.select()} /></label></div><AlertDialogFooter><Button variant="outline" onClick={() => { if (newCredential) navigator.clipboard.writeText("Email: " + newCredential.email + "\nSenha: " + newCredential.password).then(() => toast.success("Dados copiados.")).catch(() => toast.error("Não foi possível copiar.")); }}>Copiar dados</Button><Button onClick={() => setNewCredential(null)}>Concluído</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={!!eraseTarget} onOpenChange={(open) => { if (!open) setEraseTarget(null); }}><AlertDialogContent className="synky-dialog" style={brandStyle}><AlertDialogHeader><AlertDialogTitle>Remover dados da pessoa</AlertDialogTitle><AlertDialogDescription>O registro da pessoa e as avaliações e planos vinculados serão removidos. Registros livres que mencionem o nome devem ser revisados separadamente.</AlertDialogDescription></AlertDialogHeader><label className="field-label">Digite {eraseTarget?.title} para confirmar<Input value={eraseConfirmation} onChange={(event) => setEraseConfirmation(event.target.value)} /></label><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><Button variant="destructive" disabled={saving || eraseConfirmation !== eraseTarget?.title} onClick={erasePerson}>Remover dados</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={!!removeMemberTarget} onOpenChange={(open) => { if (!open) setRemoveMemberTarget(null); }}><AlertDialogContent className="synky-dialog" style={brandStyle}><AlertDialogHeader><AlertDialogTitle>Remover acesso</AlertDialogTitle><AlertDialogDescription>Esta pessoa deixará de acessar os dados da empresa no Synky Traction. O acesso ao site é controlado separadamente.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><Button variant="destructive" disabled={saving} onClick={removeMember}>Remover acesso</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </SidebarProvider>;
}
