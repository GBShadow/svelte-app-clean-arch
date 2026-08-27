# Workflow — PR e Jira

**Guia completo (spec-driven):** [../spec-driven-development.md](../spec-driven-development.md)

Esta pasta guarda os **derivados de gestão** do fluxo spec-driven — os arquivos `.jira.md` e `.pr.md`. Eles **não** são a fonte da verdade: a fonte é `docs/specs/<slug>.*` (spec, plan, tasks, checklist). O `.jira.md` é **derivado** de `<slug>.tasks.md`, e o `.pr.md` referencia spec/feature/Jira. Se algo aqui divergir da spec, corrija na spec/tasks — nunca edite só o derivado.

## Índice

| Slug | Criada | PR | Jira |
|------|--------|----|------|
| `pocketbase-infra` | 2026-07-09 | [2026-07-09-pocketbase-infra.pr.md](./2026-07-09-pocketbase-infra.pr.md) | [2026-07-09-pocketbase-infra.jira.md](./2026-07-09-pocketbase-infra.jira.md) |
| `pocketbase-auth` | 2026-07-09 | [2026-07-09-pocketbase-auth.pr.md](./2026-07-09-pocketbase-auth.pr.md) | [2026-07-09-pocketbase-auth.jira.md](./2026-07-09-pocketbase-auth.jira.md) |
| `pocketbase-user-crud` | 2026-07-09 | [2026-07-09-pocketbase-user-crud.pr.md](./2026-07-09-pocketbase-user-crud.pr.md) | [2026-07-09-pocketbase-user-crud.jira.md](./2026-07-09-pocketbase-user-crud.jira.md) |
| `pocketbase-todo-sharing` | 2026-07-09 | [2026-07-09-pocketbase-todo-sharing.pr.md](./2026-07-09-pocketbase-todo-sharing.pr.md) | [2026-07-09-pocketbase-todo-sharing.jira.md](./2026-07-09-pocketbase-todo-sharing.jira.md) |
| `spec-driven-agent` | 2026-07-09 | [2026-07-09-spec-driven-agent.pr.md](./2026-07-09-spec-driven-agent.pr.md) | [2026-07-09-spec-driven-agent.jira.md](./2026-07-09-spec-driven-agent.jira.md) |
| `data-testid-e2e` | 2026-07-10 | _(pendente)_ | [2026-07-10-data-testid-e2e.jira.md](./2026-07-10-data-testid-e2e.jira.md) |
| `e2e-test-fix-plan` | 2026-07-10 | [2026-07-10-e2e-test-fix-plan.pr.md](./2026-07-10-e2e-test-fix-plan.pr.md) | [2026-07-10-e2e-test-fix-plan.jira.md](./2026-07-10-e2e-test-fix-plan.jira.md) |
| `app-hub` | 2026-07-10 | _(pendente)_ | [2026-07-10-app-hub.jira.md](./2026-07-10-app-hub.jira.md) |
| `chat-realtime` | 2026-07-10 | [2026-07-11-chat-realtime.pr.md](./2026-07-11-chat-realtime.pr.md) | [2026-07-10-chat-realtime.jira.md](./2026-07-10-chat-realtime.jira.md) |
| `dracula-theme-redesign` | 2026-07-10 | [2026-07-10-dracula-theme-redesign.pr.md](./2026-07-10-dracula-theme-redesign.pr.md) | _(ver app-hub)_ |
| `kanban` | 2026-07-12 | [2026-07-12-kanban.pr.md](./2026-07-12-kanban.pr.md) | [2026-07-12-kanban.jira.md](./2026-07-12-kanban.jira.md) |
| `planning-poker` | 2026-07-12 | [2026-07-12-planning-poker.pr.md](./2026-07-12-planning-poker.pr.md) | [2026-07-12-planning-poker.jira.md](./2026-07-12-planning-poker.jira.md) |
| `chat-sender-preservar` | 2026-07-12 | [2026-07-14-kanban-fixes-e-poker-backlog.pr.md](./2026-07-14-kanban-fixes-e-poker-backlog.pr.md) | [2026-07-12-chat-sender-preservar.jira.md](./2026-07-12-chat-sender-preservar.jira.md) |
| `poker-backlog-global` | 2026-07-12 | [2026-07-14-kanban-fixes-e-poker-backlog.pr.md](./2026-07-14-kanban-fixes-e-poker-backlog.pr.md) | [2026-07-12-poker-backlog-global.jira.md](./2026-07-12-poker-backlog-global.jira.md) |
| `kanban-fixes-e-poker-backlog` | 2026-07-14 | [2026-07-14-kanban-fixes-e-poker-backlog.pr.md](./2026-07-14-kanban-fixes-e-poker-backlog.pr.md) | _(ver chat-sender-preservar/poker-backlog-global)_ |
| `notifications` | 2026-07-15 | _(pendente)_ | [2026-07-15-notifications.jira.md](./2026-07-15-notifications.jira.md) |
| `chat-admin-access` | 2026-07-15 | _(pendente)_ | [2026-07-15-chat-admin-access.jira.md](./2026-07-15-chat-admin-access.jira.md) |
| `ui-improvements` | 2026-07-22 | [2026-07-22-ui-improvements.pr.md](./2026-07-22-ui-improvements.pr.md) | _(ver PR #9)_ |
| `sprint-retrospective` | 2026-07-24 | [2026-07-24-sprint-retrospective.pr.md](./2026-07-24-sprint-retrospective.pr.md) | [2026-07-24-sprint-retrospective.jira.md](./2026-07-24-sprint-retrospective.jira.md) |
| `specification-documents` | 2026-07-24 | [2026-07-24-specification-documents.pr.md](./2026-07-24-specification-documents.pr.md) | [2026-07-24-specification-documents.jira.md](./2026-07-24-specification-documents.jira.md) |

## Convenção de nomes

| Tipo | Template | Arquivo gerado |
|------|----------|----------------|
| Pull Request | [_template-pr.md](./_template-pr.md) | `<slug>.pr.md` |
| Jira | [_template-jira.md](./_template-jira.md) | `<slug>.jira.md` |

Mesmo `<slug>` (kebab-case com prefixo de data, ex: `2026-07-12-add-filters`) para spec, plan, tasks, checklist, Jira, feature doc e PR da mesma feature. Os arquivos desta pasta (`<slug>.jira.md` e `<slug>.pr.md`) são derivados de `docs/specs/<slug>.*`.

## Nova feature (fluxo spec-driven)

A fonte da verdade vive em `docs/specs/<slug>.*`. O passo a passo completo das 7 fases está no [guia spec-driven](../spec-driven-development.md); resumo do que toca esta pasta:

0. Spec + plan + tasks + checklist em [../specs/](../specs/)
1. Jira: derive `_template-jira.md` → `<slug>.jira.md` a partir de `<slug>.tasks.md` (referencia spec/plan/tasks/checklist)
2. Implemente seguindo `.cursor/rules/architecture/runes-ports-adapters.mdc` (todas as tasks `[X]`, `pnpm test` verde)
3. Convergência: append em `docs/specs/<slug>.tasks.md` até `✅ Convergido`
4. Feature doc: [../features/](../features/)
5. PR: copie `_template-pr.md` → `<slug>.pr.md`
6. Atualize este índice

Bugfixes triviais vão para o fluxo de bug (`docs/bugs/`), não para o Jira.

## Comandos

```bash
gh pr create --title "..." --body-file docs/workflow/<slug>.pr.md
```

## Regras Cursor

- `.cursor/rules/workflow/spec-driven.mdc`
- `.cursor/rules/workflow/pr-description.mdc`
- `.cursor/rules/workflow/jira-tasks.mdc`
