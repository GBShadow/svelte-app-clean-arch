# Features

Documentação de funcionalidades implementadas no monorepo.

## Índice

| Feature | App | Documento |
|---------|-----|-----------|
| Todo List | classic, remote, runes | [todo-list.md](./todo-list.md) |

## Nova feature

1. Copie [_template.md](./_template.md) para `<slug-da-feature>.md`
2. Preencha todas as seções
3. Adicione entrada em [../CHANGELOG.md](../CHANGELOG.md)
4. Atualize este índice

## PR e Jira (mesma pasta)

- Jira: [../workflow/](../workflow/) → `<slug>.jira.md`
- PR: [../workflow/](../workflow/) → `<slug>.pr.md`

## Regras para agentes de IA

- Feature: `.cursor/rules/documentation/feature-documentation.mdc`
- PR / Jira: `.cursor/rules/workflow/` → `docs/workflow/`
- Sync: `.cursor/rules/meta/rules-sync.mdc` + `CLAUDE.md`

Ver [../README.md](../README.md) para índice completo.
