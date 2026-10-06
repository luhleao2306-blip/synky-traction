import { authDb, burnUnknownPassword, createSession, findUser, normalizedEmail, sameOrigin, sessionCookie, sha256, validEmail, verifyPassword } from "@/app/synky-auth";

export const dynamic = "force-dynamic";
const badLogin = () => Response.json({ error: "Email ou senha incorretos." }, { status: 401, headers: { "cache-control": "no-store" } });

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Origem não autorizada." }, { status: 403 });
  let email = "";
  let password = "";
  const nativeForm = request.headers.get("content-type")?.includes("application/x-www-form-urlencoded") || request.headers.get("content-type")?.includes("multipart/form-data");
  try {
    const form = nativeForm ? await request.formData() : null;
    const body = form ? { email: form.get("email"), password: form.get("password") } : await request.json() as { email?: unknown; password?: unknown };
    email = normalizedEmail(body.email);
    password = typeof body.password === "string" ? body.password : "";
  } catch { return badLogin(); }
  if (!validEmail(email) || password.length < 1 || password.length > 128) return badLogin();
  try {
    const key = await sha256(`${email}:${request.headers.get("CF-Connecting-IP") || "unknown"}`);
    const now = Date.now();
    const attempt = await authDb().prepare("SELECT failures, window_start FROM auth_attempts WHERE key = ?").bind(key).first<{ failures: number; window_start: string }>();
    const active = attempt && now - Date.parse(attempt.window_start) < 15 * 60 * 1000;
    if (active && attempt.failures >= 8) return Response.json({ error: "Muitas tentativas. Aguarde 15 minutos e tente novamente." }, { status: 429, headers: { "cache-control": "no-store" } });
    const user = await findUser(email);
    const valid = user ? await verifyPassword(password, user) : (await burnUnknownPassword(password), false);
    if (!valid || !user) {
      await authDb().prepare("INSERT INTO auth_attempts (key, failures, window_start) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET failures = ?, window_start = ?")
        .bind(key, active ? attempt.window_start : new Date(now).toISOString(), active ? attempt.failures + 1 : 1, active ? attempt.window_start : new Date(now).toISOString()).run();
      return badLogin();
    }
    await authDb().prepare("DELETE FROM auth_attempts WHERE key = ?").bind(key).run();
    const token = await createSession(user.id);
    if (nativeForm) return new Response(null, { status: 303, headers: { location: "/painel", "set-cookie": sessionCookie(token, request), "cache-control": "no-store" } });
    return Response.json({ ok: true }, { headers: { "set-cookie": sessionCookie(token, request), "cache-control": "no-store" } });
  } catch (error) {
    console.error("auth login", error);
    return Response.json({ error: "Não foi possível entrar agora. Tente novamente." }, { status: 503 });
  }
}
