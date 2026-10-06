import { authDb, findUser, newPasswordHash, temporaryPassword } from "@/app/synky-auth";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (request.headers.get("origin") !== "https://synky-hub.contato146558.chatgpt.site") return new Response("Origem inválida.", { status: 403 });
  let token: FormDataEntryValue | null;
  try { token = (await request.formData()).get("access_token"); } catch { return new Response("Acesso inválido.", { status: 400 }); }
  if (typeof token !== "string" || !/^[A-Za-z0-9._-]{100,4096}$/.test(token)) return new Response("Acesso inválido.", { status: 400 });
  let response: Response;
  try { response = await fetch("https://synky-hub.contato146558.chatgpt.site/api/grants/check", {
    method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ product: "traction" }), cache: "no-store",
  }); } catch { return new Response("Não foi possível verificar seu acesso.", { status: 503 }); }
  if (!response.ok) return Response.redirect("https://synky-hub.contato146558.chatgpt.site/painel", 303);
  const identity = await response.json() as { email: string; name: string };
  if (!await findUser(identity.email)) {
    const secret = await newPasswordHash(temporaryPassword());
    await authDb().prepare("INSERT OR IGNORE INTO app_users(id,email,name,password_hash,password_salt,password_iterations) VALUES(?,?,?,?,?,?)")
      .bind(crypto.randomUUID(), identity.email, identity.name, secret.hash, secret.salt, secret.iterations).run();
  }
  const cookie = `__Host-synky_one_access=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`;
  return new Response(null, { status: 303, headers: { location: "/painel", "set-cookie": cookie, "cache-control": "no-store", "referrer-policy": "no-referrer" } });
}
