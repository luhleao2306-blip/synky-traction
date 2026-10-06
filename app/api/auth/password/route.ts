import { authDb, findUser, getSynkyUser, newPasswordHash, sameOrigin, validPassword, verifyPassword, clearSessionCookie } from "@/app/synky-auth";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Origem não autorizada." }, { status: 403 });
  const identity = await getSynkyUser(request);
  if (!identity) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  let body: { currentPassword?: unknown; newPassword?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "Dados inválidos." }, { status: 400 }); }
  if (!validPassword(body.newPassword) || typeof body.currentPassword !== "string") return Response.json({ error: "A nova senha precisa ter entre 12 e 128 caracteres." }, { status: 400 });
  const user = await findUser(identity.email);
  if (!user || !await verifyPassword(body.currentPassword, user)) return Response.json({ error: "A senha atual está incorreta." }, { status: 403 });
  const password = await newPasswordHash(body.newPassword as string);
  await authDb().batch([
    authDb().prepare("UPDATE app_users SET password_hash = ?, password_salt = ?, password_iterations = ? WHERE id = ?")
      .bind(password.hash, password.salt, password.iterations, user.id),
    authDb().prepare("DELETE FROM app_sessions WHERE user_id = ?").bind(user.id),
  ]);
  return Response.json({ ok: true }, { headers: { "set-cookie": clearSessionCookie(request), "cache-control": "no-store" } });
}
