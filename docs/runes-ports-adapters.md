# Arquitetura do app `runes` — Ports & Adapters com Svelte 5 Runes

> Este documento explica, passo a passo, como o app `apps/runes` implementa Ports & Adapters usando **runes nativos do Svelte 5** (`$state`, `$derived`, `$props`) em vez do padrão Observable/Observer usado em `classic`/`remote`. É o padrão **default** para novas funcionalidades (ver [`CLAUDE.md`](../CLAUDE.md) e [`.cursor/rules/architecture/runes-ports-adapters.mdc`](../.cursor/rules/architecture/runes-ports-adapters.mdc)).

## Visão geral do fluxo

```
+page.svelte
    │
    ▼
TodoListContainer.svelte  ──cria──▶  TodoHttpGateway (todo-domain)
    │                                        │
    │ instancia                              │ HTTP fetch
    ▼                                        ▼
TodoListService (domain/*.svelte.ts)   /api/todos/+server.ts
    │                                        │
    │ contém                                 │ chama
    ▼                                        ▼
TodoList (domain/*.svelte.ts)          $lib/server/todoStore.ts
    │                                   (dados em memória)
    │ contém
    ▼
Item (domain/*.svelte.ts)
```

A UI (`TodoList.svelte`) recebe o `service` via `$props()` e só lê/chama métodos — nunca toca no gateway diretamente.

## Passo a passo

### 1. Domínio reativo — `$lib/domain/*.svelte.ts`

Diferente do `classic` (que usa classes `Observable` + `Observer` de `todo-domain` para notificar mudanças manualmente), o `runes` modela o domínio como classes comuns cujos campos usam **runes** do Svelte 5. Isso torna as instâncias reativas nativamente, sem precisar de um mecanismo de notificação:

**`Item.svelte.ts`** — entidade folha:

```ts
export class Item {
	id = $state<string>('');
	description = $state<string>('');
	done = $state<boolean>(false);

	constructor(id: string | null, description: string, done = false) {
		this.id = id ?? createId();
		this.description = description;
		this.done = done;
	}

	toDTO(): TodoItemDTO { /* serializa para o gateway */ }
}
```

**`TodoList.svelte.ts`** — agregado:

```ts
export class TodoList {
	items = $state<Item[]>([]);

	completedPercent = $derived.by(() => {
		// recalculado automaticamente sempre que `items` muda
	});

	addItem(description: string) { /* regras de negócio: sem duplicata, limite de pendentes, etc. */ }
	removeItem(item: Item) { /* ... */ }
	toggleDone(item: Item) { /* ... */ }
}
```

Pontos-chave:
- `$state` torna o campo/array reativo — qualquer mutação (`items.push(...)`, `item.done = true`) já dispara re-render em quem lê esse estado.
- `$derived.by(...)` cria um valor computado que se atualiza sozinho quando suas dependências (`items`) mudam.
- As regras de negócio (não duplicar item, limite de 4 pendentes, etc.) vivem **aqui**, não na rota da API nem no componente.

### 2. Service — orquestra domínio + gateway

**`TodoListService.svelte.ts`** é a camada que conecta o domínio reativo à porta (`TodoGateway`):

```ts
export class TodoListService {
	#list = $state(new TodoList());
	get list() { return this.#list; }

	constructor(private gateway: TodoGateway) {}

	async load() {
		this.#list = TodoList.fromDTO(await this.gateway.getTodos());
	}

	async addItem(description: string) {
		this.#list.addItem(description);           // 1. muta o domínio (UI já reage)
		const item = this.#list.getItem(description);
		if (item) await this.gateway.addItem(item.toDTO()); // 2. persiste via gateway
	}
	// removeItem, toggleDone seguem o mesmo padrão: muta local, depois persiste
}
```

O padrão em cada método de mutação é sempre **"otimista"**: primeiro muda o estado local (a UI atualiza na hora, pois `#list` usa `$state`), depois chama o gateway para persistir. Não existe `revision`/`bump()` manual como no `classic` — os runes cuidam disso.

### 3. Porta (interface) — reaproveitada de `todo-domain`

O contrato não muda entre apps. `packages/todo-domain/src/gateways/TodoGateway.ts`:

```ts
export interface TodoGateway {
	getTodos(): Promise<TodoItemDTO[]>;
	addItem(item: TodoItemDTO): Promise<void>;
	updateItem(item: TodoItemDTO): Promise<void>;
	removeItem(id: string): Promise<void>;
}
```

### 4. Adaptadores — também reaproveitados

- **`TodoHttpGateway`** (produção): faz `fetch` para `/api/todos`.
- **`TodoMemoryGateway`** (testes): mantém um array em memória, mesma interface.

Nenhum dos dois é reimplementado dentro de `apps/runes` — ambos vêm de `packages/todo-domain`.

### 5. Server store — `$lib/server/todoStore.ts`

Funções simples de CRUD sobre um array em memória do lado do servidor (`getTodos`, `addTodo`, `updateTodo`, `removeTodo`). Sem lógica de negócio — isso já foi decidido no domínio reativo do passo 1.

### 6. API REST — `routes/api/todos/+server.ts` e `[id]/+server.ts`

Rotas SvelteKit padrão (`GET`/`POST` em `/api/todos`, `PUT`/`DELETE` em `/api/todos/[id]`) que apenas chamam o `todoStore` e devolvem JSON/status. Fazem o papel de adaptador HTTP do lado do servidor.

### 7. UI presentacional — `lib/components/TodoList.svelte`

```svelte
<script lang="ts">
	let { service }: { service: TodoListService } = $props();
	let description = $state('');
</script>

{#each service.list.items as item (item.id)}
	<!-- lê service.list.items e service.list.completedPercent diretamente -->
{/each}
```

Recebe o `service` pronto via `$props()`. Não sabe nada sobre HTTP nem sobre como os dados chegaram — só chama `service.addItem(...)`, `service.toggleDone(...)`, `service.removeItem(...)`.

### 8. Container — `lib/components/TodoListContainer.svelte`

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { TodoListService } from '$lib/domain/TodoListService.svelte';
	import { TodoHttpGateway } from 'todo-domain';
	import TodoListComponent from './TodoList.svelte';

	const gateway = new TodoHttpGateway(fetch, '');
	const service = new TodoListService(gateway);

	onMount(() => {
		void service.load();
	});
</script>

<TodoListComponent {service} />
```

É o único lugar que conhece o gateway concreto (`TodoHttpGateway`) e monta o `service`. Troque `TodoHttpGateway` por `TodoMemoryGateway` aqui (ou nos testes) para trocar o adaptador sem tocar em domínio ou UI.

### 9. Rota — `routes/+page.svelte`

Apenas monta o Container:

```svelte
<TodoListContainer />
```

### 10. Testes — sempre com `TodoMemoryGateway`

Dois níveis, ambos evitando rede/HTTP real:

- **`TodoListService.test.ts`** — testa o service isoladamente (carregar, adicionar, etc.) com `TodoMemoryGateway`.
- **`TodoList.test.ts`** (componente) — teste de integração leve do fluxo `service` + domínio, também com `TodoMemoryGateway`.

## Runes vs. Classic — a diferença central

| Aspecto | `classic` | `runes` |
|---|---|---|
| Reatividade do domínio | Manual: `Observable`/`Observer`, `notify()` | Nativa: `$state`, `$derived` |
| Forçar re-render na UI | `revision` + `bump()` no Container | Automático (mutar `$state` já re-renderiza) |
| Onde vive o domínio | `packages/todo-domain/src/observable/` | `apps/runes/src/lib/domain/*.svelte.ts` |
| Gateway/porta/API/server | Iguais (reaproveitados de `todo-domain`) | Iguais (reaproveitados de `todo-domain`) |

Ou seja: **gateway, porta e camada de API/servidor são idênticos entre os três apps** — a diferença real está em como o domínio notifica a UI sobre mudanças.

## Ver também

- [`CLAUDE.md`](../CLAUDE.md) — regra principal e tabela de regras
- [`.cursor/rules/architecture/runes-ports-adapters.mdc`](../.cursor/rules/architecture/runes-ports-adapters.mdc) — checklist para IA ao implementar uma feature
- [`.cursor/rules/architecture/classic-ports-adapters.mdc`](../.cursor/rules/architecture/classic-ports-adapters.mdc) — padrão alternativo (Observable/Observer)
