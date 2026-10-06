import type { TractionRecord } from "./traction-model";
import { canWriteRecord } from "./traction-permissions";
import { findUser, newPasswordHash, temporaryPassword, validEmail } from "@/app/synky-auth";

type Context = { db: D1Database; user: { userId: string; email: string }; member: { role: string; email: string; area_id: string | null }; organizationId: string; records: TractionRecord[] };
const text = (v: unknown, max = 1600) => typeof v === "string" ? v.trim().slice(0, max) : "";
const fail = (error: string, status = 400) => Response.json({ error }, { status });
const dateValid = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v;

/** Employee, hiring and access changes share one atomic D1 operation. */
export async function teamOperation(body: Record<string, unknown>, ctx: Context): Promise<Response | null> {
  const action = text(body.action);
  if (!["saveTeamPerson", "hirePerson", "promotePerson"].includes(action)) return null;
  const { db, user, member, organizationId, records } = ctx;
  if (!["admin", "gestor"].includes(member.role)) return fail("Apenas administradores e gestores da área podem gerir a equipe.", 403);
  const byId = new Map(records.map(r => [r.id, r]));
  const existing = byId.get(text(body.id, 80));
  if (action !== "saveTeamPerson" && !existing) return fail("Pessoa não encontrada.", 404);
  if (body.id && (!existing || existing.kind !== "person" || existing.archived_at)) return fail("Pessoa não encontrada.", 404);
  if (existing && !canWriteRecord(member, existing, byId)) return fail("Esta pessoa pertence a outra área.", 403);
  if (action === "hirePerson" && existing?.data.type !== "Candidato") return fail("Esta contratação já foi confirmada. Consulte a Equipe.", 409);
  if (action !== "hirePerson" && existing && existing.data.type !== "Colaborador") return fail("Confirme a contratação para incluir esta pessoa na equipe.");
  if (existing && existing.version !== Number(body.version)) return fail("A pessoa foi alterada. Atualize a lista antes de salvar.", 409);
  const source = body.data && typeof body.data === "object" && !Array.isArray(body.data) ? body.data as Record<string, unknown> : {};
  const vacancy = action === "hirePerson" ? byId.get(existing!.data.vacancyId) : undefined;
  const title = action === "promotePerson" ? existing!.title : text(body.title, 160);
  const data = { ...existing?.data, type: "Colaborador", vacancyId: "", status: "Ativo", areaId: "", currentRoleId: "", startDate: "", email: "", phone: "", manager: "", notes: "", hiredFromVacancyId: existing?.data.hiredFromVacancyId || "" } as Record<string, string>;
  for (const key of ["areaId", "currentRoleId", "startDate", "email", "phone", "manager", "notes", "status"]) data[key] = source[key] === undefined ? existing?.data[key] || data[key] : text(source[key], key === "email" ? 254 : 1600);
  if (action === "hirePerson") {
    data.hiredAt = new Date().toISOString().slice(0, 10);
    data.hiredFromVacancyId = vacancy?.id || "";
    data.currentRoleId ||= vacancy?.data.roleId || "";
    data.status = "Ativo";
  }
  data.email = data.email.toLowerCase();
  const role = byId.get(data.currentRoleId);
  if (title.length < 2) return fail("Informe o nome completo.");
  if (role?.kind !== "role" || role.archived_at) return fail("Selecione um cargo ativo.");
  data.areaId = role.data.areaId;
  const area = byId.get(data.areaId);
  if (!area || area.kind !== "area" || area.archived_at) return fail("Selecione uma área ativa.");
  if (!data.startDate || !dateValid(data.startDate)) return fail("Informe uma data de entrada válida.");
  if (data.email && !validEmail(data.email)) return fail("Informe um email válido.");
  if (!["Ativo", "Afastado", "Desligado"].includes(data.status)) return fail("Selecione uma situação válida.");
  const next = { ...existing, id: existing?.id || "", kind: "person", data } as TractionRecord;
  if (!canWriteRecord(member, next, byId)) return fail("O cargo escolhido pertence a outra área.", 403);
  if (data.email && records.some(r => r.kind === "person" && r.data.type === "Colaborador" && !r.archived_at && r.id !== existing?.id && r.data.email?.toLowerCase() === data.email)) return fail("Já existe um colaborador com este email.", 409);
  if (existing?.data.email && existing.data.email !== data.email) {
    const oldAccess = await db.prepare("SELECT id FROM memberships WHERE organization_id = ? AND email = ?").bind(organizationId, existing.data.email).first();
    if (oldAccess) return fail("Remova o acesso anterior antes de alterar o email de login.", 409);
  }
  const grant = body.grantAccess === true;
  if (grant && member.role !== "admin") return fail("Apenas administradores podem liberar acesso.", 403);
  if (grant && data.status !== "Ativo") return fail("Libere acesso apenas para um colaborador ativo.");
  let temporary: string | null = null;
  const statements: D1PreparedStatement[] = [];
  const requestId = text(body.requestId, 80);
  if (!existing && !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(requestId)) return fail("Abra o cadastro novamente para iniciar.");
  const id = existing?.id || requestId;
  if (action === "promotePerson") {
    if (existing!.data.currentRoleId === data.currentRoleId) return fail("Escolha um cargo diferente para a promoção.");
    if (existing!.data.status === "Desligado") return fail("Um colaborador desligado não pode ser promovido.");
    if (text(body.reason).length < 10 || !dateValid(text(body.effectiveDate))) return fail("Informe a data da promoção e uma justificativa com pelo menos 10 caracteres.");
    if (text(body.effectiveDate) > new Date().toISOString().slice(0, 10)) return fail("Registre a promoção na data em que entrar em vigor.");
  }
  if (existing) {
    // A concurrent revision deliberately violates NOT NULL and rolls back the entire batch.
    statements.push(db.prepare("UPDATE records SET title = ?, data = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP, version = CASE WHEN version = ? AND archived_at IS NULL THEN version + 1 ELSE NULL END WHERE id = ? AND organization_id = ?")
      .bind(title, JSON.stringify(data), user.userId, existing.version, id, organizationId));
  } else statements.push(db.prepare("INSERT INTO records (id, organization_id, kind, title, data, created_by, updated_by) VALUES (?, ?, 'person', ?, ?, ?, ?)").bind(id, organizationId, title, JSON.stringify(data), user.userId, user.userId));
  if (grant) {
    if (!validEmail(data.email)) return fail("Informe o email da pessoa para criar o acesso.");
    const accessRole = text(body.accessRole, 20);
    if (!["admin", "direcao", "gestor", "responsavel", "leitor"].includes(accessRole)) return fail("Selecione uma permissão válida.");
    if (accessRole === "admin" && body.confirmAdmin !== true) return fail("Confirme que deseja conceder acesso de administrador.");
    const account = await findUser(data.email);
    const membership = await db.prepare("SELECT user_id FROM memberships WHERE organization_id = ? AND email = ?").bind(organizationId, data.email).first();
    if (membership) return fail("Esta pessoa já tem acesso. Ajuste as permissões pela Equipe.", 409);
    const userId = account?.id || crypto.randomUUID();
    if (!account) {
      temporary = temporaryPassword();
      const password = await newPasswordHash(temporary);
      statements.push(db.prepare("INSERT INTO app_users (id, email, name, password_hash, password_salt, password_iterations) VALUES (?, ?, ?, ?, ?, ?)").bind(userId, data.email, title, password.hash, password.salt, password.iterations));
    }
    statements.push(db.prepare("INSERT INTO memberships (id, organization_id, user_id, email, name, role, area_id) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), organizationId, userId, data.email, title, accessRole, ["gestor", "responsavel"].includes(accessRole) ? data.areaId : null));
    statements.push(db.prepare("INSERT INTO audit_events (id, organization_id, record_id, action, actor, after) VALUES (?, ?, ?, 'member_invited', ?, ?)").bind(crypto.randomUUID(), organizationId, id, user.userId, JSON.stringify({ email: data.email, role: accessRole })));
  }
  if (data.status === "Desligado" && (member.role !== "admin" || body.confirmOffboard !== true)) return fail("O administrador deve confirmar o desligamento e a remoção do acesso.", 403);
  if (data.email && member.role === "admin") {
    if (data.status === "Desligado") {
      const org = await db.prepare("SELECT created_by FROM organizations WHERE id = ?").bind(organizationId).first<{ created_by: string }>();
      const access = await db.prepare("SELECT user_id FROM memberships WHERE organization_id = ? AND email = ?").bind(organizationId, data.email).first<{ user_id: string | null }>();
      if (access?.user_id === org?.created_by) return fail("O proprietário deve transferir a administração antes do desligamento.", 403);
      if (body.confirmOffboard !== true) return fail("Confirme o desligamento e a remoção do acesso.");
      statements.push(db.prepare("DELETE FROM memberships WHERE organization_id = ? AND email = ?").bind(organizationId, data.email));
    } else statements.push(db.prepare("UPDATE memberships SET name = ?, area_id = CASE WHEN role IN ('gestor','responsavel') THEN ? ELSE area_id END WHERE organization_id = ? AND email = ?").bind(title, data.areaId, organizationId, data.email));
  } else if (data.status === "Desligado" && member.role !== "admin") return fail("Apenas administradores podem confirmar desligamentos.", 403);
  const auditAction = action === "hirePerson" ? "person_hired" : action === "promotePerson" ? "person_promoted" : existing ? "updated" : "created";
  statements.push(db.prepare("INSERT INTO audit_events (id, organization_id, record_id, action, actor, before, after) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), organizationId, id, auditAction, user.userId, existing ? JSON.stringify({ title: existing.title, data: existing.data }) : null, JSON.stringify({ title, data, ...(action === "promotePerson" ? { reason: text(body.reason), effectiveDate: text(body.effectiveDate) } : {}) })));
  try { await db.batch(statements); }
  catch (error) {
    if (/NOT NULL constraint failed: records.version|UNIQUE constraint/.test(String(error))) return fail("Os dados mudaram ou este cadastro já existe. Atualize a lista antes de tentar novamente.", 409);
    throw error;
  }
  return Response.json({ id, version: existing ? existing.version + 1 : 1, email: data.email, temporaryPassword: temporary, accessGranted: grant }, { status: existing ? 200 : 201, headers: { "cache-control": "no-store" } });
}
