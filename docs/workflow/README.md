# Workflow — PR e Jira

PR e tarefas Jira na **mesma pasta**. Templates e arquivos gerados ficam em `docs/workflow/`.

## Índice

| Slug | PR | Jira |
|------|----|------|
| — | — | _(nenhum ainda)_ |

## Convenção de nomes

| Tipo | Template | Arquivo gerado |
|------|----------|----------------|
| Pull Request | [_template-pr.md](./_template-pr.md) | `<slug>.pr.md` |
| Jira | [_template-jira.md](./_template-jira.md) | `<slug>.jira.md |

Mesmo `<slug>` (kebab-case) para PR e Jira da mesma feature (ex: `add-filters.pr.md` + `add-filters.jira.md`).

## Nova feature (fluxo)

1. Jira: copie `_template-jira.md` → `<slug>.jira.md`
2. Implemente seguindo `.cursor/rules/architecture/classic-ports-adapters.mdc`
3. Feature doc: [../features/](../features/)
4. PR: copie `_template-pr.md` → `<slug>.pr.md`
5. Atualize este índice

## Comandos

```bash
gh pr create --title "..." --body-file docs/workflow/<slug>.pr.md
```

## Regras Cursor

- `.cursor/rules/workflow/pr-description.mdc`
- `.cursor/rules/workflow/jira-tasks.mdc`
