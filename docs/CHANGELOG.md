# Changelog

Registro resumido de funcionalidades implementadas. Detalhes em [docs/features/](./features/).

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
