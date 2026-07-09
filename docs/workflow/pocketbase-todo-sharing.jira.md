# Todo multi-lista com compartilhamento (runes)

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

- [ ] AC1: Usuário sem listas vê `/todos` vazio com opção de criar
- [ ] AC2: Usuário cria lista e adiciona itens a ela
- [ ] AC3: Dono edita título e `public` da própria lista
- [ ] AC4: Lista `public = true` é visível (somente leitura) para outro usuário via link
- [ ] AC5: Lista `public = false` é bloqueada para quem não é dono
- [ ] AC6: Escrita por não-dono é rejeitada tanto pela API Rule quanto pela checagem server-side, mesmo em lista pública
- [ ] AC7: Exclusão pelo dono remove lista e itens, inclusive para quem tinha o link
- [ ] Testes com `TodoMemoryGateway`/fakes cobrindo os cenários acima
- [ ] `pnpm test` e `pnpm check` sem erros
- [ ] Documentação em `docs/features/pocketbase-todo-sharing.md`

## Technical Notes (Ports & Adapters — runes)

| Camada | Ação |
|--------|------|
| PocketBase | Migration `pocketbase/pb_migrations/0005_create_todo_collections.js` + API Rules `todo_lists`/`todo_items` |
| Gateway (porta) | `packages/todo-domain/src/gateways/TodoListsGateway.ts` + `TodoListsPocketBaseGateway.ts` |
| Domínio reativo | `apps/runes/src/lib/domain/TodoListsService.svelte.ts` |
| Server | `apps/runes/src/routes/todos/+page.server.ts`, `todos/new/+page.server.ts`, `todos/[id]/+page.server.ts` |
| UI | `apps/runes/src/lib/components/TodoListsIndex.svelte`, `TodoListDetail.svelte` |
| Validação | `apps/runes/src/lib/validation/todoSchemas.ts` (Zod) |
| Testes | `TodoListsService.test.ts` (domínio) + integração com `TodoMemoryGateway`/fake |

## Links

- Spec: `docs/specs/pocketbase-todo-sharing.md`
- Feature doc: `docs/features/pocketbase-todo-sharing.md`
- PR (após implementação): `docs/workflow/pocketbase-todo-sharing.pr.md`
- Repositório: https://github.com/GBShadow/svelte-app-clean-arch

## Subtasks

- [ ] Coleções + API Rules
- [ ] Gateway + domínio reativo (múltiplas listas)
- [ ] Rotas e forms (CRUD de lista e itens)
- [ ] Visualização somente leitura (compartilhamento público)
- [ ] Testes + documentação + PR
