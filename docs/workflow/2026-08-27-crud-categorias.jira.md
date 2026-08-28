# CRUD de Categorias e Busca Agregada

Created: 2026-08-27

> Este arquivo é **derivado** de `docs/specs/2026-08-27-crud-categorias.tasks.md` (fase 4). A fonte da verdade é sempre `docs/specs/2026-08-27-crud-categorias.*`.

## Metadados Jira

| Campo | Valor |
|-------|-------|
| Issue Type | Story |
| Priority | Medium |
| Labels | sveltekit, ports-adapters, runes, categories, taxonomy |
| Story Points | 5 |
| Jira Key | [JIRA-KEY] |
| Epic | _(opcional)_ |

## Description

### Contexto

A aplicação possui múltiplos módulos de produtividade e colaboração (Todos, Kanban, Planning Poker, Documentos de Especificação e Retrospectivas de Sprint), mas carece de uma taxonomia unificada para classificação, filtros e busca transversal de dados.

### Objetivo

Implementar a gestão centralizada (CRUD) de categorias globais, a associação de categorias nos 5 módulos de trabalho, filtros locais nas ferramentas e uma rota de busca agregada por categoria (`/categories/[id]`).

### Escopo

**Incluído:**
- CRUD de Categorias Globais em `/categories` com validação de nome e descrição.
- Página de detalhes da categoria com visão agregada e links diretos em `/categories/[id]`.
- Vínculo (1:1) e filtro local por categoria em: Todos, Kanban, Planning Poker, Docs de Especificação e Retrospectivas.
- Desvinculação suave (Nullify) automática na exclusão de categoria.

**Fora do escopo:**
- Subcategorias / hierarquia em árvore.
- Relações N:N (múltiplas categorias por item).

## Acceptance Criteria

- [ ] AC-001: Dado um usuário autenticado, quando submete nome válido e descrição opcional, então a categoria é criada e listada globalmente.
- [ ] AC-002: Dado que o usuário acessa `/categories`, quando a página carrega, então todas as categorias são exibidas com opções de edição, exclusão e visualização detalhada.
- [ ] AC-003: Dado que um usuário edita uma categoria, quando salva, então a atualização reflete em todas as telas e agregações.
- [ ] AC-004: Dado que uma categoria com vínculos ativos é excluída, quando a ação é confirmada, então a categoria é deletada e todos os itens vinculados permanecem íntegros sem categoria.
- [ ] AC-005: Dado que o usuário acessa `/categories/[id]`, quando a página é carregada, então são exibidas as listas de Todos, Kanban Cards, Poker Tasks, Spec Docs e Retro Cards vinculados àquela categoria.
- [ ] AC-006: Dado um item de afazer, quando associado a uma categoria, então ele exibe a categoria e pode ser filtrado na tela de Todos.
- [ ] AC-007: Dado um cartão Kanban, quando associado a uma categoria, então ele exibe a categoria e pode ser filtrado no quadro Kanban.
- [ ] AC-008: Dado uma tarefa de Planning Poker, quando associada a uma categoria, então ela exibe a categoria e pode ser filtrada no backlog.
- [ ] AC-009: Dado um documento de especificação, quando associado a uma categoria, então ele exibe a categoria e pode ser filtrado na listagem de documentos.
- [ ] AC-010: Dado um cartão de retrospectiva, quando associado a uma categoria, então ele exibe a categoria e pode ser filtrado no quadro de retrospectiva.
- [ ] Toda `RF-001` a `RF-013` da spec coberta por ≥1 `T###` de `docs/specs/2026-08-27-crud-categorias.tasks.md`
- [ ] `pnpm test` verde (todas as tasks `[X]`)

## Technical Notes (padrão real — apps/runes)

| Camada | Ação |
|--------|------|
| Banco (PocketBase) | Migration `0024_create_categories_and_relations.js` criando a coleção `categories` e relacionamentos opcionais |
| Tipos | `apps/runes/src/lib/server/categoryRecord.ts` + updates nos demais records |
| Domínio | `apps/runes/src/lib/domain/categoryAccess.ts` com testes unitários em `categoryAccess.test.ts` |
| Validação | Schemas Zod em `apps/runes/src/lib/validation/categorySchemas.ts` com testes unitários |
| Server | Form actions em `+page.server.ts` chamando `locals.pb` |
| UI | `CategoryBadge.svelte`, `CategorySelect.svelte`, `/categories` e `/categories/[id]` |
| Testes | Unitários (`vitest`) e E2E (`playwright`) |

## Links

- Spec: `docs/specs/2026-08-27-crud-categorias.md`
- Plan: `docs/specs/2026-08-27-crud-categorias.plan.md`
- Tasks: `docs/specs/2026-08-27-crud-categorias.tasks.md`
- Checklist: `docs/specs/2026-08-27-crud-categorias.checklist.md`
- Repositório: https://github.com/GBShadow/svelte-app-clean-arch

## Subtasks

- [ ] T001: Criar tipos TypeScript de categorias e atualizar records existentes
- [ ] T002: Criar schemas Zod de categorias
- [ ] T003: Criar testes unitários dos schemas de categoria
- [ ] T004: Atualizar schemas de Todos, Kanban, Poker, Specs e Retro com campo `category`
- [ ] T005: Criar migration PocketBase `0024_create_categories_and_relations.js`
- [ ] T006: Implementar `categoryAccess.ts` e testes unitários
- [ ] T007: Criar componentes `CategoryBadge.svelte` e `CategorySelect.svelte`
- [ ] T008: Implementar `load` e form actions em `/categories/+page.server.ts`
- [ ] T009: Implementar interface de listagem e CRUD em `/categories/+page.svelte`
- [ ] T010: Adicionar card de Categorias no App Hub (`routes/+page.svelte`)
- [ ] T011: Implementar `load` agregado paralelo em `/categories/[id]/+page.server.ts`
- [ ] T012: Implementar visão agregada transversal em `/categories/[id]/+page.svelte`
- [ ] T013: Atualizar action de Todo items com categoria
- [ ] T014: Integrar seletor, badge e filtro de categoria na tela de Todos
- [ ] T015: Atualizar action de Kanban cards com categoria
- [ ] T016: Integrar seletor, badge e filtro de categoria no Kanban
- [ ] T017: Atualizar actions de tarefas de poker com categoria
- [ ] T018: Integrar seletor, badge e filtro de categoria no Planning Poker
- [ ] T019: Atualizar action de docs de especificação com categoria
- [ ] T020: Integrar seletor, badge e filtro de categoria nos Docs de Especificação
- [ ] T021: Atualizar action de cartões de retrospectiva com categoria
- [ ] T022: Integrar seletor, badge e filtro de categoria nas Retrospectivas
- [ ] T023: Criar testes E2E com Playwright em `categories.test.ts`
- [ ] T024: Atualizar documentação em `CODE-STRUCTURE.md` e `ROUTES.md`
- [ ] T025: Registrar alterações em `CHANGELOG.md`
