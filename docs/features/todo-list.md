# Todo List

## Resumo

CRUD de tarefas com percentual de conclusão. Demonstra Ports & Adapters com padrão Observable/Observer no classic e remote, e domínio reativo com runes no app runes.

## App(s) afetado(s)

- **classic** — Observable + REST `/api/todos`
- **remote** — Observable + remote functions (`todos.remote.ts`)
- **runes** — classes `.svelte.ts` em `$lib/domain/` + REST `/api/todos`

## Camadas alteradas

| Camada | Arquivos |
|--------|----------|
| Domínio | `packages/todo-domain/src/observable/TodoList.ts`, `Item.ts`, `Observable.ts`, `Observer.ts` |
| Porta | `packages/todo-domain/src/gateways/TodoGateway.ts` |
| Gateways | `TodoMemoryGateway.ts`, `TodoHttpGateway.ts`, `TodoRemoteGateway.ts` |
| Server (classic/runes) | `apps/classic/src/lib/server/todoStore.ts`, `apps/runes/src/lib/server/todoStore.ts` |
| API | `apps/classic/src/routes/api/todos/+server.ts`, `[id]/+server.ts` |
| UI classic | `TodoList.svelte`, `TodoListContainer.svelte` |
| Domínio runes | `apps/runes/src/lib/domain/TodoList.svelte.ts`, `Item.svelte.ts`, `TodoListService.svelte.ts` |

## Fluxo (Ports & Adapters)

### Classic

```
+page.svelte
  → TodoListContainer.svelte
      → TodoList (observable) + TodoHttpGateway
      → Observer registra addItem/removeItem/toggleDone → gateway → /api/todos
  → TodoList.svelte (presentacional, props + callbacks)
      → todoStore.ts (persistência in-memory no server)
```

### Remote

Mesmo domínio observable; `TodoRemoteGateway` chama remote functions em vez de REST.

### Runes

`TodoListService.svelte.ts` orquestra `TodoList` (runes) + `TodoHttpGateway`; UI consome `service.list` reativamente.

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/todos` | Lista todos |
| POST | `/api/todos` | Cria item |
| PUT | `/api/todos/[id]` | Atualiza done |
| DELETE | `/api/todos/[id]` | Remove item |

## Como testar

```bash
pnpm test
pnpm dev:classic   # http://localhost:5173
pnpm dev:remote    # http://localhost:5174
pnpm dev:runes     # http://localhost:5175
```

Testes unitários usam `TodoMemoryGateway` — sem dependência de API ou server.

## Decisões de design

- Domínio observable fica em `todo-domain` para compartilhar entre classic e remote
- Runes ficam em `apps/runes/src/lib/domain/` (Svelte TS plugin exige contexto SvelteKit)
- Container usa `revision` counter porque objetos de domínio não são reativos no Svelte
- Regra de negócio: máximo 4 itens pendentes; descrições duplicadas ignoradas
