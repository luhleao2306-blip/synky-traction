import { recordArea as areaOf, recordCycle as cycleOf, canReadRecord as canRead, canWriteRecord as canWrite } from "@/lib/traction-permissions";
import { env } from "cloudflare:workers";
import { getSynkyUser, findUser, newPasswordHash, temporaryPassword, sameOrigin, isMasterAdmin } from "@/app/synky-auth";
import { allowedFields, recordKinds, references, type RecordKind, type TractionRecord } from "@/lib/traction-model";
import { buildTractionReport } from "@/lib/traction-report";
import { reviewAgenda } from "@/lib/traction-flow";
import { defaultBrand, validBrandColor } from "@/lib/traction-brand";
import { readBrandLogo } from "@/lib/traction-logo";

export const dynamic = "force-dynamic";

type User = NonNullable<Awaited<ReturnType<typeof getSynkyUser>>>;
type Member = { organization_id: string; user_id: string | null; email: string; name: string; role: "admin" | "direcao" | "gestor" | "responsavel" | "leitor"; area_id: string | null };
type Organization = { id: string; name: string; created_by: string; retention_days: number | null; privacy_contact: string; report_access_until: string | null; brand_primary: string; brand_sidebar: string; brand_tagline: string; brand_logo_key: string | null; brand_logo_type: string | null };
type RawRecord = Omit<TractionRecord, "data" | "kind"> & { data: string; kind: RecordKind };
type AuditRow = { id: string; record_id: string | null; action: string; actor: string; created_at: string; before: string | null; after: string | null };

function db() {
  if (!env.DB) throw new Error("D1 binding is unavailable");
  return env.DB;
}

function fail(message: string, status = 400) { return Response.json({ error: message }, { status }); }
function value(input: unknown, max = 600) { return typeof input === "string" ? input.trim().slice(0, max) : ""; }
function parseData(input: unknown, kind: RecordKind): Record<string, string> {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  return Object.fromEntries(allowedFields[kind].map((key) => {
    const field = value(source[key], ["evidence", "summary", "interviewQuestions", "criteriaEvidence", "description"].includes(key) ? 4000 : 1600);
    return [key, key === "ownerEmail" ? field.toLowerCase() : field];
  }));
}
const defaultStatuses: Partial<Record<RecordKind, string>> = {
  cycle: "Planejado", objective: "Ativo", priority: "Planejada", result: "Em dia", initiative: "Planejada",
  risk: "Aberto", decision: "Pendente", review: "Preparação", updateRequest: "Pendente", vacancy: "Planejada", development: "Planejado",
};
const statusValues: Partial<Record<RecordKind, readonly string[]>> = {
  cycle: ["Planejado", "Ativo", "Encerrado"], objective: ["Ativo", "Concluído", "Suspenso"],
  priority: ["Planejada", "Em andamento", "Atenção", "Concluída"],
  result: ["Em dia", "Em risco", "Concluído"],
  progress: ["Em dia", "Em risco", "Bloqueado"],
  updateRequest: ["Pendente", "Respondida"],
  initiative: ["Planejada", "Em andamento", "Atenção", "Concluída"],
  risk: ["Aberto", "Em tratamento", "Resolvido"], decision: ["Pendente", "Em execução", "Concluída"],
  review: ["Preparação", "Concluída"],
  vacancy: ["Planejada", "Aberta", "Entrevistas", "Decisão", "Fechada"],
  development: ["Planejado", "Em andamento", "Concluído"],
};
const dateFields = ["startDate", "endDate", "due", "openingDate", "assessedAt", "meetingDate", "nextReview", "periodStart", "periodEnd", "observedAt", "decidedAt", "closedAt"];
function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function unpack(row: RawRecord): TractionRecord { return { ...row, data: JSON.parse(row.data) as Record<string, string> }; }

async function memberFor(user: User, organizationId: string): Promise<Member | null> {
  if (isMasterAdmin(user)) {
    const organization = await db().prepare("SELECT id FROM organizations WHERE id = ?").bind(organizationId).first();
    return organization ? { organization_id: organizationId, user_id: user.userId, email: user.email.toLowerCase(), name: user.displayName, role: "admin", area_id: null } : null;
  }
  const member = await db().prepare("SELECT organization_id, user_id, email, name, role, area_id FROM memberships WHERE organization_id = ? AND (user_id = ? OR email = ?) LIMIT 1")
    .bind(organizationId, user.userId, user.email.toLowerCase()).first<Member>();
  if (member && member.user_id !== user.userId) {
    await db().batch([
      db().prepare("UPDATE organizations SET created_by = ? WHERE id = ? AND created_by = ?").bind(user.userId, organizationId, member.user_id),
      db().prepare("UPDATE memberships SET user_id = ?, name = ? WHERE organization_id = ? AND email = ?")
        .bind(user.userId, user.displayName, organizationId, user.email.toLowerCase()),
    ]);
    return { ...member, user_id: user.userId, name: user.displayName };
  }
  return member;
}

async function allRecords(organizationId: string): Promise<TractionRecord[]> {
  const result = await db().prepare("SELECT id, organization_id, kind, title, data, created_by, updated_by, created_at, updated_at, version, archived_at FROM records WHERE organization_id = ? ORDER BY created_at DESC, rowid DESC")
    .bind(organizationId).all<RawRecord>();
  return result.results.map(unpack);
}

async function validateLinks(organizationId: string, kind: RecordKind, data: Record<string, string>, ownId?: string) {
  for (const [key, expectedKind] of references[kind] || []) {
    const id = data[key];
    if (!id) continue;
    if (id === ownId) return false;
    const linked = await db().prepare("SELECT id FROM records WHERE id = ? AND organization_id = ? AND kind = ? AND archived_at IS NULL")
      .bind(id, organizationId, expectedKind).first();
    if (!linked) return false;
  }
  return true;
}

async function validateBusinessRules(kind: RecordKind, data: Record<string, string>, records: TractionRecord[]) {
  const byId = new Map(records.map((record) => [record.id, record]));
  if (dateFields.some((field) => data[field] && !validDate(data[field]))) return "Informe datas válidas no formato ano-mês-dia.";
  if (data.ownerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.ownerEmail)) return "Informe um email válido para o responsável.";
  if (data.status && statusValues[kind] && !statusValues[kind].includes(data.status)) return "Selecione uma situação válida.";
  if (kind === "cycle" && (!data.startDate || !data.endDate)) return "Informe o início e o fim do ciclo.";
  if (kind === "cycle" && data.endDate < data.startDate) return "A data final deve ser posterior à inicial.";
  if (kind === "cycle" && data.status === "Encerrado" && !data.learnings) return "Registre os aprendizados antes de encerrar o ciclo.";
  if (kind === "objective" && (!data.cycleId || !data.owner)) return "Vincule o objetivo a um ciclo e defina o responsável executivo.";
  if (kind === "objective" && data.dependsOnId && byId.get(data.dependsOnId)?.data.cycleId !== data.cycleId) return "A dependência deve pertencer ao mesmo ciclo do objetivo.";
  if (kind === "role" && !data.areaId) return "Vincule o cargo a uma área.";
  if (kind === "priority" && (!data.cycleId || !data.objectiveId)) return "Vincule a prioridade a um ciclo e objetivo.";
  if (kind === "priority" && data.objectiveId && byId.get(data.objectiveId)?.data.cycleId !== data.cycleId) return "O objetivo deve pertencer ao ciclo da prioridade.";
  if (kind === "priority" && data.status === "Atenção" && (!data.riskReason || !data.nextAction)) return "Ao marcar atenção, registre o motivo e a próxima ação.";
  if (kind === "result") {
    if (!data.priorityId || !data.outcome || !data.indicator || !data.baseline || !data.target || !data.unit || !data.source || !data.owner) return "Defina prioridade, resultado, indicador, valor inicial, alvo, unidade, fonte e responsável.";
    if (!data.measureType || !["Número", "Verificável"].includes(data.measureType)) return "Escolha como o resultado será verificado.";
    if (data.indicatorKind && !["Resultado", "Atividade"].includes(data.indicatorKind)) return "Classifique o indicador como resultado ou atividade.";
    if (data.measureType === "Número" && (!Number.isFinite(Number(data.baseline)) || !Number.isFinite(Number(data.target)))) return "Informe valores numéricos para o valor inicial e o alvo.";
    if (data.periodStart && data.periodEnd && data.periodEnd < data.periodStart) return "O fim do período deve vir depois do início.";
    if (data.status === "Em risco" && (!data.riskReason || !data.nextAction)) return "Ao marcar um resultado em risco, registre motivo e próxima ação.";
  }
  if (kind === "progress") {
    const targets = [data.priorityId, data.resultId, data.initiativeId].filter(Boolean);
    if (targets.length !== 1 || !data.observedAt || !data.note) return "Vincule a atualização a um item e informe data e contexto.";
    if (data.resultId && !data.value?.trim()) return "Informe o valor observado do resultado.";
    if (data.resultId && byId.get(data.resultId)?.data.measureType === "Número" && !Number.isFinite(Number(data.value))) return "Informe um valor numérico para este indicador.";
    if (["Em risco", "Bloqueado"].includes(data.status) && (!data.riskReason || !data.nextAction)) return "Informe o motivo e a próxima ação para um item em risco ou bloqueado.";
  }
  if (kind === "updateRequest" && (!data.priorityId || !data.ownerEmail || !data.due)) return "Escolha a prioridade, o responsável e o prazo da atualização.";
  if (kind === "updateRequest" && data.status === "Respondida" && !data.response) return "Registre a resposta antes de concluir a solicitação.";
  if (kind === "initiative" && (!data.priorityId || !data.owner)) return "Vincule a iniciativa a uma prioridade e defina um responsável.";
  if (kind === "initiative" && data.resultId && byId.get(data.resultId)?.data.priorityId !== data.priorityId) return "O resultado deve pertencer à prioridade da iniciativa.";
  if (kind === "initiative" && data.dependsOnId && byId.get(byId.get(data.dependsOnId)?.data.priorityId || "")?.data.cycleId !== byId.get(data.priorityId)?.data.cycleId) return "A dependência deve pertencer ao mesmo ciclo da iniciativa.";
  if (kind === "initiative" && data.status === "Atenção" && (!data.riskReason || !data.nextAction)) return "Ao marcar atenção, registre o motivo e a próxima ação.";
  if (kind === "initiative" && data.areaId && areaOf(byId.get(data.priorityId)!, byId) && areaOf(byId.get(data.priorityId)!, byId) !== data.areaId) return "A área da iniciativa deve corresponder à prioridade.";
  if (kind === "risk" && data.priorityId && data.initiativeId && byId.get(data.initiativeId)?.data.priorityId !== data.priorityId) return "A iniciativa deve pertencer à prioridade do risco.";
  if (kind === "risk" && !data.priorityId && !data.initiativeId) return "Vincule o risco a uma prioridade ou iniciativa.";
  if (kind === "risk" && (!data.impact || !data.nextAction || !data.owner || !data.due)) return "Registre impacto, responsável, prazo e próxima ação do risco.";
  if (kind === "decision" && data.status !== "Pendente" && !data.decision) return "Registre o que foi decidido.";
  if (kind === "decision" && (!data.decisionMaker || !data.due)) return "Defina quem decide e o prazo da decisão.";
  if (kind === "decision" && data.priorityId && data.riskId && byId.get(data.riskId)?.data.priorityId && byId.get(data.riskId)?.data.priorityId !== data.priorityId) return "O risco deve pertencer à prioridade da decisão.";
  if (kind === "vacancy" && !data.roleId) return "Vincule a vaga a um cargo.";
  if (kind === "vacancy" && data.areaId && areaOf(byId.get(data.roleId)!, byId) !== data.areaId) return "A área da vaga deve corresponder à área do cargo.";
  if (kind === "person" && !["Candidato", "Colaborador"].includes(data.type)) return "Selecione o vínculo da pessoa.";
  if (kind === "person" && data.vacancyId && data.type !== "Candidato") return "Apenas candidatos podem ser vinculados a vagas.";
  if (kind === "person" && data.areaId && data.currentRoleId && areaOf(byId.get(data.currentRoleId)!, byId) !== data.areaId) return "O cargo atual deve pertencer à área da pessoa.";
  if (kind === "person" && data.areaId && data.vacancyId && areaOf(byId.get(data.vacancyId)!, byId) !== data.areaId) return "A vaga deve pertencer à área da pessoa.";
  if (kind === "assessment") {
    if (!data.personId || !data.roleId || !data.evidence) return "Selecione pessoa, cargo e registre evidências.";
    if (!["Contratação", "Promoção"].includes(data.type)) return "Selecione o tipo de avaliação.";
    const person = byId.get(data.personId);
    if (!person || person.data.type !== (data.type === "Promoção" ? "Colaborador" : "Candidato")) return "A pessoa não corresponde ao tipo de avaliação.";
    if (data.decision && !["Em análise", "Avançar", "Aguardar", "Não avançar"].includes(data.decision)) return "Selecione uma decisão válida.";
    if (person.data.vacancyId && byId.get(person.data.vacancyId)?.data.roleId !== data.roleId) return "O cargo avaliado deve corresponder à vaga da pessoa.";
    if (person.data.vacancyId && data.vacancyId && person.data.vacancyId !== data.vacancyId) return "A vaga avaliada deve corresponder à candidatura da pessoa.";
    if (data.vacancyId) {
      const vacancy = byId.get(data.vacancyId);
      if (!vacancy || vacancy.data.roleId !== data.roleId) return "A vaga deve corresponder ao cargo avaliado.";
    }
  }
  if (kind === "development" && (!data.personId || byId.get(data.personId)?.data.type !== "Colaborador")) return "Vincule o plano a um colaborador.";
  if (kind === "development" && (!data.goal || !data.action || !data.owner || !data.due)) return "Defina objetivo, ação prática, responsável e prazo para o desenvolvimento.";
  if (kind === "review" && !data.meetingDate) return "Informe a data da revisão.";
  if (kind === "review" && !data.cycleId) return "Vincule a revisão ao ciclo.";
  if (kind === "review" && data.status === "Concluída" && !data.summary) return "Registre o resumo antes de concluir a revisão.";
  return null;
}

function errorResponse(error: unknown, action: string) {
  console.error(`workspace ${action}`, error);
  if (String(error).includes("UNIQUE constraint")) return fail("Este email já tem acesso à empresa.", 409);
  return fail("Não foi possível concluir a operação. Tente novamente.", 503);
}

export async function GET(request: Request) {
  const user = await getSynkyUser(request);
  if (!user) return fail("Entre na sua conta para continuar.", 401);
  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get("organizationId") || "";
    if (!organizationId) {
      if (isMasterAdmin(user)) {
        const result = await db().prepare("SELECT id, name, 'admin' AS role, NULL AS area_id FROM organizations ORDER BY created_at DESC, rowid DESC").all();
        return Response.json({ organizations: result.results }, { headers: { "cache-control": "private, no-store" } });
      }
      const result = await db().prepare("SELECT o.id, o.name, m.role, m.area_id FROM organizations o JOIN memberships m ON m.organization_id = o.id WHERE m.user_id = ? OR m.email = ? ORDER BY o.created_at DESC, o.rowid DESC")
        .bind(user.userId, user.email.toLowerCase()).all();
      return Response.json({ organizations: result.results });
    }
    const member = await memberFor(user, organizationId);
    if (!member) return fail("Acesso não autorizado a esta empresa.", 403);
    const organization = await db().prepare("SELECT id, name, created_by, retention_days, privacy_contact, report_access_until, brand_primary, brand_sidebar, brand_tagline, brand_logo_key, brand_logo_type FROM organizations WHERE id = ?")
      .bind(organizationId).first<Organization>();
    if (!organization) return fail("Empresa não encontrada.", 404);
    const complete = await allRecords(organizationId);
    const byId = new Map(complete.map((record) => [record.id, record]));
    const records = complete.filter((record) => canRead(member, record, byId));
    const reportPlan = isMasterAdmin(user) || (organization.report_access_until && Date.parse(organization.report_access_until) > Date.now()) ? "completo" : "gratuito";
    if (url.searchParams.get("report") === "1") {
      return Response.json(buildTractionReport(records, organization.name, reportPlan), { headers: { "cache-control": "private, no-store" } });
    }
    const memberships = member.role !== "leitor" ? (await db().prepare("SELECT m.email, m.name, m.role, m.area_id, m.user_id, EXISTS(SELECT 1 FROM app_users u WHERE u.email = m.email) AS has_account FROM memberships m WHERE m.organization_id = ? ORDER BY m.created_at")
      .bind(organizationId).all()).results : [];
    const audit = member.role === "admin" ? (await db().prepare("SELECT id, record_id, action, actor, created_at, before, after FROM audit_events WHERE organization_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 120")
      .bind(organizationId).all<AuditRow>()).results : [];
    const { report_access_until: _reportAccessUntil, brand_logo_key: logoKey, brand_logo_type: _logoType, ...publicOrganization } = organization;
    void _reportAccessUntil;
    void _logoType;
    const brand_logo_url = logoKey ? `/api/brand?organizationId=${encodeURIComponent(organizationId)}&v=${encodeURIComponent(logoKey.split("/").pop() || "")}` : null;
    const payload = { organization: { ...publicOrganization, brand_logo_url, reportPlan }, role: member.role, areaId: member.area_id, currentUser: { id: user.userId, email: user.email.toLowerCase(), name: user.displayName }, records, members: memberships, audit };
    if (url.searchParams.get("export") === "1") {
      if (member.role !== "admin") return fail("Apenas administradores podem exportar os dados.", 403);
      return new Response(JSON.stringify({ ...payload, exportedAt: new Date().toISOString() }, null, 2), {
        headers: { "content-type": "application/json; charset=utf-8", "content-disposition": "attachment; filename=synky-traction-dados.json" },
      });
    }
    return Response.json(payload);
  } catch (error) { return errorResponse(error, "GET"); }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Origem não autorizada.", 403);
  const user = await getSynkyUser(request);
  if (!user) return fail("Entre na sua conta para continuar.", 401);
  let action = "POST";
  let body: Record<string, unknown>;
  let logo: File | null = null;
  try {
    const multipart = request.headers.get("content-type")?.includes("multipart/form-data");
    let input: unknown;
    if (multipart) {
      const form = await request.formData();
      if (form.get("action") !== "createOrganization") return fail("Use o cadastro de empresa para enviar uma imagem.");
      input = Object.fromEntries([...form.entries()].filter(([key]) => key !== "logo"));
      const image = form.get("logo");
      if (image !== null && !(image instanceof File)) return fail("Envie um arquivo de imagem válido.");
      logo = image;
    } else input = await request.json();
    if (!input || typeof input !== "object" || Array.isArray(input)) return fail("Envie dados válidos para esta operação.");
    body = input as Record<string, unknown>;
  } catch { return fail("Os dados enviados são inválidos. Confira e tente novamente."); }
  try {
    action = value(body.action, 40);
    if (action === "createOrganization") {
      const name = value(body.name, 100);
      if (name.length < 2) return fail("Informe o nome da empresa.");
      const brandPrimary = body.brandPrimary === undefined ? defaultBrand.primary : typeof body.brandPrimary === "string" ? body.brandPrimary.trim().toUpperCase() : "";
      const brandSidebar = body.brandSidebar === undefined ? defaultBrand.sidebar : typeof body.brandSidebar === "string" ? body.brandSidebar.trim().toUpperCase() : "";
      const brandTagline = value(body.brandTagline, 100);
      const privacyContact = value(body.privacyContact, 254);
      const retentionDays = body.retentionDays === undefined || body.retentionDays === null || body.retentionDays === "" ? null : Number(body.retentionDays);
      if (!validBrandColor(brandPrimary) || !validBrandColor(brandSidebar, 0.14)) return fail("Escolha cores mais escuras para manter os textos legíveis.");
      if (privacyContact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(privacyContact)) return fail("Informe um email válido para o contato de privacidade.");
      if (retentionDays !== null && (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3650)) return fail("O prazo de retenção deve ter entre 1 e 3650 dias.");
      const image = logo ? await readBrandLogo(logo) : null;
      if (image && "error" in image) return fail(image.error!);
      const storage = (env as typeof env & { BUCKET?: R2Bucket }).BUCKET;
      if (image && !storage) return fail("Armazenamento de imagens indisponível. Tente novamente.", 503);
      const requestId = value(body.requestId, 80);
      if (requestId && !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(requestId)) return fail("Identificador de cadastro inválido. Abra o formulário novamente.");
      const id = requestId || crypto.randomUUID();
      if (requestId) {
        const existing = await db().prepare("SELECT created_by FROM organizations WHERE id = ?").bind(id).first<{ created_by: string }>();
        if (existing) return existing.created_by === user.userId ? Response.json({ id }, { status: 201 }) : fail("Este cadastro não está disponível.", 409);
      }
      const logoKey = image ? `organizations/${id}/logos/${crypto.randomUUID()}` : null;
      if (image && logoKey) await storage!.put(logoKey, image.bytes!, { httpMetadata: { contentType: image.contentType! } });
      try { await db().batch([
        db().prepare("INSERT INTO organizations (id, name, created_by, brand_primary, brand_sidebar, brand_tagline, privacy_contact, retention_days, brand_logo_key, brand_logo_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(id, name, user.userId, brandPrimary, brandSidebar, brandTagline, privacyContact, retentionDays, logoKey, image?.contentType || null),
        db().prepare("INSERT INTO memberships (id, organization_id, user_id, email, name, role) VALUES (?, ?, ?, ?, ?, 'admin')")
          .bind(crypto.randomUUID(), id, user.userId, user.email.toLowerCase(), user.displayName),
        db().prepare("INSERT INTO audit_events (id, organization_id, action, actor, after) VALUES (?, ?, 'organization_created', ?, ?)").bind(crypto.randomUUID(), id, user.userId, JSON.stringify({ name, brandPrimary, brandSidebar, hasLogo: !!logoKey })),
      ]); } catch (error) {
        if (logoKey && storage) try { await storage.delete(logoKey); } catch (cleanupError) { console.error("organization logo cleanup", cleanupError); }
        if (requestId) {
          const existing = await db().prepare("SELECT created_by FROM organizations WHERE id = ?").bind(id).first<{ created_by: string }>();
          if (existing?.created_by === user.userId) return Response.json({ id }, { status: 201 });
        }
        throw error;
      }
      return Response.json({ id }, { status: 201 });
    }

    const organizationId = value(body.organizationId, 80);
    const member = await memberFor(user, organizationId);
    if (!member) return fail("Acesso não autorizado a esta empresa.", 403);
    const complete = await allRecords(organizationId);
    const byId = new Map(complete.map((record) => [record.id, record]));

    if (action === "updateOrganization") {
      if (member.role !== "admin") return fail("Apenas administradores podem alterar a empresa.", 403);
      const name = value(body.name, 100);
      const privacyContact = value(body.privacyContact, 254);
      const retentionDays = body.retentionDays === null || body.retentionDays === "" ? null : Number(body.retentionDays);
      if (name.length < 2 || (retentionDays !== null && (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3650))) return fail("Confira o nome e o prazo de retenção.");
      if (privacyContact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(privacyContact)) return fail("Informe um email válido para o contato de privacidade.");
      await db().batch([
        db().prepare("UPDATE organizations SET name = ?, retention_days = ?, privacy_contact = ? WHERE id = ?").bind(name, retentionDays, privacyContact, organizationId),
        db().prepare("INSERT INTO audit_events (id, organization_id, action, actor, after) VALUES (?, ?, 'settings_updated', ?, ?)")
          .bind(crypto.randomUUID(), organizationId, user.userId, JSON.stringify({ name, retentionDays, privacyContact })),
      ]);
      return Response.json({ ok: true });
    }

    if (action === "updateBrand") {
      if (member.role !== "admin") return fail("Apenas administradores podem alterar a identidade visual.", 403);
      const brandPrimary = typeof body.brandPrimary === "string" ? body.brandPrimary.trim().toUpperCase() : "";
      const brandSidebar = typeof body.brandSidebar === "string" ? body.brandSidebar.trim().toUpperCase() : "";
      const brandTagline = value(body.brandTagline, 100);
      if (!validBrandColor(brandPrimary) || !validBrandColor(brandSidebar, 0.14)) return fail("Escolha cores mais escuras para manter os textos legíveis.");
      await db().batch([
        db().prepare("UPDATE organizations SET brand_primary = ?, brand_sidebar = ?, brand_tagline = ? WHERE id = ?")
          .bind(brandPrimary, brandSidebar, brandTagline, organizationId),
        db().prepare("INSERT INTO audit_events (id, organization_id, action, actor, after) VALUES (?, ?, 'brand_updated', ?, ?)")
          .bind(crypto.randomUUID(), organizationId, user.userId, JSON.stringify({ brandPrimary, brandSidebar, brandTagline })),
      ]);
      return Response.json({ ok: true });
    }

    if (action === "invite" || action === "updateMember" || action === "removeMember" || action === "provisionMember") {
      if (member.role !== "admin") return fail("Apenas administradores podem gerir acessos.", 403);
      const email = value(body.email, 254).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Informe um email válido.");
      const existing = await db().prepare("SELECT user_id, role FROM memberships WHERE organization_id = ? AND email = ?")
        .bind(organizationId, email).first<{ user_id: string | null; role: string }>();
      const organization = await db().prepare("SELECT created_by FROM organizations WHERE id = ?").bind(organizationId).first<{ created_by: string }>();
      if (action !== "invite" && !existing) return fail("Membro não encontrado.", 404);
      if (existing?.user_id === organization?.created_by && action !== "invite") return fail("O acesso da pessoa proprietária não pode ser alterado.", 403);
      if (action === "removeMember") {
        await db().batch([
          db().prepare("DELETE FROM memberships WHERE organization_id = ? AND email = ?").bind(organizationId, email),
          db().prepare("INSERT INTO audit_events (id, organization_id, action, actor, after) VALUES (?, ?, 'member_removed', ?, ?)")
            .bind(crypto.randomUUID(), organizationId, user.userId, JSON.stringify({ email })),
        ]);
        return Response.json({ ok: true });
      }
      if (action === "provisionMember") {
        if (await findUser(email)) return fail("Esta pessoa já tem uma conta.", 409);
        const temporary = temporaryPassword();
        const password = await newPasswordHash(temporary);
        await db().batch([
          db().prepare("INSERT INTO app_users (id, email, name, password_hash, password_salt, password_iterations) VALUES (?, ?, ?, ?, ?, ?)")
            .bind(crypto.randomUUID(), email, email.split("@")[0], password.hash, password.salt, password.iterations),
          db().prepare("INSERT INTO audit_events (id, organization_id, action, actor, after) VALUES (?, ?, 'member_login_created', ?, ?)")
            .bind(crypto.randomUUID(), organizationId, user.userId, JSON.stringify({ email })),
        ]);
        return Response.json({ ok: true, temporaryPassword: temporary }, { headers: { "cache-control": "no-store" } });
      }
      const role = value(body.role, 20);
      const areaId = value(body.areaId, 80) || null;
      if (!["admin", "direcao", "gestor", "responsavel", "leitor"].includes(role)) return fail("Selecione uma função válida.");
      if (role === "gestor" && (!areaId || byId.get(areaId)?.kind !== "area" || byId.get(areaId)?.archived_at)) return fail("Selecione a área do gestor.");
      if (areaId && (byId.get(areaId)?.kind !== "area" || byId.get(areaId)?.archived_at)) return fail("Selecione uma área válida.");
      if (action === "invite") {
        if (existing) return fail("Este email já tem acesso à empresa.", 409);
        const appUser = await findUser(email);
        const temporary = appUser ? null : temporaryPassword();
        const password = temporary ? await newPasswordHash(temporary) : null;
        await db().batch([
          ...(password ? [db().prepare("INSERT INTO app_users (id, email, name, password_hash, password_salt, password_iterations) VALUES (?, ?, ?, ?, ?, ?)")
            .bind(crypto.randomUUID(), email, email.split("@")[0], password.hash, password.salt, password.iterations)] : []),
          db().prepare("INSERT INTO memberships (id, organization_id, email, role, area_id) VALUES (?, ?, ?, ?, ?)")
            .bind(crypto.randomUUID(), organizationId, email, role, ["gestor", "responsavel"].includes(role) ? areaId : null),
          db().prepare("INSERT INTO audit_events (id, organization_id, action, actor, after) VALUES (?, ?, 'member_invited', ?, ?)")
            .bind(crypto.randomUUID(), organizationId, user.userId, JSON.stringify({ email, role, areaId })),
        ]);
        return Response.json({ ok: true, temporaryPassword: temporary }, { status: 201, headers: { "cache-control": "no-store" } });
      }
      await db().batch([
        db().prepare("UPDATE memberships SET role = ?, area_id = ? WHERE organization_id = ? AND email = ?")
          .bind(role, ["gestor", "responsavel"].includes(role) ? areaId : null, organizationId, email),
        db().prepare("INSERT INTO audit_events (id, organization_id, action, actor, after) VALUES (?, ?, 'member_updated', ?, ?)")
          .bind(crypto.randomUUID(), organizationId, user.userId, JSON.stringify({ email, role, areaId })),
      ]);
      return Response.json({ ok: true });
    }

    if (action === "requestUpdates") {
      if (!["admin", "direcao", "gestor"].includes(member.role)) return fail("Você não pode solicitar atualizações.", 403);
      const review = byId.get(value(body.reviewId, 80));
      if (!review || review.kind !== "review" || review.archived_at || review.data.status === "Concluída") return fail("Escolha uma revisão em preparação.");
      if (byId.get(review.data.cycleId)?.data.status === "Encerrado") return fail("O ciclo está encerrado. Consulte o histórico ou crie um novo ciclo.", 409);
      const priorities = complete.filter((record) => record.kind === "priority" && !record.archived_at && record.data.cycleId === review.data.cycleId && canRead(member, record, byId));
      const members = (await db().prepare("SELECT email FROM memberships WHERE organization_id = ?").bind(organizationId).all<{ email: string }>()).results;
      const emails = new Set(members.map((item) => item.email.toLowerCase()));
      const pending = priorities.filter((record) => record.data.ownerEmail && emails.has(record.data.ownerEmail.toLowerCase()) && !complete.some((item) => item.kind === "updateRequest" && !item.archived_at && item.data.reviewId === review.id && item.data.priorityId === record.id));
      const statements = pending.flatMap((priority) => {
        const id = crypto.randomUUID();
        const data = { cycleId: review.data.cycleId, reviewId: review.id, priorityId: priority.id, ownerEmail: priority.data.ownerEmail.toLowerCase(), due: review.data.meetingDate, status: "Pendente", message: "Atualize o avanço, os riscos e a próxima ação antes da revisão.", response: "" };
        return [
          db().prepare("INSERT INTO records (id, organization_id, kind, title, data, created_by, updated_by) VALUES (?, ?, 'updateRequest', ?, ?, ?, ?)").bind(id, organizationId, `Atualização: ${priority.title}`, JSON.stringify(data), user.userId, user.userId),
          db().prepare("INSERT INTO audit_events (id, organization_id, record_id, action, actor, after) VALUES (?, ?, ?, 'created', ?, ?)").bind(crypto.randomUUID(), organizationId, id, user.userId, JSON.stringify({ title: `Atualização: ${priority.title}`, data })),
        ];
      });
      if (statements.length) await db().batch(statements);
      return Response.json({ created: pending.length, withoutAccess: priorities.filter((record) => !record.data.ownerEmail || !emails.has(record.data.ownerEmail.toLowerCase())).length });
    }

    if (action === "createRecord" || action === "updateRecord") {
      const kind = value(body.kind, 30) as RecordKind;
      const title = value(body.title, 160);
      if (!recordKinds.includes(kind) || title.length < 2) return fail("Informe um tipo e título válidos.");
      const data = parseData(body.data, kind);
      if (!data.status && defaultStatuses[kind]) data.status = defaultStatuses[kind];
      if (kind === "assessment" && !data.decision) data.decision = "Em análise";
      if (kind === "progress") data.author = user.displayName || user.email;
      if (kind === "cycle" && data.status === "Encerrado") data.closedAt = new Date().toISOString().slice(0, 10);
      const id = action === "createRecord" ? crypto.randomUUID() : value(body.id, 80);
      const current = action === "updateRecord" ? byId.get(id) : null;
      if (kind === "review" && (action === "createRecord" || (data.status === "Concluída" && current?.data.status !== "Concluída"))) {
        data.agenda = JSON.stringify(reviewAgenda(complete, data.cycleId, data.meetingDate).slice(0, 80));
      }
      if (action === "updateRecord" && (!current || current.kind !== kind || current.archived_at)) return fail("Registro não encontrado.", 404);
      if (current?.kind === "cycle" && current.data.status === "Encerrado") return fail("O ciclo encerrado permanece no histórico e não pode ser alterado.", 409);
      if (current?.kind === "progress") return fail("Atualizações são registros históricos. Crie uma nova atualização.", 403);
      if (!current && kind === "risk" && !data.due) return fail("Informe uma data para resolver ou revisar o impedimento.");
      if (!current && kind === "decision" && (!data.decisionMaker || !data.due)) return fail("Defina quem decide e o prazo da decisão.");
      if (kind === "cycle" && data.status === "Ativo" && complete.some((record) => record.kind === "cycle" && !record.archived_at && record.id !== id && record.data.status === "Ativo")) return fail("Já existe um ciclo ativo. Encerre-o antes de ativar outro.");
      if (kind === "cycle" && data.status === "Encerrado" && current?.data.status !== "Encerrado" && complete.some((record) => record.kind === "priority" && !record.archived_at && record.data.cycleId === id && !record.data.closeOutcome)) return fail("Classifique cada prioridade como concluída, interrompida ou transferida antes de encerrar o ciclo.");
      if (current && ["priority", "result"].includes(kind) && current.data.target !== data.target && (!data.changeReason || data.changeReason === current.data.changeReason)) return fail("Explique a alteração do alvo com uma nova justificativa para preservar o histórico.");
      if (current && kind === "priority" && current.data.position !== data.position && (!data.changeReason || data.changeReason === current.data.changeReason)) return fail("Explique a mudança de ordem com uma nova justificativa.");
      if (kind === "review" && data.status === "Concluída" && !data.summary) return fail("Registre o resumo para concluir a revisão.");
      if (!(await validateLinks(organizationId, kind, data, id))) return fail("Um vínculo pertence a outra empresa, está arquivado ou não existe.");
      const issue = await validateBusinessRules(kind, data, complete);
      if (issue) return fail(issue);
      if (kind === "updateRequest" && member.role !== "admin" && member.role !== "direcao") {
        if (!current || current.data.ownerEmail?.toLowerCase() !== user.email.toLowerCase() || allowedFields.updateRequest.some(field => !["response", "status"].includes(field) && (field === "ownerEmail" ? data[field]?.toLowerCase() !== current.data[field]?.toLowerCase() : data[field] !== (current.data[field] || "")))) return fail("Você só pode responder à sua própria solicitação, mantendo o contexto definido.", 403);
      }
      if (current && member.role === "responsavel" && kind === "initiative" && (current.data.priorityId !== data.priorityId || current.data.ownerEmail?.toLowerCase() !== data.ownerEmail?.toLowerCase())) return fail("O responsável não pode transferir a iniciativa ou alterar seu dono.", 403);
      const cycleId = cycleOf({ id, kind, data }, byId);
      if (kind !== "cycle" && cycleId && byId.get(cycleId)?.data.status === "Encerrado") return fail("O ciclo está encerrado. Consulte o histórico ou crie um novo ciclo.", 409);
      if (kind === "decision" && data.reviewId && data.priorityId && byId.get(data.priorityId)?.data.cycleId !== byId.get(data.reviewId)?.data.cycleId) return fail("A decisão e a reunião devem pertencer ao mesmo ciclo.");
      if (kind === "updateRequest" && (byId.get(data.priorityId)?.data.cycleId !== data.cycleId || (data.reviewId && byId.get(data.reviewId)?.data.cycleId !== data.cycleId))) return fail("A solicitação deve pertencer ao mesmo ciclo da prioridade e da revisão.");
      if (kind === "progress" && data.resultId && data.priorityId) return fail("Vincule a atualização somente ao resultado, à iniciativa ou à prioridade.");
      if (member.role === "gestor" && (references[kind] || []).some(([field]) => {
        const linked = byId.get(data[field]);
        const linkedArea = linked ? areaOf(linked, byId) : null;
        return linkedArea && linkedArea !== member.area_id;
      })) return fail("Um dos vínculos pertence a outra área.", 403);
      const nextRecord: TractionRecord = { id, organization_id: organizationId, kind, title, data, created_at: "", updated_at: "", version: current?.version || 1, archived_at: null };
      if (!canWrite(member, nextRecord, byId) || (current && !canWrite(member, current, byId))) return fail("Você não tem permissão para alterar este registro.", 403);
      const encoded = JSON.stringify(data);
      if (!current) {
        const statements = [
          db().prepare("INSERT INTO records (id, organization_id, kind, title, data, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)")
            .bind(id, organizationId, kind, title, encoded, user.userId, user.userId),
          db().prepare("INSERT INTO audit_events (id, organization_id, record_id, action, actor, after) VALUES (?, ?, ?, 'created', ?, ?)")
            .bind(crypto.randomUUID(), organizationId, id, user.userId, JSON.stringify({ title, data })),
        ];
        if (kind === "progress") {
          const priorityId = data.priorityId || byId.get(data.resultId || data.initiativeId)?.data.priorityId;
          for (const request of complete.filter((record) => record.kind === "updateRequest" && !record.archived_at && record.data.priorityId === priorityId && record.data.ownerEmail?.toLowerCase() === user.email.toLowerCase() && record.data.status === "Pendente")) {
            const after = { ...request.data, status: "Respondida", response: `${data.observedAt}: ${data.note}` };
            statements.push(db().prepare("UPDATE records SET data = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = ? AND organization_id = ?")
              .bind(JSON.stringify(after), user.userId, request.id, organizationId));
            statements.push(db().prepare("INSERT INTO audit_events (id, organization_id, record_id, action, actor, before, after) VALUES (?, ?, ?, 'updated', ?, ?, ?)")
              .bind(crypto.randomUUID(), organizationId, request.id, user.userId, JSON.stringify({ title: request.title, data: request.data }), JSON.stringify({ title: request.title, data: after })));
          }
        }
        await db().batch(statements);
        return Response.json({ id }, { status: 201 });
      }
      if (current.version !== Number(body.version)) return fail("Este registro mudou. Atualize os dados e tente novamente.", 409);
      const updated = await db().prepare("UPDATE records SET title = ?, data = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = ? AND organization_id = ? AND version = ?")
        .bind(title, encoded, user.userId, id, organizationId, current.version).run();
      if (!updated.meta.changes) return fail("Este registro mudou. Atualize os dados e tente novamente.", 409);
      await db().prepare("INSERT INTO audit_events (id, organization_id, record_id, action, actor, before, after) VALUES (?, ?, ?, 'updated', ?, ?, ?)")
        .bind(crypto.randomUUID(), organizationId, id, user.userId, JSON.stringify({ title: current.title, data: current.data }), JSON.stringify({ title, data })).run();
      return Response.json({ id, version: current.version + 1 });
    }

    if (action === "archiveRecord" || action === "restoreRecord") {
      const id = value(body.id, 80);
      const record = byId.get(id);
      if (!record) return fail("Registro não encontrado.", 404);
      const cycleId = cycleOf(record, byId);
      if (cycleId && byId.get(cycleId)?.data.status === "Encerrado") return fail("O ciclo encerrado permanece no histórico e não pode ser alterado.", 409);
      if (!canWrite(member, record, byId)) return fail("Você não tem permissão para alterar este registro.", 403);
      if (action === "archiveRecord" && record.archived_at) return fail("Este registro já está arquivado.", 409);
      if (action === "restoreRecord" && !record.archived_at) return fail("Este registro já está ativo.", 409);
      if (action === "archiveRecord" && complete.some((other) => !other.archived_at && other.id !== id && Object.values(other.data).includes(id))) return fail("Este registro está vinculado a outros itens ativos. Revise os vínculos antes de arquivar.");
      if (action === "archiveRecord" && record.kind === "area") {
        const assigned = await db().prepare("SELECT 1 FROM memberships WHERE organization_id = ? AND area_id = ? LIMIT 1").bind(organizationId, id).first();
        if (assigned) return fail("Esta área está atribuída a um gestor. Altere o acesso antes de arquivá-la.");
      }
      if (action === "restoreRecord" && !(await validateLinks(organizationId, record.kind, record.data, id))) return fail("Restaure os registros vinculados antes deste item.");
      await db().batch([
        db().prepare("UPDATE records SET archived_at = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = ? AND organization_id = ?")
          .bind(action === "archiveRecord" ? new Date().toISOString() : null, user.userId, id, organizationId),
        db().prepare("INSERT INTO audit_events (id, organization_id, record_id, action, actor) VALUES (?, ?, ?, ?, ?)")
          .bind(crypto.randomUUID(), organizationId, id, action === "archiveRecord" ? "archived" : "restored", user.userId),
      ]);
      return Response.json({ ok: true });
    }

    if (action === "erasePerson") {
      if (member.role !== "admin") return fail("Apenas administradores podem remover dados pessoais.", 403);
      const id = value(body.id, 80);
      const person = byId.get(id);
      if (!person || person.kind !== "person") return fail("Pessoa não encontrada.", 404);
      if (body.confirmTitle !== person.title) return fail("Confirme o nome exatamente como está no registro.");
      const linked = complete.filter((record) => ["assessment", "development"].includes(record.kind) && record.data.personId === id);
      const ids = [id, ...linked.map((record) => record.id)];
      const statements = ids.flatMap((recordId) => [
        db().prepare("DELETE FROM audit_events WHERE organization_id = ? AND record_id = ?").bind(organizationId, recordId),
        db().prepare("DELETE FROM records WHERE organization_id = ? AND id = ?").bind(organizationId, recordId),
      ]);
      statements.push(db().prepare("INSERT INTO audit_events (id, organization_id, action, actor, after) VALUES (?, ?, 'personal_data_removed', ?, ?)")
        .bind(crypto.randomUUID(), organizationId, user.userId, JSON.stringify({ linkedRecordsRemoved: linked.length })));
      await db().batch(statements);
      return Response.json({ ok: true, linkedRecordsRemoved: linked.length });
    }
    return fail("Ação desconhecida.");
  } catch (error) { return errorResponse(error, action); }
}
