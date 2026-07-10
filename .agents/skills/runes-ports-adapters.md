# Runes — Ports & Adapters (default)

## Descrição

Guia para implementar novas funcionalidades seguindo o padrão Ports & Adapters no app **runes** (default).

> **Nota:** Os apps `classic` e `remote` foram movidos para `deprecated/`. A referência ao `classic-ports-adapters` existe apenas como documentação histórica.

## Quando usar

- O usuário pediu uma nova funcionalidade
- O usuário mencionou "runes", "runes app", "default"
- O CLAUDE.md ou regras do projeto indicam runes como default

## Checklist (ordem obrigatória)

1. **Domínio reativo** — `apps/runes/src/lib/domain/<Entity>.svelte.ts` (classe com `$state`/`$derived`, sem gateway)
2. **Service** — `apps/runes/src/lib/domain/<Feature>Service.svelte.ts` (orquestra domínio + gateway, expõe getters)
3. **Porta** — reutilizar `TodoGateway` de `packages/todo-domain/src/gateways/`
4. **Adaptadores** — `TodoMemoryGateway` (testes) + `TodoHttpGateway` (produção)
5. **Server store** — `apps/runes/src/lib/server/<feature>Store.ts`
6. **API REST** — `apps/runes/src/routes/api/<resource>/+server.ts` e `[id]/+server.ts`
7. **UI presentacional** — `apps/runes/src/lib/components/<Feature>.svelte` (recebe `service` via `$props()`)
8. **Container** — `apps/runes/src/lib/components/<Feature>Container.svelte` (gateway + service; `onMount` chama `service.load()`)
9. **Rota** — montar Container em `+page.svelte`
10. **Teste** — `<Feature>Service.test.ts` + `<Feature>.test.ts`, ambos com `TodoMemoryGateway`

## Imports

```ts
import { TodoHttpGateway, TodoMemoryGateway, type TodoGateway } from 'todo-domain';
import { TodoListService } from '$lib/domain/TodoListService.svelte';
```

## Padrão Service + Container

```ts
// domain/<Feature>Service.svelte.ts
export class TodoListService {
	#list = $state(new TodoList());
	get list() { return this.#list; }
	constructor(private gateway: TodoGateway) {}
	async load() { this.#list = TodoList.fromDTO(await this.gateway.getTodos()); }
	async addItem(description: string) { /* muta domínio, então chama gateway */ }
}
```

```svelte
<!-- components/<Feature>Container.svelte -->
const gateway = new TodoHttpGateway(fetch, '');
const service = new TodoListService(gateway);
onMount(() => { void service.load(); });
```

```svelte
<!-- components/<Feature>.svelte -->
let { service }: { service: TodoListService } = $props();
```

## Proibido

- Lógica de negócio em `+server.ts` (apenas persistência/HTTP)
- Gateway HTTP dentro do componente presentacional
- Pular testes com `TodoMemoryGateway`
- Reimplementar Observable/Observer dentro de `apps/runes`
- Implementar gateway customizado no app quando cabe em `todo-domain`
