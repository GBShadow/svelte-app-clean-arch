<script lang="ts">
	import { onMount } from 'svelte';
	import TodoList from 'todo-domain/observable/TodoList.js';
	import Observer from 'todo-domain/observable/Observer.js';
	import TodoRemoteGateway from 'todo-domain/gateways/TodoRemoteGateway.js';
	import type Item from 'todo-domain/observable/Item.js';
	import {
		addTodoItem,
		getTodoList,
		removeTodoItem,
		toggleTodoItem
	} from '../../routes/todos.remote';
	import TodoListComponent from './TodoList.svelte';

	const gateway = new TodoRemoteGateway({
		getTodoList: () => getTodoList(),
		addTodoItem: (input) => addTodoItem(input),
		toggleTodoItem: (input) => toggleTodoItem(input),
		removeTodoItem: (input) => removeTodoItem(input)
	});

	let todoList = $state<TodoList>(new TodoList());
	let revision = $state(0);

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
		bump();
	});
</script>

<TodoListComponent
	{todoList}
	{revision}
	onAddItem={(description) => todoList.addItem(description)}
	onRemoveItem={(item) => todoList.removeItem(item)}
	onToggleDone={(item) => todoList.toggleDone(item)}
/>
