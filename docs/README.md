# Documentação do projeto

| Pasta | Conteúdo | Templates |
|-------|----------|-----------|
| [features/](./features/) | Doc por funcionalidade | [_template.md](./features/_template.md) |
| [workflow/](./workflow/) | **PR + Jira (mesma pasta)** | [_template-pr.md](./workflow/_template-pr.md), [_template-jira.md](./workflow/_template-jira.md) |
| [testing/](./testing/) | Testes e2e (Playwright) | [playwright.md](./testing/playwright.md) |
| [CHANGELOG.md](./CHANGELOG.md) | Histórico de features | — |

## Convenção workflow

Mesmo `<slug>` para arquivos relacionados:

```
docs/workflow/add-filters.jira.md   ← tarefa Jira
docs/workflow/add-filters.pr.md     ← descrição do PR
docs/features/add-filters.md          ← doc da feature
```

## Fluxo

1. **Jira** — `docs/workflow/<slug>.jira.md`
2. **Implementar** — `.cursor/rules/architecture/classic-ports-adapters.mdc`
3. **Feature** — `docs/features/<slug>.md` + CHANGELOG
4. **PR** — `docs/workflow/<slug>.pr.md`

## Regras para agentes de IA

[README.md](../README.md#regras-para-agentes-de-ia) · [CLAUDE.md](../CLAUDE.md)
