# SvelteKit Todo App — Ports & Adapters

Monorepo com três apps SvelteKit demonstrando o padrão Ports & Adapters a partir do projeto de referência Vue/Express.

Gerenciado com **pnpm workspaces** + **Turborepo**.

## Apps

| App | Domínio | Server | Porta |
|---|---|---|---|
| `apps/classic` | Observable/Observer | REST `/api/todos` | 5173 |
| `apps/remote` | Observable/Observer | Remote functions | 5174 |
| `apps/runes` | Runes em `.svelte.ts` | REST `/api/todos` | 5175 |

## Pacote compartilhado

`packages/todo-domain` contém:

- `observable/` — `TodoList extends Observable`, `Observer`
- `gateways/` — `TodoMemoryGateway`, `TodoHttpGateway`, `TodoRemoteGateway`

Domínio runes vive em `apps/runes/src/lib/domain/` (classes `.svelte.ts`).

## Documentação

- [Índice geral](./docs/README.md)
- [Features](./docs/features/) — documentação por funcionalidade
- [Workflow](./docs/workflow/) — **PR e Jira na mesma pasta** (`<slug>.pr.md`, `<slug>.jira.md`)
- [Changelog](./docs/CHANGELOG.md) — histórico resumido

## Regras para agentes de IA

Regras em `.cursor/rules/<pasta>/` — resumo em [`CLAUDE.md`](./CLAUDE.md).

| Pasta | Arquivo | Propósito |
|-------|---------|-----------|
| `architecture/` | `classic-ports-adapters.mdc` | Ports & Adapters (default) |
| `documentation/` | `feature-documentation.mdc` | Doc features + CHANGELOG |
| `workflow/` | `pr-description.mdc` | `docs/workflow/<slug>.pr.md` |
| `workflow/` | `jira-tasks.mdc` | `docs/workflow/<slug>.jira.md` |
| `meta/` | `rules-sync.mdc` | Sincronizar Cursor ↔ Claude |

Ao adicionar ou alterar regras, atualize **Cursor**, **CLAUDE.md**, **README** e **docs/README.md**.

## Comandos

```bash
pnpm install
pnpm test
pnpm build
pnpm check

pnpm dev:classic
pnpm dev:remote
pnpm dev:runes

# ou via turbo diretamente
pnpm turbo run dev --filter=classic
pnpm turbo run test --filter=todo-domain
```

## Testabilidade

Todos os apps podem ser testados com `TodoMemoryGateway`, sem depender de API real ou server-side.
