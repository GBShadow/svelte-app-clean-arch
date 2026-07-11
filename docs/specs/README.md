# Specs

**Guia completo:** [../spec-driven-development.md](../spec-driven-development.md)

Especificação **antes** de implementar — o que será construído, por quê, e o desenho Ports & Adapters. Base para Jira, implementação, feature doc e PR (mesmo `<slug>`).

## Índice

| Feature | Status | Spec |
|---------|--------|------|
| Subagente spec-driven | Implementada | [spec-driven-agent.md](./spec-driven-agent.md) |
| Infra PocketBase (Docker + coleções) | Implementada | [pocketbase-infra.md](./pocketbase-infra.md) |
| Autenticação PocketBase (runes) | Implementada | [pocketbase-auth.md](./pocketbase-auth.md) |
| CRUD de usuário (runes) | Implementada | [pocketbase-user-crud.md](./pocketbase-user-crud.md) |
| Todo multi-lista com compartilhamento (runes) | Implementada | [pocketbase-todo-sharing.md](./pocketbase-todo-sharing.md) |
| App Hub (tela inicial) | Implementada | [app-hub.md](./app-hub.md) |
| Chat em tempo real com avatar (runes) | Implementada | [chat-realtime.md](./chat-realtime.md) |
| Push notifications de chat (runes) | Spec aprovada | [chat-notifications.md](./chat-notifications.md) |

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
