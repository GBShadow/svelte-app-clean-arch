# Infraestrutura PocketBase (Docker + coleções)

Created: 2026-07-09


> Copie este conteúdo para o body do Pull Request no GitHub.

## Resumo

Adiciona o PocketBase como backend persistente do monorepo, rodando via Docker Compose. As coleções `auth` (tipo auth nativo) e `user` (tipo base) são criadas por migrations versionadas, com superusuário e uma conta de aplicação semeados automaticamente no boot. Base para autenticação, CRUD de usuário e todo multi-lista nas próximas specs.

## Tipo de mudança

- [x] Nova funcionalidade
- [ ] Correção de bug
- [ ] Refatoração
- [ ] Documentação
- [ ] Chore / tooling

## Alterações

### Domínio
- Não aplicável — sem mudança em `packages/todo-domain`.

### App(s)
- Não aplicável — sem mudança em `apps/classic`, `apps/remote` ou `apps/runes` (integração fica para a spec `pocketbase-auth`).

### Infraestrutura
- `pocketbase/Dockerfile` (novo) — Alpine + binário PocketBase v0.39.5
- `pocketbase/docker-entrypoint.sh` (novo) — `superuser upsert` + `serve`
- `pocketbase/docker-compose.yml` (novo) — serviço `pocketbase`, volume `pb_data`, porta `8090`
- `pocketbase/pb_migrations/0001_create_auth_collection.js` (novo)
- `pocketbase/pb_migrations/0002_create_user_collection.js` (novo)
- `pocketbase/pb_migrations/0003_seed_admin.js` (novo)
- `package.json` (raiz) — scripts `backend:dev`/`backend:down`
- `.env.example` (raiz, novo) — `PB_ADMIN_EMAIL`, `PB_ADMIN_PASSWORD`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `PUBLIC_POCKETBASE_URL`

### Testes
- Validação manual ponta a ponta com Docker real (build + run + restart) — sem `TodoMemoryGateway` aplicável, pois não é código de domínio.

## Test plan

- [ ] `pnpm test` (não aplicável — sem código TS/JS de app nesta PR)
- [ ] `pnpm check` (não aplicável — sem código TS/JS de app nesta PR)
- [ ] `pnpm build` (não aplicável — sem código TS/JS de app nesta PR)
- [x] Teste manual: `docker build` + `docker run` + `curl /api/health` + login superusuário + login conta seed + `GET /api/collections/user/records` + `docker restart` (sem duplicar seed/migrations)

## Documentação

- Spec: [docs/specs/2026-07-09-pocketbase-infra.md](../specs/2026-07-09-pocketbase-infra.md)
- Feature: [docs/features/2026-07-09-pocketbase-infra.md](../features/2026-07-09-pocketbase-infra.md)
- CHANGELOG: [docs/CHANGELOG.md](../CHANGELOG.md)

## Breaking changes

Nenhuma.

## Issues / Jira

- Closes #[issue]
- Jira: [JIRA-KEY] — [docs/workflow/2026-07-09-pocketbase-infra.jira.md](./2026-07-09-pocketbase-infra.jira.md)

## Screenshots

_(não aplicável — sem UI)_
