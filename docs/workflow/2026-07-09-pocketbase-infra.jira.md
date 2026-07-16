# Infraestrutura PocketBase (Docker + coleções)

Created: 2026-07-09


## Metadados Jira

| Campo | Valor |
|-------|-------|
| Issue Type | Story |
| Priority | High |
| Labels | pocketbase, infra, docker, backend |
| Story Points | 3 |
| Jira Key | [JIRA-KEY] |
| Epic | PocketBase — autenticação e CRUD |

## Description

### Contexto

O projeto não tem backend persistente real; cada app usa gateways em memória, HTTP local ou remote functions. As próximas tarefas (autenticação, CRUD de usuário, CRUD de todo) precisam de um backend com persistência, autenticação e regras de acesso. PocketBase cobre os três em um único binário.

### Objetivo

PocketBase rodando via Docker Compose, com as coleções `auth` e `user` criadas por migration versionada, mais um script `pnpm` para subir o backend.

### Escopo

**Incluído:**
- Dockerfile do PocketBase + `docker-compose.yml`
- Migrations versionadas criando as coleções `auth` e `user`
- Migration de seed com conta admin inicial
- Scripts `pnpm backend:dev` / `pnpm backend:down`
- `.env.example`

**Fora do escopo:**
- Integração do SvelteKit com o PocketBase (task `pocketbase-auth`)
- Telas de CRUD (task `pocketbase-user-crud`)
- Coleções de todo (task `pocketbase-todo-sharing`)

## Acceptance Criteria

- [x] AC1: `pnpm backend:dev` sobe o PocketBase e responde em `http://127.0.0.1:8090/api/health`
- [x] AC2: Superusuário criado automaticamente a partir de `PB_ADMIN_EMAIL`/`PB_ADMIN_PASSWORD`
- [x] AC3: Coleções `auth` e `user` existem após o boot, sem passo manual no painel
- [x] AC4: Conta seed (`SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`, `isAdmin = true`) autentica e tem registro correspondente em `user`
- [x] AC5: Dados persistem entre reinicializações do container, sem duplicar migrations
- [x] `pnpm test` e `pnpm check` sem erros (não aplicável — sem código TS/JS de app, apenas Dockerfile/migrations/scripts)
- [x] Documentação em `docs/features/2026-07-09-pocketbase-infra.md`

## Technical Notes (Ports & Adapters — runes)

| Camada | Ação |
|--------|------|
| Docker | `pocketbase/Dockerfile` — imagem `alpine`, binário PocketBase em versão fixa, `EXPOSE 8090` |
| Orquestração | `pocketbase/docker-compose.yml` — volume `pb_data`, porta `8090:8090` |
| Schema | `pocketbase/pb_migrations/0001_create_auth_collection.js`, `0002_create_user_collection.js` |
| Seed | `pocketbase/pb_migrations/0003_seed_admin.js` |
| Monorepo | `package.json` (raiz) — scripts `backend:dev`/`backend:down` |
| Config | `.env.example` (raiz) |
| Testes | Verificação manual/health-check documentada (sem `TodoMemoryGateway` — esta task é infraestrutura, sem código de app) |

## Links

- Spec: `docs/specs/2026-07-09-pocketbase-infra.md`
- Feature doc: `docs/features/2026-07-09-pocketbase-infra.md`
- PR (após implementação): `docs/workflow/2026-07-09-pocketbase-infra.pr.md`
- Repositório: https://github.com/GBShadow/svelte-app-clean-arch

## Subtasks

- [x] Dockerfile + docker-compose
- [x] Migrations `auth` + `user`
- [x] Migration de seed
- [x] Scripts pnpm + `.env.example`
- [x] Documentação + PR
