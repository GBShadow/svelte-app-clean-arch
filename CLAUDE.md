# svelte-app-clean-arch — Guia para Claude

Monorepo SvelteKit com **Ports & Adapters**: três apps (`classic`, `remote`, `runes`) + pacote compartilhado `packages/todo-domain`.

## Regra principal

**Novas funcionalidades = padrão runes**, salvo pedido explícito de `classic` ou `remote`.

## Regras (`.cursor/rules/` — manter sincronizadas com este arquivo)

| Pasta | Arquivo | Propósito |
|-------|---------|-----------|
| architecture | `runes-ports-adapters.mdc` | Ports & Adapters (default) |
| architecture | `classic-ports-adapters.mdc` | Ports & Adapters (Observable/Observer, sob pedido) |
| architecture | `language-convention.mdc` | Idioma: código em inglês, UI/erros em português |
| documentation | `feature-documentation.mdc` | Doc em `docs/features/` + CHANGELOG |
| workflow | `spec-driven.mdc` | Spec em `docs/specs/<slug>.md` (antes de implementar) |
| workflow | `pr-description.mdc` | PR em `docs/workflow/<slug>.pr.md` |
| workflow | `jira-tasks.mdc` | Jira em `docs/workflow/<slug>.jira.md` |
| meta | `rules-sync.mdc` | Sincronizar Cursor ↔ Claude |
| meta | `commit-convention.mdc` | Sem trailer de co-autoria em commits/PRs |

PR e Jira ficam na **mesma pasta** `docs/workflow/`, com o mesmo `<slug>`.

## Documentação e workflow (spec-driven)

| Quando | Arquivo | Template |
|--------|---------|----------|
| Antes de implementar (nova feature não trivial) | `docs/specs/<slug>.md` | `docs/specs/_template.md` |
| Criar tarefa Jira | `docs/workflow/<slug>.jira.md` | `docs/workflow/_template-jira.md` |
| Concluir feature | `docs/features/<slug>.md` | `docs/features/_template.md` |
| Changelog | `docs/CHANGELOG.md` | — |
| Criar PR | `docs/workflow/<slug>.pr.md` | `docs/workflow/_template-pr.md` |

Fluxo: **spec → Jira → implementar → feature doc → PR**, mesmo `<slug>` em todos. Bugfixes triviais podem pular a spec.

Índice: [docs/README.md](./docs/README.md)

## Comandos

```bash
pnpm install && pnpm test && pnpm check
pnpm dev:classic   # :5173
gh pr create --body-file docs/workflow/<slug>.pr.md
```

## Commits e PRs

Sem trailer de co-autoria (`Co-Authored-By: Claude ...`) em commits ou PRs deste repositório.

## Manutenção de regras

1. Atualizar `.cursor/rules/<pasta>/<nome>.mdc`
2. Atualizar este `CLAUDE.md`
3. Atualizar `README.md` e `docs/README.md`

## Idioma

Código (variáveis, funções, comentários, nomes de tabelas/colunas no banco) em **inglês**. Texto voltado ao usuário — UI e mensagens de erro/validação retornadas ao usuário — em **português**. Documentação (specs, PR, Jira, features, CHANGELOG) em português. Ver `.cursor/rules/architecture/language-convention.mdc`.

## Runes (default)

UI → Container (`onMount` + `service.load()`) → `TodoListService` (`$lib/domain/*.svelte.ts`, com `$state`/`$derived`) → `TodoHttpGateway` → `/api/` → `$lib/server/*Store.ts`. Testes com `TodoMemoryGateway`.

## Classic / Remote

- **classic:** Observable/Observer + Container com `revision`/`bump()` + `TodoHttpGateway`
- **remote:** Observable + `*.remote.ts` + `TodoRemoteGateway`
