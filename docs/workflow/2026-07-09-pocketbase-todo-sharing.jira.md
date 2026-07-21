# Todo multi-lista com compartilhamento (runes)

Created: 2026-07-09


## Metadados Jira

| Campo | Valor |
|-------|-------|
| Issue Type | Story |
| Priority | Medium |
| Labels | pocketbase, todo, sharing, runes, sveltekit |
| Story Points | 8 |
| Jira Key | [JIRA-KEY] |
| Epic | PocketBase — autenticação e CRUD |

## Description

### Contexto

Hoje `apps/runes` tem uma única lista de todo global, sem dono. Com autenticação e usuários já existentes, cada usuário deve poder ter várias listas próprias, e opcionalmente compartilhar uma lista (somente leitura) via link, controlado por uma flag `public`.

### Objetivo

Usuário gerencia várias listas próprias (CRUD completo). Lista com `public = true` pode ser vista (somente leitura) por qualquer usuário autenticado com o link. Nenhuma escrita é permitida a quem não é dono, mesmo com o link.

### Escopo

**Incluído:**
- Coleções `todo_lists` e `todo_items`
- CRUD de listas e itens (dono apenas)
- Visualização somente leitura de lista pública via link
- Validação de posse via API Rules do PocketBase + checagem server-side

**Fora do escopo:**
- Compartilhamento por pessoa específica (só a flag `public`)
- Migração da lista global (`SEED_TODOS`) atual

## Acceptance Criteria

- [x] AC1: Usuário sem listas vê `/todos` vazio com opção de criar
- [x] AC2: Usuário cria lista e adiciona itens a ela
- [x] AC3: Dono edita título e `public` da própria lista
- [x] AC4: Lista `public = true` é visível (somente leitura) para outro usuário via link
- [x] AC5: Lista `public = false` é bloqueada para quem não é dono (PocketBase retorna 404 — a viewRule já barra o `getOne`; não vaza nem a existência da lista, mais forte que o 403 sugerido)
- [x] AC6: Escrita por não-dono é rejeitada tanto pela API Rule quanto pela checagem server-side, mesmo em lista pública — testado também com chamadas diretas à API do PocketBase (fora do app), não só pela UI
- [x] AC7: Exclusão pelo dono remove lista e itens (cascadeDelete), inclusive para quem tinha o link
- [x] Testes cobrindo os cenários acima (unitários para predicados de autorização puros + Zod; e2e Playwright real; validação manual com dois usuários e PocketBase real, incluindo ataque direto à API)
- [x] `pnpm test` e `pnpm check` sem erros
- [x] Documentação em `docs/features/2026-07-09-pocketbase-todo-sharing.md`

## Technical Notes (Ports & Adapters — runes)

| Camada | Ação |
|--------|------|
| PocketBase | Migration `pocketbase/pb_migrations/0008_create_todo_collections.js` (spec sugeria `0005`, já ocupada) + API Rules `todo_lists`/`todo_items` |
| Autorização | `apps/runes/src/lib/domain/todoListAccess.ts` (`canView`/`canWrite`, predicados puros testáveis) — usados direto nas rotas em vez de um Gateway/Service dedicado (ver Decisões de design na feature doc) |
| Server | `apps/runes/src/routes/todos/+page.server.ts`, `todos/new/+page.server.ts`, `todos/[id]/+page.server.ts` — chamam `locals.pb` diretamente, mesmo padrão de `pocketbase-auth`/`pocketbase-user-crud` |
| UI | `apps/runes/src/routes/todos/+page.svelte`, `todos/new/+page.svelte`, `todos/[id]/+page.svelte` |
| Validação | `apps/runes/src/lib/validation/todoSchemas.ts` (Zod) |
| Remoção | Feature de lista única do runes (`TodoListContainer`, `TodoList.svelte`, `todoStore.ts`, `/api/todos`, `/api/test/reset`) — descontinuada por decisão do usuário; `classic`/`remote` não foram tocados |
| Testes | `todoListAccess.test.ts`, `todoSchemas.test.ts` (unitários) + `e2e/todo-sharing.spec.ts` (Playwright) |

## Links

- Spec: `docs/specs/2026-07-09-pocketbase-todo-sharing.md`
- Feature doc: `docs/features/2026-07-09-pocketbase-todo-sharing.md`
- PR (após implementação): `docs/workflow/2026-07-09-pocketbase-todo-sharing.pr.md`
- Repositório: https://github.com/GBShadow/svelte-app-clean-arch

## Subtasks

- [x] Coleções + API Rules
- [x] Remover feature de lista única do runes
- [x] Rotas e forms (CRUD de lista e itens)
- [x] Visualização somente leitura (compartilhamento público)
- [x] Testes + documentação + PR
