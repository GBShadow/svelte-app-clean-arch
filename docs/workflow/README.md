# Workflow — PR e Jira

**Guia completo (spec-driven):** [../spec-driven-development.md](../spec-driven-development.md)

PR e tarefas Jira na **mesma pasta**. Templates e arquivos gerados ficam em `docs/workflow/`.

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

## Convenção de nomes

| Tipo | Template | Arquivo gerado |
|------|----------|----------------|
| Pull Request | [_template-pr.md](./_template-pr.md) | `<slug>.pr.md` |
| Jira | [_template-jira.md](./_template-jira.md) | `<slug>.jira.md |

Mesmo `<slug>` (kebab-case) para PR e Jira da mesma feature (ex: `add-filters.pr.md` + `add-filters.jira.md`).

## Nova feature (fluxo spec-driven)

0. Spec: [../specs/](../specs/) — copie `_template.md` → `<slug>.md` e valide com o usuário
1. Jira: copie `_template-jira.md` → `<slug>.jira.md` (referencia a spec)
2. Implemente seguindo `.cursor/rules/architecture/runes-ports-adapters.mdc`
3. Feature doc: [../features/](../features/)
4. PR: copie `_template-pr.md` → `<slug>.pr.md`
5. Atualize este índice

Bugfixes triviais podem pular o passo 0 (spec).

## Comandos

```bash
gh pr create --title "..." --body-file docs/workflow/<slug>.pr.md
```

## Regras Cursor

- `.cursor/rules/workflow/spec-driven.mdc`
- `.cursor/rules/workflow/pr-description.mdc`
- `.cursor/rules/workflow/jira-tasks.mdc`
