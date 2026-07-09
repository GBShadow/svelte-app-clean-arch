# Workflow — PR e Jira

**Guia completo (spec-driven):** [../spec-driven-development.md](../spec-driven-development.md)

PR e tarefas Jira na **mesma pasta**. Templates e arquivos gerados ficam em `docs/workflow/`.

## Índice

| Slug | PR | Jira |
|------|----|------|
| `pocketbase-infra` | _(pendente)_ | [pocketbase-infra.jira.md](./pocketbase-infra.jira.md) |
| `pocketbase-auth` | _(pendente)_ | [pocketbase-auth.jira.md](./pocketbase-auth.jira.md) |
| `pocketbase-user-crud` | _(pendente)_ | [pocketbase-user-crud.jira.md](./pocketbase-user-crud.jira.md) |
| `pocketbase-todo-sharing` | _(pendente)_ | [pocketbase-todo-sharing.jira.md](./pocketbase-todo-sharing.jira.md) |

## Convenção de nomes

| Tipo | Template | Arquivo gerado |
|------|----------|----------------|
| Pull Request | [_template-pr.md](./_template-pr.md) | `<slug>.pr.md` |
| Jira | [_template-jira.md](./_template-jira.md) | `<slug>.jira.md |

Mesmo `<slug>` (kebab-case) para PR e Jira da mesma feature (ex: `add-filters.pr.md` + `add-filters.jira.md`).

## Nova feature (fluxo spec-driven)

0. Spec: [../specs/](../specs/) — copie `_template.md` → `<slug>.md` e valide com o usuário
1. Jira: copie `_template-jira.md` → `<slug>.jira.md` (referencia a spec)
2. Implemente seguindo `.cursor/rules/architecture/runes-ports-adapters.mdc` (default; `classic-ports-adapters.mdc` se pedido explicitamente)
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
