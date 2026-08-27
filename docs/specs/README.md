# Specs

**Guia completo:** [../spec-driven-development.md](../spec-driven-development.md)

Esta pasta guarda os **artefatos de especificação**: primeiro o QUÊ (spec), depois o COMO (plan), depois o QUEM-FAZ-O-QUÊ (tasks), com gates de qualidade entre as fases. Tudo compartilha o mesmo `<slug>` em kebab-case com prefixo de data (`YYYY-MM-DD-<nome>`).

## Os 5 artefatos

| Artefato | Fase | Conteúdo | Agente dono |
|----------|------|----------|-------------|
| `<slug>.md` | 1 Spec | **o QUÊ** — contexto, objetivo, escopo, user stories, RF/RNF, casos de borda, AC, SC (R1: sem stack) | `spec-creator` |
| `<slug>.checklist.md` | 1c Checklist | itens `CHK###` interrogativos sobre a redação (R6; a marcação `[x]` é do humano) | `spec-reviewer` |
| `<slug>.plan.md` | 2 Plan | **o COMO** — contexto técnico, Constitution Check, camadas, modelo de dados, contrato de API | `spec-creator` |
| `<slug>.tasks.md` | 3 Tasks | tasks `T###` em fases, rastreáveis a `RF-###` (R5) | `spec-creator` |
| `<epico>.roadmap.md` | (épicos) | decomposição em `R1..Rn` — cada entrada vira uma spec própria | `spec-creator` |

## Pipeline (7 fases)

1. **Spec** — `docs/specs/<slug>.md` (o QUÊ; gate: ≤3 `[PRECISA ESCLARECER]`)
2. **Plan** — `docs/specs/<slug>.plan.md` (o COMO; gate: Constitution Check sem violação injustificada)
3. **Tasks** — `docs/specs/<slug>.tasks.md` (gate: toda `RF-###` coberta por ≥1 `T###`)
4. **Jira** — `docs/workflow/<slug>.jira.md` (derivado das tasks)
5. **Implementar** — código com TDD Red-Green-Refactor (gate: tasks `[X]` + `pnpm test` verde)
6. **Convergir** — append `✅ Convergido` em `docs/specs/<slug>.tasks.md` (R8)
7. **Documentar** — `docs/features/<slug>.md` + `docs/CHANGELOG.md` + `docs/workflow/<slug>.pr.md`

Sub-fases: `1b` Esclarecer (cota de 5 perguntas), `1c` Checklist, `3b` Analyze (read-only). Bug não passa por aqui — usa `docs/bugs/` (R9).

## Regime flow-forward (R10)

Spec aprovada é **registro histórico**: nunca é reescrita para caber no que foi implementado. Mudança de rumo = **nova spec** com `Supersede: docs/specs/<antiga>.md`, e a antiga recebe `Status: superada por <nova>`. Divergência descoberta na implementação vira task de convergência ou spec nova — nunca edição silenciosa.

## Índice

| Feature | Status | Criada | Spec |
|---------|--------|--------|------|
| Infra PocketBase (Docker + coleções) | Implementada | 2026-07-09 | [2026-07-09-pocketbase-infra.md](./2026-07-09-pocketbase-infra.md) |
| Autenticação PocketBase (runes) | Implementada | 2026-07-09 | [2026-07-09-pocketbase-auth.md](./2026-07-09-pocketbase-auth.md) |
| CRUD de usuário (runes) | Implementada | 2026-07-09 | [2026-07-09-pocketbase-user-crud.md](./2026-07-09-pocketbase-user-crud.md) |
| Todo multi-lista com compartilhamento (runes) | Implementada | 2026-07-09 | [2026-07-09-pocketbase-todo-sharing.md](./2026-07-09-pocketbase-todo-sharing.md) |
| Subagente spec-driven | Implementada | 2026-07-09 | [2026-07-09-spec-driven-agent.md](./2026-07-09-spec-driven-agent.md) |
| App Hub (tela inicial) | Implementada | 2026-07-10 | [2026-07-10-app-hub.md](./2026-07-10-app-hub.md) |
| Chat em tempo real com avatar (runes) | Implementada | 2026-07-10 | [2026-07-10-chat-realtime.md](./2026-07-10-chat-realtime.md) |
| Correção de testes e2e (Playwright) | Implementada | 2026-07-10 | [2026-07-10-e2e-test-fix-plan.md](./2026-07-10-e2e-test-fix-plan.md) |
| data-testid em componentes e testes | Especificada | 2026-07-10 | [2026-07-10-data-testid-e2e.md](./2026-07-10-data-testid-e2e.md) |
| Kanban | Implementada | 2026-07-12 | [2026-07-12-kanban.md](./2026-07-12-kanban.md) |
| Planning Poker & Integração Kanban | Implementada | 2026-07-12 | [2026-07-12-planning-poker.md](./2026-07-12-planning-poker.md) |
| Preservar Remetente do Chat (runes) | Spec em aprovação | 2026-07-12 | [2026-07-12-chat-sender-preservar.md](./2026-07-12-chat-sender-preservar.md) |
| Backlog Global e Gerenciamento do Ciclo de Vida da Sala (Planning Poker) | Spec em aprovação | 2026-07-12 | [2026-07-12-poker-backlog-global.md](./2026-07-12-poker-backlog-global.md) |
| Notificações Push de Chat e Sistema (runes) | Implementada | 2026-07-15 | [2026-07-15-notifications.md](./2026-07-15-notifications.md) |
| Chat — acesso administrativo (runes) | Spec em aprovação | 2026-07-15 | [2026-07-15-chat-admin-access.md](./2026-07-15-chat-admin-access.md) |
| Projetos, Sprints e Contexto no Kanban + Planning Poker | Implementada | 2026-07-21 | [2026-07-21-projects-sprints-kanban.md](./2026-07-21-projects-sprints-kanban.md) |
| Campanha de Testes — Cobertura Total | Spec em aprovação | 2026-07-22 | [2026-07-22-testing-campaign.md](./2026-07-22-testing-campaign.md) |
| Correção do Export de Tasks do Planning Poker | Especificada | 2026-07-23 | [2026-07-23-poker-export-fix.md](./2026-07-23-poker-export-fix.md) |
| Retrospectiva de Sprint | Implementada | 2026-07-24 | [2026-07-24-sprint-retrospective.md](./2026-07-24-sprint-retrospective.md) |
| Documentos de Especificação | Implementada | 2026-07-24 | [2026-07-24-specification-documents.md](./2026-07-24-specification-documents.md) |
| Revisão de Design e Responsividade | Implementada | 2026-08-05 | [2026-08-05-revisao-de-design.md](./2026-08-05-revisao-de-design.md) |

> **Legenda de Status:** o ciclo de vida da spec é `Rascunho` → `Em validação` → `Aprovada` → `Superada` (ver `_template.md`). Neste índice, o valor reflete o estado de implementação: `Especificada` (spec escrita) · `Spec em aprovação` (em validação) · `Implementada` (construída + documentada).

> **Ordem de implementação:** o Kanban vem **antes** do Planning Poker — a exportação de tasks do Poker escreve em `kanban_cards` e localiza a coluna `type = 'backlog'`, então as migrations do Kanban precisam existir primeiro.

## Nova spec

1. Copie [_template.md](./_template.md) para `<slug>.md` e preencha o QUÊ (R1/R2, IDs R4)
2. Crie checklist, plan e tasks a partir dos templates (`_template-checklist.md`, `_template-plan.md`, `_template-tasks.md`)
3. Valide/alinhe com o usuário **antes** de abrir Jira ou implementar
4. Atualize este índice

## Quando pular a spec / usar roadmap

- Bugfix trivial de poucas linhas ou mudança sem impacto de design → fluxo de bug (`docs/bugs/`, R9)
- Feature grande demais (mais de 3 `[PRECISA ESCLARECER]` ou ~3+ user stories) → `_template-roadmap.md`

## Regras para agentes de IA

- Spec: `.cursor/rules/workflow/spec-driven.mdc`
- Feature: `.cursor/rules/documentation/feature-documentation.mdc`
- PR / Jira: `.cursor/rules/workflow/` → `docs/workflow/`
- Sync: `.cursor/rules/meta/rules-sync.mdc` + `CLAUDE.md`

Ver [../README.md](../README.md) para índice completo.
