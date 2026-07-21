# Autenticação PocketBase (runes)

Created: 2026-07-09


> Copie este conteúdo para o body do Pull Request no GitHub.

## Resumo

Adiciona login/sessão para `apps/runes` contra o PocketBase: cookie `httpOnly`, proteção de todas as rotas (exceto `/login`), gate de troca de senha obrigatória após 10 dias, e sincronização de login/logout entre abas da mesma origem via `BroadcastChannel`.

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
- `apps/runes/src/hooks.server.ts` (novo) — sessão, `locals.user`, redirecionamentos
- `apps/runes/src/lib/server/pocketbase.ts`, `authUser.ts` (novos)
- `apps/runes/src/lib/auth/passwordGate.ts` (novo) — gate de troca de senha, testável
- `apps/runes/src/lib/validation/authSchemas.ts` (novo) — `loginSchema` (Zod)
- `apps/runes/src/lib/client/authChannel.ts` (novo) — `BroadcastChannel`
- `apps/runes/src/routes/login/+page.svelte` + `+page.server.ts` (novos)
- `apps/runes/src/routes/logout/+server.ts` (novo)
- `apps/runes/src/routes/change-password/+page.svelte` + `+page.server.ts` (novos, placeholder)
- `apps/runes/src/routes/+layout.svelte`, `+layout.server.ts` — logout na navbar, banner de troca de senha, sincronização entre abas
- `apps/runes/src/app.d.ts` — `App.Locals { pb, user }`
- `apps/runes/vite.config.ts` — `envDir`/`env.dir` para o `.env` da raiz
- `apps/runes/package.json` — deps `pocketbase`, `zod`

### Infraestrutura
- `pocketbase/pb_migrations/0004_allow_self_lookup_on_user_collection.js` (novo) — regra de API para o usuário autoconsultar o próprio registro em `user`

### Testes
- `apps/runes/src/lib/auth/passwordGate.test.ts`, `authSchemas.test.ts`, `authChannel.test.ts` (novos, unitários)
- `apps/runes/e2e/fixtures.ts` — login com a conta seed antes de cada teste (todas as rotas agora exigem auth)
- `apps/runes/e2e/auth-cross-tab.spec.ts` (novo) — AC8/AC9 com duas abas reais no mesmo contexto de navegador

## Test plan

- [x] `pnpm test`
- [x] `pnpm check`
- [x] `pnpm build`
- [x] Teste manual: `curl` com cookie jar contra PocketBase real (AC1–AC7), incluindo usuários de teste com `mustChangePassword=true` em 11 e 3 dias
- [x] Teste e2e (Playwright/Chromium real): login/logout cross-tab via `BroadcastChannel` (AC8/AC9) + suíte de todo existente sem regressão

## Documentação

- Spec: [docs/specs/2026-07-09-pocketbase-auth.md](../specs/2026-07-09-pocketbase-auth.md)
- Feature: [docs/features/2026-07-09-pocketbase-auth.md](../features/2026-07-09-pocketbase-auth.md)
- CHANGELOG: [docs/CHANGELOG.md](../CHANGELOG.md)

## Breaking changes

`apps/runes` agora exige login para acessar qualquer rota (exceto `/login`) — inclui as rotas de todo existentes (`/`, `/api/todos`, `/api/test/reset`). Requer PocketBase rodando (`pnpm backend:dev`) para dev e e2e.

## Issues / Jira

- Closes #[issue]
- Jira: [JIRA-KEY] — [docs/workflow/2026-07-09-pocketbase-auth.jira.md](./2026-07-09-pocketbase-auth.jira.md)

## Screenshots

_(opcional — telas de `/login` e `/change-password`)_
