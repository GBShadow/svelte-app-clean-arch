# Changelog

Registro resumido de funcionalidades implementadas. Detalhes em [docs/features/](./features/).

## [2026-07-10] Timestamps obrigatórios em coleções PocketBase + limpeza de coleção órfã

- Backend: `pocketbase/pb_migrations/0009_add_timestamps_to_auth.js`, `0010_remove_default_users_collection.js`
- Regras: `.cursor/rules/architecture/pocketbase-collections.mdc`, `.agents/skills/pocketbase-collections.md`

A coleção `auth` não tinha os campos `created`/`updated` (autodate) presentes nas demais coleções do projeto (`todo_lists`, `todo_items`). Corrigido com uma migration retroativa que adiciona os dois campos sem alterar migrations já aplicadas. Também removida a coleção `users` — auth collection padrão de fábrica do PocketBase, nunca referenciada por nenhuma migration, seed ou código da aplicação (o projeto usa `auth` como coleção de autenticação). Nova regra sincronizada em Cursor/Freebuff/CLAUDE.md: toda coleção PocketBase deve ter `created`/`updated`, e coleções sem uso devem ser removidas via migration.

## [2026-07-10] Suíte e2e (runes) sempre headless

- App: runes (e2e)
- Config: `apps/runes/playwright.config.ts`
- Docs: [docs/testing/playwright.md](./testing/playwright.md)

`headless` era `!!process.env.CI` — localmente abria uma janela do Chromium a cada execução (herança de um problema antigo do headless-shell no WSL). Trocado para `headless: true` fixo. Validado com 2 execuções seguidas (10/10, ~28s cada, sem regressão) — o problema do headless-shell que motivou o modo com UI não se reproduziu na versão atual do Playwright/Chromium instalada.

## [2026-07-10] Suíte e2e (runes) — diagnóstico de reuso indevido do dev server

- App: runes (e2e)
- Docs: [docs/testing/playwright.md](./testing/playwright.md) (seção "Erros comuns" + "Executar")

A suíte e2e apresentou 5 falhas aparentemente desconexas (timeout em `waitForURL`, formulário de criação de usuário voltando com "Nome obrigatório." mesmo após `fill()`, edição de título de lista não refletida, sincronização de logout entre abas estourando o timeout). Causa: um `vite dev` de uma sessão anterior (`pnpm dev:runes`) ainda ocupava a porta 5175; como `playwright.config.ts` usa `reuseExistingServer: true`, o Playwright reaproveitou esse servidor de **dev** em vez de rodar `build && preview`, reintroduzindo a instabilidade de hidratação do HMR já conhecida (ver changelog de 2026-07-10 anterior). Sem nenhuma mudança de código, encerrar o processo (`lsof -i :5175` → `kill`) e rodar `pnpm test:e2e` de novo resultou em 10/10 passando, de forma repetida e ~4× mais rápido. Documentado um sinal de diagnóstico (ausência dos logs `[WebServer] [PLUGIN_TIMINGS]`/`[404] GET /favicon.ico` indica reuso de servidor pré-existente) para acelerar a identificação de casos futuros.

## [2026-07-10] Centralização de conteúdo nas telas de usuários (runes)

- App: runes
- UI: `src/routes/users/+page.svelte`, `src/routes/users/new/+page.svelte`, `src/routes/users/[id]/edit/+page.svelte`

As telas de listagem, criação e edição de usuários não tinham `mx-auto`/`max-w-*` no wrapper raiz e ficavam esticadas (ou desalinhadas à esquerda) na largura total do `<main class="container mx-auto p-4">` do layout. Corrigido aplicando o mesmo padrão já usado em `todos/*`: wrapper raiz sempre com `mx-auto w-full max-w-*` (lista de usuários em `max-w-3xl`, formulários de novo/editar usuário em `max-w-lg`, igual aos formulários de todo). Esse é agora o padrão obrigatório para qualquer nova página: todo `+page.svelte` deve centralizar seu conteúdo com `mx-auto w-full max-w-*` no elemento raiz (exceção: páginas de auth com `hero`, que já centralizam via daisyUI, e a home `/`, que centraliza via flexbox). Verificado visualmente em 1440px e via suíte e2e (10/10).

## [2026-07-10] App Hub — tela inicial com grid de aplicativos (runes)

- App: runes
- Dependência: `apps/runes/package.json` — `lucide-svelte`
- Registro: `apps/runes/src/lib/appRegistry.ts`
- Componentes: `AppCard.svelte`, `AppGrid.svelte`
- Rotas: `+page.svelte`, `+page.server.ts` (home substitui redirect para `/todos`)
- Layout: `+layout.svelte` (navbar "❯ hub", links diretos removidos)
- Docs: [docs/features/app-hub.md](./features/app-hub.md)

Home screen (`/`) com saudação "Olá, {nome}!" e grid responsivo de cards de apps. Cards com ícone lucide-svelte, nome, descrição e badge de contador de itens pendentes do Todo. Navbar simplificada para apenas logo "❯ hub" (link para `/`), nome do usuário e logout. Cards administrativos renderizados condicionalmente (`adminOnly`). Layout das telas de todo centralizado com `mx-auto + max-w-*`.

## [2026-07-10] Tema Dracula + redesign visual (runes)

- App: runes (somente UI)
- Config: `apps/runes/src/app.css` (tema + tipografia), `apps/runes/src/app.html` (fontes)
- UI: `src/lib/components/icons/` (novo), `+layout.svelte`, `UserList.svelte`, `ChangePasswordForm.svelte`, rotas de `login`, `todos`, `users`, `change-password`
- Docs: [docs/features/dracula-theme.md](./features/dracula-theme.md)

Tema `dracula` do daisyUI aplicado via `@plugin "daisyui" { themes: dracula --default; }` (sintaxe confirmada na doc oficial). Par tipográfico dedicado (Space Grotesk nos títulos, Manrope no corpo, JetBrains Mono em badges/dados/estados vazios/wordmark), ícones SVG inline aditivos nos botões de ação (nunca substituindo texto), cards com borda fina em vez de sombra pesada, tabela de usuários com zebra, estados vazios com voz mais ativa, e a marca do app na navbar redesenhada como prompt de terminal (`❯ todo.apps`) — o elemento de assinatura que conecta a herança "dracula = editor de código" ao produto. Todos os `data-testid` e accessible names preservados; suíte e2e (10/10) usada como prova.

## [2026-07-10] Correção dos testes e2e + endurecimento de segurança (runes)

- App: runes (e2e) + backend PocketBase
- Config: `apps/runes/playwright.config.ts`, `package.json` (raiz)
- E2E: `e2e/env.ts` (novo), `e2e/cleanup.ts` (novo), `fixtures.ts`, todos os `*.spec.ts` (`todo-sharing` → `todo-crud-basico`)
- Segurança: `apps/runes/src/routes/change-password/+page.server.ts`, `pocketbase/docker-entrypoint.sh`, `pocketbase/docker-compose.yml`
- Docs: [docs/features/e2e-test-fix-plan.md](./features/e2e-test-fix-plan.md)

Os 10 testes e2e quebravam porque o teste antigo de troca de senha envenenava o admin seed. Corrigido: change-password usa usuário temporário; `webServer` passou a `build && preview` (o dev server deixava a hidratação instável e submetia forms vazios); guard fail-fast do seed na fixture; cleanup via API do PocketBase agora limpa `user`+`auth` e não engole falhas. Revisão de segurança encontrou e fechou um bypass da senha atual na troca de senha (o `manageRule` do PocketBase dispensa `oldPassword` para admins) via reautenticação explícita, e o entrypoint do PocketBase passou a recusar subir com a senha de exemplo. Suíte: 10/10, idempotente, sem resíduo no banco.

## [2026-07-09] Descontinuação dos apps classic e remote

- Os apps `classic` e `remote` foram movidos de `apps/` para `deprecated/`
- Toda nova funcionalidade deve seguir apenas o app `runes`
- Workspace configurado apenas com `apps/runes` e `packages/*`
- Documentação, regras Cursor e skills Freebuff atualizadas

## [2026-07-09] Todo multi-lista com compartilhamento (runes)

- App: runes
- Rotas: `/todos`, `/todos/new`, `/todos/[id]` (substituem a lista global antiga)
- Infra: `pocketbase/pb_migrations/0008_create_todo_collections.js`
- Docs: [docs/features/pocketbase-todo-sharing.md](./features/pocketbase-todo-sharing.md)

Cada usuário gerencia várias listas próprias; lista com `public = true` fica visível (somente leitura) para qualquer usuário autenticado com o link. Escrita bloqueada para não-donos em duas camadas (API Rules do PocketBase + checagem server-side no SvelteKit), testado inclusive com chamadas diretas à API do PocketBase. A lista global antiga do runes (sem dono) foi removida; `classic`/`remote` não foram alterados. Completa o backlog de specs PocketBase (infra → auth → user-crud → todo-sharing).

## [2026-07-09] CRUD de usuário (runes)

- App: runes
- Rotas: `/users`, `/users/new`, `/users/[id]/edit`, `/change-password` (funcional)
- Infra: `pocketbase/pb_migrations/0005_user_auth_rules.js`, `0006_fix_seed_admin_email_visibility.js`, `0007_restrict_self_update_fields.js`
- Docs: [docs/features/pocketbase-user-crud.md](./features/pocketbase-user-crud.md)

Admin cria, lista, edita e exclui usuários (auth+user sincronizados, com compensação em falha parcial); usuário comum edita o próprio nome/cargo e troca a própria senha; reset de senha pelo admin aciona o gate de troca obrigatória de `pocketbase-auth`. Base para o todo multi-lista com compartilhamento (próxima spec).

Revisão de segurança encontrou uma falha de privilege escalation na `auth.updateRule` (usuário comum conseguia se auto-promover a admin chamando a API do PocketBase diretamente) — corrigida na mesma entrega via `0007_restrict_self_update_fields.js`.

## [2026-07-09] Autenticação PocketBase (runes)

- App: runes
- Server: `apps/runes/src/hooks.server.ts`, `apps/runes/src/lib/server/pocketbase.ts`
- Rotas: `/login`, `/logout`, `/change-password`
- Infra: `pocketbase/pb_migrations/0004_allow_self_lookup_on_user_collection.js`
- Docs: [docs/features/pocketbase-auth.md](./features/pocketbase-auth.md)

Login/sessão via cookie `httpOnly` para `apps/runes`, com todas as rotas protegidas (exceto `/login`), gate de troca de senha obrigatória após 10 dias e sincronização de login/logout entre abas via `BroadcastChannel`. Base para CRUD de usuário e todo multi-lista (specs seguintes).

## [2026-07-09] Infraestrutura PocketBase

- App: — (infraestrutura, sem app SvelteKit ainda)
- Docker: `pocketbase/Dockerfile`, `pocketbase/docker-compose.yml`
- Schema: `pocketbase/pb_migrations/0001_create_auth_collection.js`, `0002_create_user_collection.js`, `0003_seed_admin.js`
- Docs: [docs/features/pocketbase-infra.md](./features/pocketbase-infra.md)

PocketBase rodando via Docker Compose com coleções `auth`/`user` criadas por migration, superusuário e conta de aplicação semeados automaticamente (`pnpm backend:dev`). Base para autenticação, CRUD de usuário e todo multi-lista (specs seguintes).

## [2026-07-09] Subagente spec-driven

- App: — (agente de processo, `.claude/agents/`)
- Agente: `.claude/agents/spec-driven.md`
- Docs: [docs/features/spec-driven-agent.md](./features/spec-driven-agent.md)

Subagente que conduz o fluxo spec → Jira → (pausa) → feature doc → PR conversacionalmente, seguindo os templates de `docs/specs/`, `docs/workflow/` e `docs/features/`, sem escrever código de produto nem executar `git commit`/`git push`/`gh pr create`.

## [2026-06-18] Todo List (projeto base)

- App: classic, remote, runes
- Domínio: `packages/todo-domain/src/observable/`, `packages/todo-domain/src/gateways/`
- Docs: [docs/features/todo-list.md](./features/todo-list.md)

Implementação inicial do CRUD de tarefas com Ports & Adapters: Observable/Observer (classic/remote), runes (runes app), gateways Memory/Http/Remote e API REST.
