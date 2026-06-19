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
- `runes/` — classes reativas com `$state` e `$derived`
- `gateways/` — `TodoMemoryGateway`, `TodoHttpGateway`, `TodoRemoteGateway`

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
