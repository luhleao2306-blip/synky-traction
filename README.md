# Synky Traction

Plataforma de gestão para conectar estrutura da empresa, pessoas, planejamento e execução.

## O projeto

- Landing page de apresentação e prévia pública.
- Login por email e senha, sessões e permissões por empresa.
- Dashboard e central de empresas para a administração master.
- Plano do ciclo: objetivos, prioridades, iniciativas, responsáveis e prazos.
- Reuniões e decisões: pautas, compromissos e histórico.
- Resultados: metas, valores registrados e evidências do período.
- Áreas e cargos: responsabilidades, competências e critérios.
- Contratações: vagas, candidaturas, entrevistas e avaliações.
- Evolução interna: avaliações de promoção e planos de desenvolvimento.
- Administração: empresa, identidade visual, pessoas, acessos e arquivo de dados.
- Boas práticas: orientação para começar e usar os módulos.

As decisões de contratação e promoção permanecem com a equipe responsável. O repositório contém o código e os recursos visuais; registros de empresas, contas, sessões, senhas e arquivos enviados pelos clientes ficam fora do GitHub.

## Tecnologias

React 19, TypeScript, Vinext/Vite, Tailwind CSS, componentes Radix, Cloudflare Workers, D1, R2 e Drizzle.

## Desenvolvimento local

Requer Node.js 22.13 ou superior e npm.

```sh
npm ci
npm run dev
```

Abra o endereço local mostrado no terminal. O desenvolvimento usa armazenamento local isolado; clonar o projeto não copia o banco de produção nem cria acesso de administrador.

```sh
npx tsc --noEmit --incremental false
npm run build
```

A aplicação inclui autenticação própria por email e senha. O runtime de desenvolvimento também oferece simulação local de autenticação de Sites, descrita em [docs/RUNTIME.md](docs/RUNTIME.md). As duas formas de autenticação não são a mesma conta.

## Estrutura

| Diretório | Conteúdo |
| --- | --- |
| `app/` | Páginas, módulos, interfaces e rotas da API |
| `components/` | Componentes de interface |
| `lib/` | Modelos, permissões, identidade visual e regras do sistema |
| `db/` e `drizzle/` | Esquema e migrações do banco |
| `public/` | Logos, fontes, imagens e vídeos usados pelo site |
| `assets/` | Recursos de origem utilizados na produção visual |
| `scripts/` | Rotinas de desenvolvimento e build |
| `.openai/hosting.json` | Vínculo com o projeto existente em Sites |

## Publicação e configuração

O site existente é publicado em Sites com bindings `DB` (D1) e `BUCKET` (R2). As migrações estão em `drizzle/`. A configuração de acesso master utiliza `SYNKY_MASTER_USER_ID`, definida apenas no ambiente de execução. Nenhum valor real dessa configuração está incluído aqui.

Para executar em outra infraestrutura, configure os bindings, migrações, armazenamento, variáveis e integração de autenticação exigidos pelo runtime. O envio para o GitHub não publica o sistema no GitHub Pages nem migra os dados de produção.

- Site: https://synky-traction.contato146558.chatgpt.site/
- Painel: https://synky-traction.contato146558.chatgpt.site/painel
- Créditos dos recursos visuais: [ASSET-CREDITS.md](ASSET-CREDITS.md)
- Detalhes do runtime: [docs/RUNTIME.md](docs/RUNTIME.md)

## Origem desta cópia

Código exportado do projeto Synky Traction em 6 de outubro de 2026, a partir do commit `3b8de1b72c7b8630ee6b62cbf59485809b5f0da9`. Os títulos e frases de apoio revisados dos módulos estão incluídos.
