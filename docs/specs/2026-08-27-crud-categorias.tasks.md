# CRUD de Categorias e Busca Agregada — Tasks

Criado: 2026-08-27
Slug: 2026-08-27-crud-categorias
Spec: [docs/specs/2026-08-27-crud-categorias.md](./2026-08-27-crud-categorias.md)
Plan: [docs/specs/2026-08-27-crud-categorias.plan.md](./2026-08-27-crud-categorias.plan.md)

> **Formato de task (R5):** `- [ ] T001 [P] [US1] Descrição com caminho exato do arquivo`.
> - `T###` = id estável de largura fixa (R4), nunca renumerado nem reciclado.
> - `[P]` marca task **paralelizável** — **somente** se os arquivos são disjuntos das demais tasks da mesma fase e não há dependência pendente.
> - `[US1]` = user story de origem (rastreabilidade).
> - A descrição termina no **caminho exato** do arquivo que a task cria ou altera.
> - Fases: `Fase 1: Setup` → `Fase 2: Fundação` (**BLOQUEIA todas as user stories**) → `Fase 3..N` (uma por user story, ordem `P1..Pn`, cada uma terminando em `**Checkpoint**`) → `Fase final: Polimento`.

## Rastreabilidade

| RF/SC | Tasks |
|-------|-------|
| RF-001 | T002, T008, T009 |
| RF-002 | T008, T009 |
| RF-003 | T002, T008, T009 |
| RF-004 | T002, T008, T009 |
| RF-005 | T002, T003 |
| RF-006 | T008, T009, T010, T011, T012 |
| RF-007 | T001, T004, T013, T014 |
| RF-008 | T001, T004, T015, T016 |
| RF-009 | T001, T004, T017, T018 |
| RF-010 | T001, T004, T019, T020 |
| RF-011 | T001, T004, T021, T022 |
| RF-012 | T013, T014, T015, T016, T017, T018, T019, T020, T021, T022 |
| RF-013 | T005, T008, T011 |
| SC-001 | T008, T011 |
| SC-002 | T005, T008, T011 |
| SC-003 | T007, T013, T015, T017, T019, T021 |

## Fase 1: Setup

- [X] T001 [P] [US1] Criar os tipos TypeScript da coleção de categorias e atualizar os registros com campo `category` em `apps/runes/src/lib/server/categoryRecord.ts`, `apps/runes/src/lib/server/todoRecord.ts`, `apps/runes/src/lib/server/kanbanRecord.ts`, `apps/runes/src/lib/server/pokerRecord.ts`, `apps/runes/src/lib/server/specRecord.ts` e `apps/runes/src/lib/server/retroRecord.ts`
- [X] T002 [P] [US1] Criar os schemas Zod de validação de categorias em `apps/runes/src/lib/validation/categorySchemas.ts`
- [X] T003 [P] [US1] Criar testes unitários dos schemas de categoria em `apps/runes/src/lib/validation/categorySchemas.test.ts`
- [X] T004 [P] [US1] Atualizar schemas existentes de Todos, Kanban, Poker, Specs e Retro para aceitar o campo `category` em `apps/runes/src/lib/validation/todoSchemas.ts`, `apps/runes/src/lib/validation/kanbanSchemas.ts`, `apps/runes/src/lib/validation/pokerSchemas.ts`, `apps/runes/src/lib/validation/specSchemas.ts` e `apps/runes/src/lib/validation/retroSchemas.ts`

## Fase 2: Fundação

> **BLOQUEIA todas as user stories** — nenhuma interface ou story avança antes destas tasks.

- [X] T005 [US1] Criar a migration PocketBase para criação da coleção `categories` e adição do campo `category` (com `cascadeDelete: false`) em `pocketbase/pb_migrations/0024_create_categories_and_relations.js`
- [X] T006 [US1] Implementar regras puras de domínio e testes em `apps/runes/src/lib/domain/categoryAccess.ts` e `apps/runes/src/lib/domain/categoryAccess.test.ts`
- [X] T007 [US1] Criar os componentes visuais reutilizáveis de categoria com `data-testid` em `apps/runes/src/lib/components/categories/CategoryBadge.svelte` e `apps/runes/src/lib/components/categories/CategorySelect.svelte`

## Fase 3: US1 — Gestão Centralizada de Categorias Globais

- [X] T008 [US1] Implementar `load` e form actions (`create`, `update`, `delete`) em `apps/runes/src/routes/categories/+page.server.ts`
- [X] T009 [US1] Implementar a interface de listagem e gerenciamento CRUD com modais DaisyUI em `apps/runes/src/routes/categories/+page.svelte`
- [X] T010 [US1] Adicionar o card de navegação para Categorias no App Hub em `apps/runes/src/routes/+page.svelte`

**Checkpoint** — US1 entrega o CRUD completo e o catálogo de categorias funcionando de ponta a ponta.

## Fase 4: US2 — Busca Agregada e Visão Detalhada da Categoria

- [X] T011 [US2] Implementar `load` com agregação paralela (`Promise.all`) em `apps/runes/src/routes/categories/[id]/+page.server.ts`
- [X] T012 [US2] Implementar a interface da visão agregada por abas/seções com links diretos aos itens em `apps/runes/src/routes/categories/[id]/+page.svelte`

**Checkpoint** — US2 entrega a visão consolidada de todos os artefatos vinculados à categoria.

## Fase 5: US3 — Vínculo e Filtro em Itens de Afazeres (Todos)

- [X] T013 [US3] Atualizar action de criação/edição de itens de Todo em `apps/runes/src/routes/todos/[id]/+page.server.ts`
- [X] T014 [US3] Integrar `CategorySelect`, `CategoryBadge` e barra de filtro por categoria na tela de lista de afazeres em `apps/runes/src/routes/todos/[id]/+page.svelte`

**Checkpoint** — US3 entrega categorias funcionais nos Todos.

## Fase 6: US4 — Vínculo e Filtro em Cartões do Quadro Kanban

- [X] T015 [US4] Atualizar action de criação/edição de cartões Kanban em `apps/runes/src/routes/kanban/+page.server.ts`
- [X] T016 [US4] Integrar `CategorySelect` no modal de cartão, `CategoryBadge` nos cartões do board e seletor de filtro na barra de ferramentas do Kanban em `apps/runes/src/routes/kanban/+page.svelte`

**Checkpoint** — US4 entrega categorias funcionais no Kanban.

## Fase 7: US5 — Vínculo e Filtro em Tarefas de Planning Poker

- [X] T017 [US5] Atualizar actions de criação/edição de tarefas no backlog de poker em `apps/runes/src/routes/poker/backlog/+page.server.ts`
- [X] T018 [US5] Integrar `CategorySelect`, `CategoryBadge` e filtro por categoria na listagem de backlog em `apps/runes/src/routes/poker/backlog/+page.svelte`

**Checkpoint** — US5 entrega categorias funcionais no Planning Poker.

## Fase 8: US6 — Vínculo e Filtro em Documentos de Especificação

- [X] T019 [US6] Atualizar action de criação/edição de especificações em `apps/runes/src/routes/projects/[projectId]/specs/+page.server.ts`
- [X] T020 [US6] Integrar `CategorySelect`, `CategoryBadge` e filtro por categoria na listagem de especificações em `apps/runes/src/routes/projects/[projectId]/specs/+page.svelte`

**Checkpoint** — US6 entrega categorias funcionais nos Documentos de Especificação.

## Fase 9: US7 — Vínculo e Filtro em Cartões de Retrospectiva

- [X] T021 [US7] Atualizar action de criação/edição de cartões de retrospectiva em `apps/runes/src/routes/projects/[projectId]/sprints/[sprintId]/retro/+page.server.ts`
- [X] T022 [US7] Integrar `CategorySelect`, `CategoryBadge` e filtro visual no quadro de retro em `apps/runes/src/routes/projects/[projectId]/sprints/[sprintId]/retro/+page.svelte`

**Checkpoint** — US7 entrega categorias funcionais nas Retrospectivas de Sprint.

## Fase final: Polimento & Documentação

- [X] T023 [US1] Criar testes E2E com Playwright cobrindo o fluxo de criação de categoria e vínculo em `apps/runes/e2e/categories.spec.ts`
- [X] T024 [US1] Atualizar o mapa da arquitetura e rotas em `docs/CODE-STRUCTURE.md` e `docs/ROUTES.md`
- [X] T025 [US1] Registrar histórico de alterações em `docs/CHANGELOG.md`

## Dependências e ordem de execução

- T001..T004 → T005 (os tipos e schemas sustentam a migration e o domínio)
- T005 → T008, T011, T013, T015, T017, T019, T021 (a migration do PocketBase precisa estar aplicada para que as queries funcionem)
- T006, T007 → T009, T012, T014, T016, T018, T020, T022 (componentes reutilizáveis são consumidos nas páginas)
- T008, T009 → T011, T012 (a gestão de categorias deve estar operando antes da busca agregada)

## Oportunidades de paralelismo

- T001, T002, T003, T004 podem ser executadas em paralelo (Setup)
- T013, T015, T017, T019, T021 são paralelizáveis após a Fase 2 (Fundação)

## Estratégia de entrega

- **MVP = Fase 1 + Fase 2 + US1** — entrega a gestão central de categorias funcional.
- **Incremento 1 = US2** — entrega a busca agregada `/categories/[id]`.
- **Incremento 2 = US3..US7** — integra as categorias progressivamente em cada ferramenta.
- Parar em cada `**Checkpoint**` e validar o comportamento antes de avançar.
- Gate da fase 5: todas as tasks `[X]` e `pnpm test` verde.
