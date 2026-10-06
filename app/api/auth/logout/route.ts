import { authDb, clearSessionCookie, sameOrigin, sha256 } from "@/app/synky-auth";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Origem não autorizada." }, { status: 403 });
  const cookie = request.headers.get("cookie") || "";
  const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("__Host-synky_session=") || part.startsWith("synky_session="))?.split("=").slice(1).join("=");
  if (token) await authDb().prepare("DELETE FROM app_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  const headers = new Headers({ "cache-control": "no-store" });
  headers.append("set-cookie", clearSessionCookie(request));
  headers.append("set-cookie", "__Host-synky_one_access=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
  return Response.json({ ok: true }, { headers });
}
