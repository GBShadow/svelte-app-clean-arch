<script lang="ts">
	import type TodoList from 'todo-domain/observable/TodoList.js';
	import type Item from 'todo-domain/observable/Item.js';

	let {
		todoList,
		revision = 0,
		onAddItem,
		onRemoveItem,
		onToggleDone
	}: {
		todoList: TodoList;
		revision?: number;
		onAddItem: (description: string) => void | Promise<void>;
		onRemoveItem: (item: Item) => void | Promise<void>;
		onToggleDone: (item: Item) => void | Promise<void>;
	} = $props();

	let description = $state('');

	async function handleAdd() {
		if (!description.trim()) return;
		await onAddItem(description);
		description = '';
	}
</script>

{#if todoList.items.length === 0}
	<p>No Item</p>
{/if}

{#key revision}
	<span class="completed">{todoList.getCompleted()}%</span>

	{#each todoList.items as item (item.id)}
		<div>
			{item.id}
			<span style:text-decoration={item.done ? 'line-through' : 'none'}>{item.description}</span>
			<button type="button" onclick={() => onToggleDone(item)}>Done/Undone</button>
			<button type="button" onclick={() => onRemoveItem(item)}>Remove</button>
		</div>
	{/each}
{/key}

<hr />

<input
	type="text"
	bind:value={description}
	onkeydown={(e) => e.key === 'Enter' && handleAdd()}
/>
