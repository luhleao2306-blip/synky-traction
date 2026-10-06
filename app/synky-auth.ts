import { env } from "cloudflare:workers";
import { headers } from "next/headers";

export type SynkyUser = { userId: string; email: string; displayName: string };
// Master access is pinned to an existing account ID in server configuration.
// It cannot be granted by changing an email, a company role, or browser state.
export function isMasterAdmin(user: SynkyUser) {
  const masterId = (env as typeof env & { SYNKY_MASTER_USER_ID?: string }).SYNKY_MASTER_USER_ID;
  return !!masterId && user.userId === masterId;
}
type UserRow = { id: string; email: string; name: string; password_hash: string; password_salt: string; password_iterations: number };

export const PASSWORD_ITERATIONS = 100_000;
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const encoder = new TextEncoder();

export function authDb() { if (!env.DB) throw new Error("D1 binding is unavailable"); return env.DB; }
export function normalizedEmail(value: unknown) { return typeof value === "string" ? value.trim().toLowerCase() : ""; }
export function validEmail(value: string) { return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
export function validPassword(value: unknown) { return typeof value === "string" && value.length >= 12 && value.length <= 128; }
export function sameOrigin(request: Request) { const origin = request.headers.get("origin"); return !origin || origin === new URL(request.url).origin; }

function hex(bytes: Uint8Array) { return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(""); }
function unhex(value: string) { return new Uint8Array(value.match(/.{2}/g)?.map((part) => parseInt(part, 16)) || []); }
function equalHex(a: string, b: string) {
  const left = unhex(a), right = unhex(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index++) diff |= left[index] ^ right[index];
  return diff === 0;
}
export async function sha256(value: string) { return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)))); }

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bytes = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new Uint8Array(salt).buffer as ArrayBuffer, iterations }, key, 256);
  return hex(new Uint8Array(bytes));
}

export async function newPasswordHash(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { hash: await derive(password, salt, PASSWORD_ITERATIONS), salt: hex(salt), iterations: PASSWORD_ITERATIONS };
}

export async function verifyPassword(password: string, user: Pick<UserRow, "password_hash" | "password_salt" | "password_iterations">) {
  const computed = await derive(password, unhex(user.password_salt), user.password_iterations);
  return equalHex(computed, user.password_hash);
}

export async function burnUnknownPassword(password: string) { await derive(password, new Uint8Array(16), PASSWORD_ITERATIONS); }
export function temporaryPassword() { return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(21)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, ""); }

export async function getSynkyUser(request?: Request): Promise<SynkyUser | null> {
  const cookie = request?.headers.get("cookie") || (await headers()).get("cookie") || "";
  const sessionToken = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("__Host-synky_session=") || part.startsWith("synky_session="))?.split("=").slice(1).join("=");
  if (sessionToken && /^[\w-]{40,60}$/.test(sessionToken)) {
    const sessionUser = await authDb().prepare("SELECT u.id, u.email, u.name FROM app_sessions s JOIN app_users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ? LIMIT 1")
      .bind(await sha256(sessionToken), new Date().toISOString()).first<{ id: string; email: string; name: string }>();
    if (sessionUser) return { userId: sessionUser.id, email: sessionUser.email, displayName: sessionUser.name };
  }
  const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("__Host-synky_one_access="))?.split("=").slice(1).join("=");
  if (!token || !/^[A-Za-z0-9._-]{100,4096}$/.test(token)) return null;
  let response: Response;
  try {
    response = await fetch("https://synky-hub.contato146558.chatgpt.site/api/grants/check", {
      method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ product: "traction" }), cache: "no-store",
    });
  } catch { return null; }
  if (!response.ok) return null;
  const identity = await response.json() as { email: string; name: string };
  const row = await authDb().prepare("SELECT id,email,name FROM app_users WHERE email=? LIMIT 1").bind(identity.email).first<{ id: string; email: string; name: string }>();
  return row ? { userId: row.id, email: row.email, displayName: row.name } : null;
}

export async function findUser(email: string) {
  return authDb().prepare("SELECT id, email, name, password_hash, password_salt, password_iterations FROM app_users WHERE email = ? LIMIT 1")
    .bind(email).first<UserRow>();
}

export async function createSession(userId: string) {
  const token = temporaryPassword() + temporaryPassword();
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
  await authDb().prepare("INSERT INTO app_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").bind(await sha256(token), userId, expiresAt).run();
  return token;
}

export function sessionCookie(token: string, request: Request) {
  const secure = new URL(request.url).protocol === "https:";
  return `${secure ? "__Host-synky_session" : "synky_session"}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}${secure ? "; Secure" : ""}`;
}

export function clearSessionCookie(request: Request) {
  const secure = new URL(request.url).protocol === "https:";
  return `${secure ? "__Host-synky_session" : "synky_session"}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}
