# Refatoração Visual Moderna da Aplicação

Created: 2026-08-27

> Este arquivo é **derivado** de `docs/specs/2026-08-27-refatoracao-visual-moderna.tasks.md` (fase 4). A fonte da verdade é sempre `docs/specs/2026-08-27-refatoracao-visual-moderna.*`.

## Metadados Jira

| Campo | Valor |
|-------|-------|
| Issue Type | Story |
| Priority | High |
| Labels | sveltekit, tailwindcss, daisyui, visual-refactor, runes |
| Story Points | 5 |
| Jira Key | [JIRA-KEY] |
| Epic | _Design System & UX Modernization_ |

## Description

### Contexto

A interface da aplicação acumulou inconsistências visuais e padrões estéticos utilitários: contrastes excessivamente rígidos, tipografia uniforme sem ritmo visual marcante, cartões e superfícies com bordas e sombras pesadas, e pouca hierarquia de profundidade.

### Objetivo

Modernizar a identidade visual e a experiência estética de todas as telas da aplicação através de uma linguagem visual contemporânea com superfícies translúcidas/layering sutil, microinterações fluidas, tipografia expressiva e estados visuais polidos (vazio, carregamento, hover e foco).

### Escopo

**Incluído:**
- Tokens visuais em `app.css` (glassmorphism, elevações, sombras, bordas translúcidas)
- Shell global: navbar com backdrop blur, dropdowns e sino de notificações refinados
- Componentes de UI: Toasts, Badges, Seletores, AppCards, Modais e EmptyStates
- Modernização das telas: Hub, Perfil, Categorias, Todos, Kanban, Planning Poker, Retrospectivas e Chat

**Fora do escopo:**
- Mudanças em contratos de dados, regras de negócio ou coleções PocketBase
- Remoção ou alteração de atributos `data-testid`

## Acceptance Criteria

- [ ] AC-001 (deriva de RF-001): Dado um usuário navegando por qualquer rota autenticada, quando inspecionar a interface, então deve observar acabamento visual moderno e uniforme em paleta, bordas e sombras.
- [ ] AC-002 (deriva de RF-002): Dado qualquer cabeçalho de página ou seção, quando renderizado, então a proporção tipográfica deve seguir a escala de hierarquia sem colisão visual.
- [ ] AC-003 (deriva de RF-003): Dado um elemento interativo, quando o usuário interagir via mouse ou teclado, então deve exibir feedback visual suave em menos de 200ms.
- [ ] AC-004 (deriva de RF-004): Dado um usuário que alterou a cor de destaque em seu perfil, quando navegar na aplicação, então os botões principais e estados ativos devem refletir a nova cor mantendo contraste legível.
- [ ] AC-005 (deriva de RF-005): Dado um módulo sem itens cadastrados, quando acessado, então deve exibir um estado vazio estilizado com instrução clara de início.
- [ ] AC-006 (deriva de RF-007): Dado o conjunto de testes automatizados e seletores de teste, quando executados, então nenhum seletor deve ser quebrado pela refatoração visual.
- [ ] Toda `RF-###` da spec coberta por ≥1 `T###` de `docs/specs/2026-08-27-refatoracao-visual-moderna.tasks.md`
- [ ] `pnpm test` verde (todas as suítes passando)

## Technical Notes

| Camada | Ação |
|--------|------|
| Tokens & Estilos | `apps/runes/src/app.css` |
| Shell & Layout | `apps/runes/src/routes/+layout.svelte`, `PageShell.svelte`, `PageHeader.svelte` |
| Componentes UI | `apps/runes/src/lib/components/` |
| Páginas de Módulos | `apps/runes/src/routes/` (Hub, Categorias, Todos, Kanban, Poker, Retro, Chat, Profile) |
| Testes | `pnpm test` executado garantindo zero regressão em testes unitários e de componente |

## Links

- Spec: `docs/specs/2026-08-27-refatoracao-visual-moderna.md`
- Plan: `docs/specs/2026-08-27-refatoracao-visual-moderna.plan.md`
- Tasks: `docs/specs/2026-08-27-refatoracao-visual-moderna.tasks.md`
- Checklist: `docs/specs/2026-08-27-refatoracao-visual-moderna.checklist.md`
- Repositório: https://github.com/GBShadow/svelte-app-clean-arch

## Subtasks

- [ ] T001: Definir tokens modernos de elevação, glassmorphism e sombras em `app.css`
- [ ] T002: Criar utilitários para empty states e skeletons em `app.css`
- [ ] T003: Modernizar `PageShell.svelte`
- [ ] T004: Refatorar `PageHeader.svelte`
- [ ] T005: Modernizar navbar e menu de usuário em `+layout.svelte`
- [ ] T006: Refatorar `NotificationBell.svelte`
- [ ] T007: Estilizar `Toast.svelte`
- [ ] T008: Refatorar `CategoryBadge.svelte` e `CategorySelect.svelte`
- [ ] T009: Estilizar `AccentPicker.svelte`
- [ ] T010: Redesenhar `AppCard.svelte` e Hub inicial `+page.svelte`
- [ ] T011: Modernizar `profile/+page.svelte` e `ChangePasswordForm.svelte`
- [ ] T012: Refatorar `categories/+page.svelte` e `categories/[id]/+page.svelte`
- [ ] T013: Modernizar `todos/[id]/+page.svelte`
- [ ] T014: Refatorar board do Kanban em `kanban/+page.svelte`
- [ ] T015: Estilizar cartas e sala de Poker em `poker/room/[id]/+page.svelte`
- [ ] T016: Refatorar mural de Retro em `retro/+page.svelte` e `RetroCard.svelte`
- [ ] T017: Modernizar chat em tempo real em `chat/[id]/+page.svelte`
- [ ] T018: Executar suíte de testes unitários (`pnpm test`)
- [ ] T019: Validar responsividade em 375px, 768px e 1280px
