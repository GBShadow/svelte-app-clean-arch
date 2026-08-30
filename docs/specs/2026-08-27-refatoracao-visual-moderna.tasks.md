# Refatoração Visual Moderna da Aplicação — Tasks

Criado: 2026-08-27
Slug: 2026-08-27-refatoracao-visual-moderna
Spec: [docs/specs/2026-08-27-refatoracao-visual-moderna.md](./2026-08-27-refatoracao-visual-moderna.md)
Plan: [docs/specs/2026-08-27-refatoracao-visual-moderna.plan.md](./2026-08-27-refatoracao-visual-moderna.plan.md)

## Rastreabilidade

| RF/SC | Tasks |
|-------|-------|
| RF-001 | T001, T002, T003, T004 |
| RF-002 | T001, T003, T004 |
| RF-003 | T001, T005, T006 |
| RF-004 | T001, T009 |
| RF-005 | T002, T008, T010 |
| RF-006 | T002, T011 |
| RF-007 | T014, T015 |
| SC-001 | T003, T004, T007, T008, T010, T011, T012, T013 |
| SC-002 | T014, T015 |
| SC-003 | T001, T002, T014 |

## Fase 1: Setup

- [X] T001 [P] [US1] Definir tokens modernos de elevação, glassmorphism, sombras suaves e bordas translúcidas em `apps/runes/src/app.css`
- [X] T002 [P] [US1] Criar classes utilitárias para empty states e placeholders de skeleton modernos em `apps/runes/src/app.css`

## Fase 2: Fundação

> **BLOQUEIA todas as user stories** — define as cascas e componentes de layout base antes das páginas.

- [X] T003 [US1] Modernizar a casca de container e paddings de página em `apps/runes/src/lib/components/PageShell.svelte`
- [X] T004 [US1] Refatorar o cabeçalho de página com hierarquia tipográfica e badges elegantes em `apps/runes/src/lib/components/PageHeader.svelte`

## Fase 3: US1 — Tokens Visuais, Shell e Navegação Moderna

- [X] T005 [US1] Modernizar a barra de navegação superior com acabamento translúcido, backdrop blur e dropdown de usuário em `apps/runes/src/routes/+layout.svelte`
- [X] T006 [US1] Refatorar o sino de notificações e dropdown com animações de slide/fade suaves em `apps/runes/src/lib/components/NotificationBell.svelte`

**Checkpoint** — US1 entrega shell, navegação e tokens visuais completos; validar visualmente antes de avançar.

## Fase 4: US2 — Modernização dos Componentes de Ação, Formulários e Modais

- [X] T007 [P] [US2] Estilizar o sistema de alertas flutuantes (Toasts) com visual moderno em `apps/runes/src/lib/components/Toast.svelte`
- [X] T008 [P] [US2] Refatorar os seletores e badges de categorias com pílulas translúcidas e dots em `apps/runes/src/lib/components/categories/CategoryBadge.svelte` e `apps/runes/src/lib/components/categories/CategorySelect.svelte`
- [X] T009 [P] [US2] Estilizar o seletor de paletas de acento com anéis de foco e transições táteis em `apps/runes/src/lib/components/AccentPicker.svelte`

**Checkpoint** — US2 entrega todos os componentes transversais de formulários e ações polidos.

## Fase 5: US3 — Redesign do Hub Inicial, Perfil, Notificações e Categorias

- [X] T010 [US3] Redesenhar os cartões de aplicativos do Hub com gradientes sutis, ícones destacados e badges em `apps/runes/src/lib/components/AppCard.svelte` e `apps/runes/src/routes/+page.svelte`
- [X] T011 [US3] Modernizar a página de perfil de usuário e formulário de troca de senha em `apps/runes/src/routes/profile/+page.svelte` e `apps/runes/src/lib/components/ChangePasswordForm.svelte`
- [X] T012 [US3] Refatorar a listagem de categorias e página de visão agregada transversal em `apps/runes/src/routes/categories/+page.svelte` e `apps/runes/src/routes/categories/[id]/+page.svelte`

**Checkpoint** — US3 entrega as áreas de navegação geral, perfil e categorias modernizadas.

## Fase 6: US4 — Redesign dos Quadros de Trabalho, Salas de Colaboração e Documentos

- [X] T013 [US4] Modernizar os cartões e listas de tarefas em `apps/runes/src/routes/todos/[id]/+page.svelte`
- [X] T014 [US4] Refatorar a visualização de colunas e cartões do Kanban com elevação ao toque/hover em `apps/runes/src/routes/kanban/+page.svelte`
- [X] T015 [US4] Estilizar as cartas de baralho e mesa de Planning Poker em `apps/runes/src/lib/components/planning-poker/CardDeck.svelte` e `apps/runes/src/routes/poker/room/[id]/+page.svelte`
- [X] T016 [US4] Refatorar o mural de Retrospectivas em `apps/runes/src/routes/projects/[projectId]/sprints/[sprintId]/retro/+page.svelte` e `apps/runes/src/lib/components/retro/RetroCard.svelte`
- [X] T017 [US4] Modernizar a área de conversação e chat em tempo real em `apps/runes/src/routes/chat/[roomId]/+page.svelte`

**Checkpoint** — US4 conclui a modernização de todos os módulos de produtividade e colaboração.

## Fase final: Polimento

- [X] T018 [US1] Executar suíte de testes unitários e garantir zero quebra em seletores e regras com `pnpm test`
- [X] T019 [US1] Validar responsividade e estabilidade visual em viewports 375px, 768px e 1280px
## Dependências e ordem de execução

- T001, T002 → T003, T004 (Tokens e CSS base precedem os componentes de layout)
- T003, T004 → T005, T006 (PageShell/PageHeader precedem o shell de layout)
- T005..T009 → T010..T017 (Componentes universais alimentam as páginas de cada módulo)

## Estratégia de entrega

- **MVP = US1 + US2** — entrega a fundação estética, layout, navbar e componentes-chave.
- Validação contínua a cada **Checkpoint**.
- Gate de conclusão: todas as tasks marcadas `[X]` e suíte `pnpm test` 100% verde.

## Fase 7: Convergência

### Auditoria de Convergência (2026-08-27)

- **Requisitos Funcionais (`RF-001` a `RF-007`):** 100% implementados e cobertos pelas tarefas `T001` a `T019`.
- **Critérios de Sucesso (`SC-001` a `SC-003`):** 357 testes passando sem regressão, zero quebra de `data-testid`, todas as superfícies autenticadas migradas para o design moderno.
- **Conformidade Constitucional:** Zero violações aos princípios MUST (`P-001`, `P-002`, `P-006`, `P-010`, `P-011`, `P-014`).

`✅ Convergido`
