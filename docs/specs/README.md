# Specs

**Guia completo:** [../spec-driven-development.md](../spec-driven-development.md)

Especificação **antes** de implementar — o que será construído, por quê, e o desenho Ports & Adapters. Base para Jira, implementação, feature doc e PR (mesmo `<slug>`).

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

> **Ordem de implementação:** o Kanban vem **antes** do Planning Poker — a exportação de tasks do Poker escreve em `kanban_cards` e localiza a coluna `type = 'backlog'`, então as migrations do Kanban precisam existir primeiro.

## Nova spec

1. Copie [_template.md](./_template.md) para `<slug-da-feature>.md`
2. Preencha com o usuário: contexto, objetivo, escopo, requisitos, critérios de aceite, design
3. Valide/alinhe com o usuário **antes** de abrir Jira ou implementar
4. Atualize este índice

## Quando pular a spec

Bugfixes triviais de 1 linha ou mudanças sem impacto de design — vá direto para `docs/workflow/<slug>.jira.md`.

## Fluxo completo (spec-driven)

1. **Spec** — `docs/specs/<slug>.md`
2. **Jira** — `docs/workflow/<slug>.jira.md` (referencia a spec)
3. **Implementar** — `.cursor/rules/architecture/runes-ports-adapters.mdc`
4. **Feature** — `docs/features/<slug>.md`
5. **PR** — `docs/workflow/<slug>.pr.md`

## Regras para agentes de IA

- Spec: `.cursor/rules/workflow/spec-driven.mdc`
- Feature: `.cursor/rules/documentation/feature-documentation.mdc`
- PR / Jira: `.cursor/rules/workflow/` → `docs/workflow/`
- Sync: `.cursor/rules/meta/rules-sync.mdc` + `CLAUDE.md`

Ver [../README.md](../README.md) para índice completo.
