# Documentação do projeto

**Guia completo:** [spec-driven-development.md](./spec-driven-development.md) — como criar uma nova funcionalidade passo a passo.

**Arquitetura default:** [runes-ports-adapters.md](./runes-ports-adapters.md) — como o app `runes` implementa Ports & Adapters passo a passo.

> **Nota:** Os apps `classic` e `remote` foram movidos para `deprecated/`. Toda nova funcionalidade deve seguir apenas o app `runes`.

| Pasta | Conteúdo | Templates |
|-------|----------|-----------|
| [specs/](./specs/) | Spec antes de implementar | [_template.md](./specs/_template.md) |
| [features/](./features/) | Doc por funcionalidade (pós-implementação) | [_template.md](./features/_template.md) |
| [workflow/](./workflow/) | **PR + Jira (mesma pasta)** | [_template-pr.md](./workflow/_template-pr.md), [_template-jira.md](./workflow/_template-jira.md) |
| [CODE-STRUCTURE.md](./CODE-STRUCTURE.md) | Mapa completo da estrutura do código | — |
| [testing/](./testing/) | Testes e2e (Playwright) | [playwright.md](./testing/playwright.md) |
| [CHANGELOG.md](./CHANGELOG.md) | Histórico de features | — |

## Convenção workflow

Mesmo `<slug>` para arquivos relacionados:

```
docs/workflow/add-filters.jira.md   ← tarefa Jira
docs/workflow/add-filters.pr.md     ← descrição do PR
docs/features/add-filters.md          ← doc da feature
```

## Fluxo (spec-driven)

1. **Spec** — `docs/specs/<slug>.md` (validar com o usuário antes de prosseguir)
2. **Jira** — `docs/workflow/<slug>.jira.md`
3. **Implementar** — seguir `runes-ports-adapters.mdc`
4. **Feature** — `docs/features/<slug>.md` + CHANGELOG
5. **PR** — `docs/workflow/<slug>.pr.md`

Bugfixes triviais podem pular a etapa de spec.

**Skills Freebuff:** `.agents/skills/` contém skills carregáveis pelo comando `skill`:
- `spec-driven` — conduz o fluxo spec-driven conversacionalmente
- `runes-ports-adapters` — guia de implementação runes (default)
- `feature-documentation` — documentação de funcionalidades
- `language-convention` — convenção de idioma
- `code-structure` — ler CODE-STRUCTURE.md antes; atualizar docs depois
- `data-testid` — adicionar data-testid em componentes + usar getByTestId em testes
- `pocketbase-collections` — toda coleção PocketBase precisa dos campos `created`/`updated`

## Leitura prioritária do CODE-STRUCTURE.md

**Antes de qualquer implementação**, leia [docs/CODE-STRUCTURE.md](./CODE-STRUCTURE.md) para:
- Entender a estrutura atual do projeto
- Localizar os arquivos relevantes
- Identificar a camada correta para as mudanças

Ao concluir a tarefa, atualize o CODE-STRUCTURE.md se a estrutura de arquivos/pastas tiver mudado.

## Idioma

Código em inglês; UI e mensagens de erro/validação voltadas ao usuário em português. Ver `.cursor/rules/architecture/language-convention.mdc`.

## Regras para agentes de IA

[README.md](../README.md#regras-para-agentes-de-ia) · [CLAUDE.md](../CLAUDE.md)
