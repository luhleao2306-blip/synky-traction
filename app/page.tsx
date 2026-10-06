import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import { SynkyLogo } from "./synky-logo";
import { LandingHeader } from "./landing-header";
import { LandingPreview, LandingQuestions } from "./traction-landing-interactive";
import { LandingBrandDemo } from "./landing-brand-demo";
import "./traction-landing.css";

export const metadata: Metadata = {
  title: "Synky Traction — Cargos, contratações e desenvolvimento em um só painel",
  description: "Estruture cargos, conduza contratações e acompanhe a evolução das pessoas no Synky Traction.",
};

export default function Home() {
  return <div className="traction-landing">
    <link rel="preload" as="image" href="/traction-hero-meeting-v2.webp" fetchPriority="high" />
    <a className="lp-skip" href="#conteudo">Ir para o conteúdo</a>
    <LandingHeader />
    <main id="conteudo">
      <section className="lp-hero" id="inicio" aria-labelledby="lp-main-title">
        <div className="lp-container lp-hero-layout">
          <div className="lp-hero-intro">
            <span className="lp-eyebrow">UM LUGAR PARA DECIDIR COM MAIS CLAREZA</span>
            <h1 id="lp-main-title">Contrate e promova <em>com critério.</em></h1>
            <p>Do desenho dos cargos à decisão sobre cada pessoa. Tudo conectado em um só painel.</p>
            <div className="lp-hero-actions">
              <a className="lp-primary" href="/previa">Ver prévia do sistema <ArrowRight size={18} aria-hidden="true" /></a>
              <a className="lp-hero-secondary" href="/acessar">Acessar painel <span aria-hidden="true">→</span></a>
            </div>
          </div>
          <div className="lp-hero-art">
            <img className="lp-hero-still" src="/traction-hero-meeting-v2.webp" alt="Equipe reunida à mesa enquanto um profissional apresenta o Synky Traction em uma única TV" width={1672} height={941} fetchPriority="high" />
          </div>
        </div>
      </section>

      <section className="lp-discover" id="como-funciona" aria-labelledby="lp-discover-title"><div className="lp-container">
        <div className="lp-discover-heading"><div><span className="lp-eyebrow">EXPLORE O SYNKY</span><h2 id="lp-discover-title">Do primeiro cargo ao <em>próximo passo.</em></h2></div><p>Escolha uma parte do sistema para conhecer.</p></div>
        <div className="lp-discover-grid">
          <a className="lp-discover-card" href="#etapas"><div className="lp-discover-image"><img src="/traction-cover-meeting.jpg" width={1920} height={1080} alt="Equipe conversando em uma sala de trabalho" loading="lazy" decoding="async" /></div><div className="lp-discover-copy"><span>01 <i aria-hidden="true" /> ESTRUTURA</span><h3>Estruture o trabalho</h3><p>Áreas, cargos e critérios claros.</p><span className="lp-discover-arrow" aria-hidden="true"><ArrowRight size={20} /></span></div></a>
          <a className="lp-discover-card" href="/previa"><div className="lp-discover-image"><img src="/traction-hero-real.webp" width={1920} height={1080} alt="Profissionais conversando em um escritório" loading="lazy" decoding="async" /></div><div className="lp-discover-copy"><span>02 <i aria-hidden="true" /> PAINEL</span><h3>Conheça o painel</h3><p>Navegue pelas áreas do sistema.</p><span className="lp-discover-arrow" aria-hidden="true"><ArrowRight size={20} /></span></div></a>
          <a className="lp-discover-card" href="#resultados"><div className="lp-discover-image"><img src="/traction-office-discussion.jpg" width={1800} height={1200} alt="Profissionais conversando em frente a um computador" loading="lazy" decoding="async" /></div><div className="lp-discover-copy"><span>03 <i aria-hidden="true" /> RESULTADOS</span><h3>Entenda os resultados</h3><p>Leia o que os registros da equipe mostram.</p><span className="lp-discover-arrow" aria-hidden="true"><ArrowRight size={20} /></span></div></a>
        </div>
      </div></section>

      <section className="lp-flow" id="etapas" aria-labelledby="lp-flow-title"><div className="lp-container">
        <div className="lp-flow-heading"><span className="lp-eyebrow">COMO O TRABALHO ACONTECE</span><h2 id="lp-flow-title">O caminho entre <em>entender um cargo</em> e tomar uma decisão.</h2><p>Uma estrutura clara dá contexto a cada contratação, avaliação e promoção.</p></div>
        <ol className="lp-flow-list">
          <li><span>01</span><div><h3>Desenhe a estrutura</h3><p>Áreas, cargos, responsabilidades e competências no mesmo lugar.</p></div></li>
          <li><span>02</span><div><h3>Reúna as evidências</h3><p>Compare candidatos e colaboradores com os critérios do cargo.</p></div></li>
          <li><span>03</span><div><h3>Registre a decisão</h3><p>Guarde o motivo, o responsável e o próximo passo de cada pessoa.</p></div></li>
        </ol>
      </div></section>

      <section className="lp-system-section" id="sistema">
        <div className="lp-container">
          <div className="lp-section-heading"><div><span className="lp-eyebrow">POR DENTRO DO SYNKY</span><h2>Um painel para o <em>trabalho real.</em></h2></div><p>Escolha uma área e veja a tela do sistema. <a href="/previa">Explorar o painel</a></p></div>
          <LandingPreview />
        </div>
      </section>

      <section className="lp-results-section" id="resultados"><div className="lp-container">
        <div className="lp-section-heading"><div><span className="lp-eyebrow">RESULTADOS SEM ACHISMO</span><h2>O que foi registrado vira <em>visão para agir.</em></h2></div><p>Os relatórios usam somente os registros da sua empresa.</p></div>
        <div className="lp-plan-grid">
          <article><span className="lp-eyebrow">ACESSO GRATUITO</span><h3>Resumo essencial</h3><p>Indicadores principais e uma síntese curta do que sua empresa registrou.</p></article>
          <article className="lp-plan-full"><span className="lp-eyebrow">ACESSO COMPLETO</span><h3>Análise aprofundada</h3><ul><li><Check size={17} /> Estrutura, cargos e execução</li><li><Check size={17} /> Avaliações e desenvolvimento</li><li><Check size={17} /> Riscos, decisões e histórico</li></ul><span className="lp-plan-note">A profundidade depende dos registros e do acesso contratado.</span></article>
        </div>
      </div></section>

      <section className="lp-brand-section" id="marca" aria-labelledby="lp-brand-title"><div className="lp-container lp-brand-inner">
        <div className="lp-brand-copy"><span className="lp-eyebrow">IDENTIDADE DA EMPRESA</span><h2 id="lp-brand-title">O painel com a cara <em>da sua empresa.</em></h2><p>Coloque sua logo, escolha as cores e defina quem pode acessar cada área.</p><a href="/acessar">Personalizar no painel <ArrowRight size={18} aria-hidden="true" /></a></div>
        <LandingBrandDemo />
      </div></section>
      <section className="lp-faq-section" id="duvidas" aria-labelledby="lp-faq-title"><div className="lp-container"><div className="lp-faq-heading"><div><span className="lp-eyebrow">DÚVIDAS FREQUENTES</span><h2 id="lp-faq-title">O que você precisa <em>saber antes de começar.</em></h2></div><p>Respostas diretas sobre acesso, decisões e resultados.</p></div><LandingQuestions /></div></section>
      <section className="lp-final" id="final" aria-labelledby="lp-final-title"><div className="lp-container">
        <div className="lp-final-main">
          <div className="lp-final-copy"><span className="lp-eyebrow">DO PLANEJAMENTO À DECISÃO</span><h2 id="lp-final-title">Do cargo à decisão.<br /><em>Tudo conectado.</em></h2><p>Estruture o trabalho, reúna as evidências e acompanhe cada próximo passo em um só lugar.</p></div>
          <div className="lp-final-action"><span>SEU ESPAÇO DE TRABALHO</span><p>Continue no painel da sua empresa.</p><a className="lp-primary" href="/acessar">Entrar no painel <ArrowRight size={19} aria-hidden="true" /></a><a className="lp-final-secondary" href="#como-funciona">Entender como funciona <span aria-hidden="true">↗</span></a></div>
        </div>
        <div className="lp-final-path" aria-label="Etapas do Synky Traction"><div><span>01</span><strong>Estruture cargos</strong></div><div><span>02</span><strong>Compare com critérios</strong></div><div><span>03</span><strong>Acompanhe decisões</strong></div></div>
      </div></section>
    </main>
    <footer className="lp-footer" id="rodape"><div className="lp-container">
      <div className="lp-footer-main">
        <div className="lp-footer-brand"><a href="#inicio" aria-label="Synky Traction — voltar ao início"><SynkyLogo /></a><p>Um lugar para estruturar cargos, conduzir contratações e acompanhar a evolução das pessoas.</p></div>
        <nav aria-label="Explorar o site"><strong>Explore</strong><a href="#como-funciona">Como funciona</a><a href="#sistema">O painel</a><a href="#resultados">Resultados</a></nav>
        <nav aria-label="Mais informações"><strong>Mais informações</strong><a href="#marca">Marca da empresa</a><a href="#duvidas">Dúvidas frequentes</a><a href="/acessar">Acessar o painel</a></nav>
      </div>
      <div className="lp-footer-bottom"><span>Synky Traction</span><span>Estrutura e contexto para decisões de pessoas.</span><a href="#inicio">Voltar ao início <span aria-hidden="true">↑</span></a></div>
    </div></footer>
  </div>;
}




