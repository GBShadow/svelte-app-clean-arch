# svelte-app-clean-arch — Guia para Claude

Monorepo SvelteKit com **Ports & Adapters**: três apps (`classic`, `remote`, `runes`) + pacote compartilhado `packages/todo-domain`.

## Regra principal

**Novas funcionalidades = padrão classic**, salvo pedido explícito de `remote` ou `runes`.

## Regras (`.cursor/rules/` — manter sincronizadas com este arquivo)

| Pasta | Arquivo | Propósito |
|-------|---------|-----------|
| architecture | `classic-ports-adapters.mdc` | Ports & Adapters (default) |
| documentation | `feature-documentation.mdc` | Doc em `docs/features/` + CHANGELOG |
| workflow | `spec-driven.mdc` | Spec em `docs/specs/<slug>.md` (antes de implementar) |
| workflow | `pr-description.mdc` | PR em `docs/workflow/<slug>.pr.md` |
| workflow | `jira-tasks.mdc` | Jira em `docs/workflow/<slug>.jira.md` |
| meta | `rules-sync.mdc` | Sincronizar Cursor ↔ Claude |

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

## Manutenção de regras

1. Atualizar `.cursor/rules/<pasta>/<nome>.mdc`
2. Atualizar este `CLAUDE.md`
3. Atualizar `README.md` e `docs/README.md`

## Classic (default)

UI → Container → TodoHttpGateway → /api/ → `$lib/server/*Store.ts`. Testes com `TodoMemoryGateway`.

## Remote / Runes

- **remote:** Observable + `*.remote.ts` + `TodoRemoteGateway`
- **runes:** `$lib/domain/*.svelte.ts` + gateways de `todo-domain`
