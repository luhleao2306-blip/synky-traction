import { env } from "cloudflare:workers";
import { getSynkyUser, sameOrigin, isMasterAdmin } from "@/app/synky-auth";
import { readBrandLogo } from "@/lib/traction-logo";

export const dynamic = "force-dynamic";

type BrandRow = { brand_logo_key: string | null; brand_logo_type: string | null };

function fail(message: string, status = 400) { return Response.json({ error: message }, { status }); }
function db() { if (!env.DB) throw new Error("D1 binding is unavailable"); return env.DB; }
function bucket() { return (env as typeof env & { BUCKET?: R2Bucket }).BUCKET; }
async function access(organizationId: string, userId: string, email: string) {
  if (isMasterAdmin({ userId, email, displayName: "" })) {
    return db().prepare("SELECT 'admin' AS role, brand_logo_key, brand_logo_type FROM organizations WHERE id = ? LIMIT 1").bind(organizationId).first<BrandRow & { role: string }>();
  }
  return db().prepare("SELECT m.role, o.brand_logo_key, o.brand_logo_type FROM memberships m JOIN organizations o ON o.id = m.organization_id WHERE m.organization_id = ? AND (m.user_id = ? OR m.email = ?) LIMIT 1")
    .bind(organizationId, userId, email.toLowerCase()).first<BrandRow & { role: string }>();
}
export async function GET(request: Request) {
  const user = await getSynkyUser(request);
  if (!user) return fail("Entre na sua conta para continuar.", 401);
  const organizationId = new URL(request.url).searchParams.get("organizationId") || "";
  if (!organizationId) return fail("Escolha uma empresa.");
  try {
    const member = await access(organizationId, user.userId, user.email);
    if (!member) return fail("Acesso não autorizado a esta empresa.", 403);
    if (!member.brand_logo_key) return fail("Esta empresa ainda não tem logo.", 404);
    const object = await bucket()?.get(member.brand_logo_key);
    if (!object) return fail("Logo indisponível.", 404);
    return new Response(object.body, { headers: { "content-type": member.brand_logo_type || "image/png", "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
  } catch (error) { console.error("brand GET", error); return fail("Não foi possível abrir a logo.", 503); }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Origem não autorizada.", 403);
  const user = await getSynkyUser(request);
  if (!user) return fail("Entre na sua conta para continuar.", 401);
  try {
    const form = await request.formData();
    const organizationId = String(form.get("organizationId") || "").slice(0, 80);
    const action = String(form.get("action") || "upload");
    const member = await access(organizationId, user.userId, user.email);
    if (!member) return fail("Acesso não autorizado a esta empresa.", 403);
    if (member.role !== "admin") return fail("Apenas administradores podem alterar a logo.", 403);
    const storage = bucket();
    if (!storage) return fail("Armazenamento de imagens indisponível.", 503);
    if (action === "remove") {
      await db().batch([
        db().prepare("UPDATE organizations SET brand_logo_key = NULL, brand_logo_type = NULL WHERE id = ?").bind(organizationId),
        db().prepare("INSERT INTO audit_events (id, organization_id, action, actor) VALUES (?, ?, 'brand_logo_removed', ?)").bind(crypto.randomUUID(), organizationId, user.userId),
      ]);
      if (member.brand_logo_key) try { await storage.delete(member.brand_logo_key); } catch (error) { console.error("brand cleanup", error); }
      return Response.json({ ok: true });
    }
    if (action !== "upload") return fail("Ação inválida.");
    const image = await readBrandLogo(form.get("logo"));
    if ("error" in image) return fail(image.error);
    const { bytes, contentType } = image;
    const key = `organizations/${organizationId}/logos/${crypto.randomUUID()}`;
    await storage.put(key, bytes, { httpMetadata: { contentType } });
    try {
      await db().batch([
        db().prepare("UPDATE organizations SET brand_logo_key = ?, brand_logo_type = ? WHERE id = ?").bind(key, contentType, organizationId),
        db().prepare("INSERT INTO audit_events (id, organization_id, action, actor, after) VALUES (?, ?, 'brand_logo_updated', ?, ?)").bind(crypto.randomUUID(), organizationId, user.userId, JSON.stringify({ contentType, size: bytes.length })),
      ]);
    } catch (error) { await storage.delete(key); throw error; }
    if (member.brand_logo_key) try { await storage.delete(member.brand_logo_key); } catch (error) { console.error("brand cleanup", error); }
    return Response.json({ ok: true });
  } catch (error) { console.error("brand POST", error); return fail("Não foi possível salvar a logo.", 503); }
}
