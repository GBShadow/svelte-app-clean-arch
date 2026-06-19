<script lang="ts">
	import type { TodoListService } from '$lib/domain/TodoListService.svelte';
	import type { Item } from '$lib/domain/Item.svelte';

	let { service }: { service: TodoListService } = $props();

	let description = $state('');

	async function handleAdd() {
		if (!description.trim()) return;
		await service.addItem(description);
		description = '';
	}
</script>

{#if service.list.items.length === 0}
	<p>No Item</p>
{/if}

<span class="completed">{service.list.completedPercent}%</span>

{#each service.list.items as item (item.id)}
	<div>
		{item.id}
		<span style:text-decoration={item.done ? 'line-through' : 'none'}>{item.description}</span>
		<button type="button" onclick={() => service.toggleDone(item as Item)}>Done/Undone</button>
		<button type="button" onclick={() => service.removeItem(item as Item)}>Remove</button>
	</div>
{/each}

<hr />

<input
	type="text"
	bind:value={description}
	onkeydown={(e) => e.key === 'Enter' && handleAdd()}
/>
