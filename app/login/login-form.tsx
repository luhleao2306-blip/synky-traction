"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setLoading(true);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }), credentials: "same-origin" });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        throw new Error(result.error || "Não foi possível entrar.");
      }
      window.location.assign("/painel");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível entrar."); setLoading(false); }
  }
  return <form className="login-form" method="post" action="/api/auth/login" onSubmit={submit}>
    <label htmlFor="login-email">Email</label>
    <input id="login-email" type="email" name="email" autoComplete="username" inputMode="email" placeholder="voce@empresa.com" value={email} onChange={(event) => setEmail(event.target.value)} required autoFocus />
    <label htmlFor="login-password">Senha</label>
    <div className="login-password-wrap"><input id="login-password" type={showPassword ? "text" : "password"} name="password" autoComplete="current-password" placeholder="Digite sua senha" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>
    {error && <p className="login-error" role="alert">{error}</p>}
    <button className="login-primary" type="submit" disabled={loading}>{loading ? "Entrando…" : "Entrar no painel"}<ArrowRight size={19} /></button>
  </form>;
}
