# Todo multi-lista com compartilhamento (runes)

> Copie este conteúdo para o body do Pull Request no GitHub.

## Resumo

Substitui a lista de todo global (sem dono) do app `runes` por múltiplas listas por usuário, com compartilhamento somente leitura via flag `public`. Escrita sempre restrita ao dono, reforçada em duas camadas independentes (API Rules do PocketBase e checagem server-side no SvelteKit).

## Tipo de mudança

- [x] Nova funcionalidade
- [ ] Correção de bug
- [x] Refatoração (remove a feature de lista única do runes)
- [ ] Documentação
- [ ] Chore / tooling

## Alterações

### Domínio
- Não aplicável — sem mudança em `packages/todo-domain` (usado apenas por `classic`/`remote`, intocados).

### App(s)
- `apps/runes/src/lib/domain/todoListAccess.ts` (novo) — predicados puros `canView`/`canWrite`
- `apps/runes/src/lib/validation/todoSchemas.ts` (novo)
- `apps/runes/src/lib/server/todoRecord.ts` (novo)
- `apps/runes/src/routes/+page.server.ts` (novo) — `/` redireciona para `/todos`
- `apps/runes/src/routes/todos/+page.server.ts` + `+page.svelte` (novos)
- `apps/runes/src/routes/todos/new/+page.server.ts` + `+page.svelte` (novos)
- `apps/runes/src/routes/todos/[id]/+page.server.ts` + `+page.svelte` (novos)
- `apps/runes/src/routes/+layout.svelte` — link "Minhas listas"
- `apps/runes/src/lib/validation/formErrors.ts` (novo) — `fieldErrorsFrom` extraído de `userSchemas.ts` para reuso
- **Removidos**: `TodoListContainer.svelte`, `TodoList.svelte`(+test), `Item.svelte.ts`, `TodoList.svelte.ts`(+test), `TodoListService.svelte.ts`(+test), `todoStore.ts`, `routes/api/todos/**`, `routes/api/test/reset`, `e2e/todo-list.spec.ts` — feature de lista única do runes, descontinuada (decisão do usuário)
- `apps/runes/package.json` — remove dependência `todo-domain` (não usada mais); `apps/runes/vite.config.ts` — remove `ssr.noExternal: ['todo-domain']`

### Infraestrutura
- `pocketbase/pb_migrations/0008_create_todo_collections.js` (novo) — coleções `todo_lists`/`todo_items` + API Rules

### Testes
- `apps/runes/src/lib/domain/todoListAccess.test.ts`, `todoSchemas.test.ts` (novos, unitários)
- `apps/runes/e2e/todo-sharing.spec.ts` (novo) — substitui `todo-list.spec.ts`
- `apps/runes/e2e/auth-cross-tab.spec.ts` — ajustado (`/` → `/todos` após login)
- `apps/runes/e2e/fixtures.ts` — remove chamada ao `/api/test/reset` (endpoint removido); login aguarda `/todos`

## Test plan

- [x] `pnpm test`
- [x] `pnpm check`
- [x] `pnpm build`
- [x] Teste manual: dois usuários reais + PocketBase real — AC1-AC7, incluindo tentativa de escrita por não-dono **direto na API do PocketBase** (fora do app), bloqueada em todos os casos
- [x] Suíte e2e (`auth-cross-tab`, `todo-sharing`) sem regressão

## Documentação

- Spec: [docs/specs/pocketbase-todo-sharing.md](../specs/pocketbase-todo-sharing.md)
- Feature: [docs/features/pocketbase-todo-sharing.md](../features/pocketbase-todo-sharing.md)
- CHANGELOG: [docs/CHANGELOG.md](../CHANGELOG.md)

## Breaking changes

`apps/runes` não tem mais uma lista de todo global — `/` agora redireciona para `/todos`, onde cada usuário só vê as próprias listas. Não há migração dos dados antigos (`SEED_TODOS`), conforme escopo da spec. `classic` e `remote` não foram alterados.

## Issues / Jira

- Closes #[issue]
- Jira: [JIRA-KEY] — [docs/workflow/pocketbase-todo-sharing.jira.md](./pocketbase-todo-sharing.jira.md)

## Screenshots

_(opcional — telas de `/todos`, `/todos/new`, `/todos/[id]`)_
