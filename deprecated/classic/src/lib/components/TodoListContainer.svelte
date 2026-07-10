<script lang="ts">
	import { onMount } from 'svelte';
	import TodoList from 'todo-domain/observable/TodoList.js';
	import Observer from 'todo-domain/observable/Observer.js';
	import TodoHttpGateway from 'todo-domain/gateways/TodoHttpGateway.js';
	import type Item from 'todo-domain/observable/Item.js';
	import TodoListComponent from './TodoList.svelte';

	const gateway = new TodoHttpGateway(fetch, '');

	let todoList = $state<TodoList>(new TodoList());
	let revision = $state(0);
	let ready = $state(false);

	function bump() {
		revision++;
	}

	onMount(async () => {
		const list = TodoList.fromDTO(await gateway.getTodos());

		list.register(
			new Observer('addItem', async (item) => {
				const todoItem = item as Item;
				await gateway.addItem(todoItem.toDTO());
				bump();
			})
		);

		list.register(
			new Observer('removeItem', async (item) => {
				const todoItem = item as Item;
				await gateway.removeItem(todoItem.id);
				bump();
			})
		);

		list.register(
			new Observer('toggleDone', async (item) => {
				const todoItem = item as Item;
				await gateway.updateItem(todoItem.toDTO());
				bump();
			})
		);

		todoList = list;
		ready = true;
		bump();
	});
</script>

{#if ready}
	<TodoListComponent
		{todoList}
		{revision}
		onAddItem={(description) => todoList.addItem(description)}
		onRemoveItem={(item) => todoList.removeItem(item)}
		onToggleDone={(item) => todoList.toggleDone(item)}
	/>
{/if}
