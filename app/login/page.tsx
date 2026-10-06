import { ArrowLeft, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";

import { getSynkyUser } from "../synky-auth";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";
import { SynkyLogo, SynkySymbol } from "../synky-logo";
import "./login.css";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getSynkyUser()) redirect("/painel");

  return <main className="login-page">
    <section className="login-scene" aria-label="Profissionais colaborando em um escritório moderno">
      <div className="login-scene-content">
        <div className="login-brand"><SynkyLogo /></div>
        <div className="login-scene-copy"><span className="login-eyebrow">ESTRATÉGIA, ESTRUTURA E PESSOAS</span><h1>O trabalho de RH começa com clareza.</h1><p>Organize cargos e critérios, acompanhe prioridades e transforme decisões em ações verificáveis.</p></div>
        <div className="login-scene-bottom"><span>Planejamento</span><span>Contratações</span><span>Promoções</span><span>Resultados</span></div>
      </div>
    </section>

    <section className="login-access" aria-labelledby="login-title"><div className="login-access-inner">
      {/* Full-page navigation avoids the vinext RSC Link failure on the published site. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className="login-back"><ArrowLeft size={16} /> Página principal</a>
      <div className="login-mobile-brand"><SynkyLogo /></div>
      <SynkySymbol className="login-access-icon" />
      <span className="login-access-kicker">SEU ESPAÇO DE TRABALHO</span>
      <h2 id="login-title">Acesse o Synky Traction</h2>
      <p className="login-access-description">Entre com seu email e senha para acessar as empresas e equipes autorizadas.</p>
      <LoginForm />
      <div className="login-access-note"><LockKeyhole size={17} /><span>Seu acesso é individual. Para receber uma conta, peça a um administrador da sua empresa.</span></div>
      <div className="login-access-footer"><span><ShieldCheck size={16} /> Acesso por empresa</span><span><CheckCircle2 size={16} /> Resultados baseados em registros reais</span></div>
    </div></section>
  </main>;
}
