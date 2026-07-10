# Features

Documentação de funcionalidades implementadas no monorepo.

## Índice

| Feature | App | Documento |
|---------|-----|-----------|
| Todo List | classic, remote (~~deprecated~~), runes | [todo-list.md](./todo-list.md) |
| Subagente spec-driven | — (agente de processo) | [spec-driven-agent.md](./spec-driven-agent.md) |
| Infra PocketBase (Docker + coleções) | — (infra, sem app) | [pocketbase-infra.md](./pocketbase-infra.md) |
| Autenticação PocketBase (runes) | runes | [pocketbase-auth.md](./pocketbase-auth.md) |
| Correção de testes e2e (Playwright) | runes (e2e) | [e2e-test-fix-plan.md](./e2e-test-fix-plan.md) |
| CRUD de usuário (runes) | runes | [pocketbase-user-crud.md](./pocketbase-user-crud.md) |
| Todo multi-lista com compartilhamento (runes) | runes | [pocketbase-todo-sharing.md](./pocketbase-todo-sharing.md) |

## Nova feature

1. Copie [_template.md](./_template.md) para `<slug-da-feature>.md`
2. Preencha todas as seções
3. Adicione entrada em [../CHANGELOG.md](../CHANGELOG.md)
4. Atualize este índice

## Spec, PR e Jira

- Spec (antes de implementar): [../specs/](../specs/) → `<slug>.md`
- Jira: [../workflow/](../workflow/) → `<slug>.jira.md`
- PR: [../workflow/](../workflow/) → `<slug>.pr.md`

## Regras para agentes de IA

- Spec: `.cursor/rules/workflow/spec-driven.mdc`
- Feature: `.cursor/rules/documentation/feature-documentation.mdc`
- PR / Jira: `.cursor/rules/workflow/` → `docs/workflow/`
- Sync: `.cursor/rules/meta/rules-sync.mdc` + `CLAUDE.md`

Ver [../README.md](../README.md) para índice completo.
