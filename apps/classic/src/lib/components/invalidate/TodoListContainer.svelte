<script lang="ts">
	import { invalidate } from '$app/navigation';
	import TodoList from 'todo-domain/observable/TodoList.js';
	import Item from 'todo-domain/observable/Item.js';
	import TodoHttpGateway from 'todo-domain/gateways/TodoHttpGateway.js';
	import type { TodoItemDTO } from 'todo-domain';
	import TodoListComponent from './TodoList.svelte';

	let { todos }: { todos: TodoItemDTO[] } = $props();

	const gateway = new TodoHttpGateway(fetch, '');
	const todoList = $derived(TodoList.fromDTO(todos));

	async function refresh() {
		await invalidate('app:todos');
	}

	async function onAddItem(description: string) {
		if (!description.trim()) return;
		if (todoList.items.some((item) => item.description === description)) return;
		if (todoList.items.filter((item) => !item.done).length > 4) return;

		const item = new Item(null, description);
		await gateway.addItem(item.toDTO());
		await refresh();
	}

	async function onRemoveItem(item: Item) {
		await gateway.removeItem(item.id);
		await refresh();
	}

	async function onToggleDone(item: Item) {
		const dto = item.toDTO();
		dto.done = !dto.done;
		await gateway.updateItem(dto);
		await refresh();
	}
</script>

<TodoListComponent {todoList} {onAddItem} {onRemoveItem} {onToggleDone} />
