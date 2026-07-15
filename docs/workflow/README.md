# Workflow — PR e Jira

**Guia completo (spec-driven):** [../spec-driven-development.md](../spec-driven-development.md)

PR e tarefas Jira na **mesma pasta**. Templates e arquivos gerados ficam em `docs/workflow/`.

## Índice

| Slug | PR | Jira |
|------|----|------|
| `app-hub` | _(pendente)_ | [app-hub.jira.md](./app-hub.jira.md) |
| `chat-realtime` | [chat-realtime.pr.md](./chat-realtime.pr.md) | [chat-realtime.jira.md](./chat-realtime.jira.md) |
| `notifications` | _(pendente)_ | [notifications.jira.md](./notifications.jira.md) |
| `data-testid-e2e` | _(pendente)_ | [data-testid-e2e.jira.md](./data-testid-e2e.jira.md) |
| `dracula-theme-redesign` | [dracula-theme-redesign.pr.md](./dracula-theme-redesign.pr.md) | _(ver app-hub.jira.md)_ |
| `e2e-test-fix-plan` | [e2e-test-fix-plan.pr.md](./e2e-test-fix-plan.pr.md) | [e2e-test-fix-plan.jira.md](./e2e-test-fix-plan.jira.md) |
| `pocketbase-auth` | [pocketbase-auth.pr.md](./pocketbase-auth.pr.md) | [pocketbase-auth.jira.md](./pocketbase-auth.jira.md) |
| `pocketbase-infra` | [pocketbase-infra.pr.md](./pocketbase-infra.pr.md) | [pocketbase-infra.jira.md](./pocketbase-infra.jira.md) |
| `pocketbase-todo-sharing` | [pocketbase-todo-sharing.pr.md](./pocketbase-todo-sharing.pr.md) | [pocketbase-todo-sharing.jira.md](./pocketbase-todo-sharing.jira.md) |
| `pocketbase-user-crud` | [pocketbase-user-crud.pr.md](./pocketbase-user-crud.pr.md) | [pocketbase-user-crud.jira.md](./pocketbase-user-crud.jira.md) |
| `spec-driven-agent` | [spec-driven-agent.pr.md](./spec-driven-agent.pr.md) | [spec-driven-agent.jira.md](./spec-driven-agent.jira.md) |
| `planning-poker` | _(pendente)_ | [planning-poker.jira.md](./planning-poker.jira.md) |
| `kanban` | [kanban.pr.md](./kanban.pr.md) | [kanban.jira.md](./kanban.jira.md) |
| `chat-sender-preservar` | [kanban-fixes-e-poker-backlog.pr.md](./kanban-fixes-e-poker-backlog.pr.md) | [chat-sender-preservar.jira.md](./chat-sender-preservar.jira.md) |
| `poker-backlog-global` | [kanban-fixes-e-poker-backlog.pr.md](./kanban-fixes-e-poker-backlog.pr.md) | [poker-backlog-global.jira.md](./poker-backlog-global.jira.md) |
| `kanban-fixes-e-poker-backlog` | [kanban-fixes-e-poker-backlog.pr.md](./kanban-fixes-e-poker-backlog.pr.md) | _(ver chat-sender-preservar/poker-backlog-global)_ |

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
