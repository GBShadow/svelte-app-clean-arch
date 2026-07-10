# Classic — Ports & Adapters (DESCONTINUADO)

## Descrição

Guia para implementar funcionalidades seguindo o padrão Ports & Adapters no app **classic** (Observable/Observer).

> **A partir de 2026-07-09, os apps `classic` e `remote` foram movidos para `deprecated/`.**  
> Toda nova funcionalidade deve seguir o app `runes` (ver skill `runes-ports-adapters`).  
> Esta skill existe apenas como documentação histórica para referência.

## Quando usar (apenas modo histórico)

- Consulta para entender o padrão classic existente em `deprecated/classic/`

## Localização atual

Os arquivos do app classic estão em `deprecated/classic/`.  
Os caminhos abaixo usam a localização original (`apps/classic/`) apenas como referência.

## Checklist (ordem obrigatória)

1. **Domínio** — `packages/todo-domain/src/observable/` (model + `notify()`)
2. **Porta** — `packages/todo-domain/src/gateways/*Gateway.ts` (interface)
3. **Adaptadores** — `TodoMemoryGateway` (testes) + `TodoHttpGateway` (produção classic)
4. **Server store** — `deprecated/classic/src/lib/server/<feature>Store.ts`
5. **API REST** — `deprecated/classic/src/routes/api/<resource>/+server.ts` e `[id]/+server.ts`
6. **UI presentacional** — `deprecated/classic/src/lib/components/<Feature>.svelte` (só props/callbacks)
7. **Container** — `deprecated/classic/src/lib/components/<Feature>Container.svelte` (gateway + Observer)
8. **Rota** — montar Container em `+page.svelte` ou nova rota
9. **Teste** — `<Feature>.test.ts` colocado junto ao componente, com `TodoMemoryGateway`

## Imports

```ts
import TodoList from 'todo-domain/observable/TodoList.js';
import TodoHttpGateway from 'todo-domain/gateways/TodoHttpGateway.js';
import { SEED_TODOS, createId, type TodoItemDTO } from 'todo-domain';
```

## Padrão Container

```svelte
const gateway = new TodoHttpGateway(fetch, '');
let revision = $state(0);
function bump() { revision++; }

list.register(new Observer('addItem', async (item) => {
  await gateway.addItem((item as Item).toDTO());
  bump();
}));
```

## Proibido

- Lógica de negócio em `+server.ts` (apenas persistência/HTTP)
- Gateway HTTP ou Observer dentro do componente presentacional
- Pular testes com `TodoMemoryGateway`
