# Features

Documentação de funcionalidades implementadas no monorepo.

## Índice

| Feature | App | Criada | Documento |
|---------|-----|--------|-----------|
| Todo List | classic, remote (~~deprecated~~), runes | 2026-06-18 | [2026-06-18-todo-list.md](./2026-06-18-todo-list.md) |
| Infra PocketBase (Docker + coleções) | — (infra, sem app) | 2026-07-09 | [2026-07-09-pocketbase-infra.md](./2026-07-09-pocketbase-infra.md) |
| Autenticação PocketBase (runes) | runes | 2026-07-09 | [2026-07-09-pocketbase-auth.md](./2026-07-09-pocketbase-auth.md) |
| CRUD de usuário (runes) | runes | 2026-07-09 | [2026-07-09-pocketbase-user-crud.md](./2026-07-09-pocketbase-user-crud.md) |
| Todo multi-lista com compartilhamento (runes) | runes | 2026-07-09 | [2026-07-09-pocketbase-todo-sharing.md](./2026-07-09-pocketbase-todo-sharing.md) |
| Subagente spec-driven | — (agente de processo) | 2026-07-09 | [2026-07-09-spec-driven-agent.md](./2026-07-09-spec-driven-agent.md) |
| Correção de testes e2e (Playwright) | runes (e2e) | 2026-07-10 | [2026-07-10-e2e-test-fix-plan.md](./2026-07-10-e2e-test-fix-plan.md) |
| Tema Dracula + redesign visual (runes) | runes | 2026-07-10 | [2026-07-10-dracula-theme.md](./2026-07-10-dracula-theme.md) |
| App Hub — tela inicial com grid de apps | runes | 2026-07-10 | [2026-07-10-app-hub.md](./2026-07-10-app-hub.md) |
| Chat em tempo real com avatar (runes) | runes | 2026-07-11 | [2026-07-11-chat-realtime.md](./2026-07-11-chat-realtime.md) |
| Quadro Kanban reativo e seguro (runes) | runes | 2026-07-12 | [2026-07-12-kanban.md](./2026-07-12-kanban.md) |
| Planning Poker em tempo real | runes | 2026-07-12 | [2026-07-12-planning-poker.md](./2026-07-12-planning-poker.md) |
| Notificações Push (self-hosted) | runes | 2026-07-15 | [2026-07-15-notifications.md](./2026-07-15-notifications.md) |
| Projetos, Sprints e contexto no Kanban + Poker | runes | 2026-07-21 | [2026-07-21-projects-sprints-kanban.md](./2026-07-21-projects-sprints-kanban.md) |
| UI improvements — accent, toast, chat, kanban, todos | runes | 2026-07-22 | [2026-07-22-ui-improvements.md](./2026-07-22-ui-improvements.md) |

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
