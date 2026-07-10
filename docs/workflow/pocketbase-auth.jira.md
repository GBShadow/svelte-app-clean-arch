# Autenticação PocketBase (runes)

## Metadados Jira

| Campo | Valor |
|-------|-------|
| Issue Type | Story |
| Priority | High |
| Labels | pocketbase, auth, runes, sveltekit |
| Story Points | 5 |
| Jira Key | [JIRA-KEY] |
| Epic | PocketBase — autenticação e CRUD |

## Description

### Contexto

Com o backend PocketBase disponível, o app `apps/runes` precisa de login, sessão e proteção de rotas antes de qualquer CRUD poder existir. Hoje `apps/runes` não tem nenhum conceito de usuário logado.

### Objetivo

Usuário loga em `/login`, sessão persiste via cookie, rotas não-públicas exigem login, `/login` fica inacessível para quem já está autenticado, e login/logout propagam entre abas via `BroadcastChannel`.

### Escopo

**Incluído:**
- Client PocketBase server-side
- `hooks.server.ts` com proteção de rota e gate de troca de senha
- Página `/login` (form action + Zod)
- Logout
- Propagação de login/logout entre abas (`BroadcastChannel`)

**Fora do escopo:**
- Telas de CRUD de usuário (task `pocketbase-user-crud`)
- Cadastro público (não existe)
- CRUD de todo (task `pocketbase-todo-sharing`)

## Acceptance Criteria

- [x] AC1: Usuário não autenticado acessando `/` é redirecionado para `/login`
- [x] AC2: Login com credenciais válidas autentica e redireciona para `/`
- [x] AC3: Login com credenciais inválidas mostra erro em português, sem sair de `/login`
- [x] AC4: Usuário autenticado acessando `/login` é redirecionado para `/`
- [x] AC5: Logout limpa a sessão e redireciona para `/login`
- [x] AC6: `mustChangePassword = true` há mais de 10 dias bloqueia navegação fora de `/change-password`
- [x] AC7: `mustChangePassword = true` dentro de 10 dias permite navegação normal com aviso disponível para a UI
- [x] AC8: Login em uma aba tira as demais abas de `/login` automaticamente
- [x] AC9: Logout em uma aba desloga as demais abas automaticamente
- [x] Testes com `TodoMemoryGateway`/fakes cobrindo os cenários acima (unitários com lógica pura + e2e Playwright com PocketBase real)
- [x] `pnpm test` e `pnpm check` sem erros
- [x] Documentação em `docs/features/pocketbase-auth.md`

## Technical Notes (Ports & Adapters — runes)

| Camada | Ação |
|--------|------|
| Dependência | `apps/runes/package.json` — SDK `pocketbase` |
| Server | `apps/runes/src/lib/server/pocketbase.ts` — client por request |
| Hooks | `apps/runes/src/hooks.server.ts` — sessão, `locals.user`, redirecionamentos |
| UI/Server | `apps/runes/src/routes/login/+page.svelte` + `+page.server.ts` |
| Server | `apps/runes/src/routes/logout/+server.ts` |
| UI/Server | `apps/runes/src/routes/change-password/+page.svelte` + `+page.server.ts` (placeholder) |
| Validação | `apps/runes/src/lib/validation/authSchemas.ts` (Zod) |
| Client | `apps/runes/src/lib/client/authChannel.ts` (`BroadcastChannel`) |
| UI | `apps/runes/src/routes/+layout.svelte` — assina canal, `invalidateAll()` |
| Testes | `*.test.ts` com fakes para `pb` (sem depender do PocketBase real) |

## Links

- Spec: `docs/specs/pocketbase-auth.md`
- Feature doc: `docs/features/pocketbase-auth.md`
- PR (após implementação): `docs/workflow/pocketbase-auth.pr.md`
- Repositório: https://github.com/GBShadow/svelte-app-clean-arch

## Subtasks

- [x] Client PocketBase server-side + hooks
- [x] Login (UI + form action + Zod)
- [x] Logout
- [x] Gate de troca de senha obrigatória
- [x] `BroadcastChannel` (login/logout entre abas)
- [x] Testes + documentação + PR
