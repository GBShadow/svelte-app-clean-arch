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

<div class="flex flex-col gap-4">
	<div class="flex items-center gap-3">
		<progress
			class="progress progress-primary w-full"
			value={service.list.completedPercent}
			max="100"
		></progress>
		<span class="badge badge-primary whitespace-nowrap">{service.list.completedPercent}%</span>
	</div>

	{#if service.list.items.length === 0}
		<div role="alert" class="alert alert-info">
			<span>No Item</span>
		</div>
	{/if}

	<ul class="flex flex-col gap-2">
		{#each service.list.items as item (item.id)}
			<li class="flex items-center gap-3 rounded-box bg-base-100 p-3 shadow-sm">
				<input
					type="checkbox"
					class="checkbox checkbox-primary"
					checked={item.done}
					onchange={() => service.toggleDone(item as Item)}
				/>
				<span class="grow" style:text-decoration={item.done ? 'line-through' : 'none'}>
					{item.description}
				</span>
				<button
					type="button"
					class="btn btn-error btn-sm"
					onclick={() => service.removeItem(item as Item)}
				>
					Remove
				</button>
			</li>
		{/each}
	</ul>

	<div class="divider"></div>

	<div class="flex gap-2">
		<input
			type="text"
			class="input input-bordered w-full"
			placeholder="Add a new todo..."
			bind:value={description}
			onkeydown={(e) => e.key === 'Enter' && handleAdd()}
		/>
		<button type="button" class="btn btn-primary" onclick={handleAdd}>Add</button>
	</div>
</div>
