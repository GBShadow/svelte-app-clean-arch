<script lang="ts">
	import IconPlus from '$lib/components/icons/IconPlus.svelte';
	import Search from 'lucide-svelte/icons/search';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let search = $state('');
	let filtered = $derived(
		search
			? data.lists.filter((l) => l.title.toLowerCase().includes(search.toLowerCase()))
			: data.lists
	);
</script>

<div class="flex flex-col gap-4 mx-auto w-full max-w-2xl">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold font-display">Minhas listas</h1>
		<a href="/todos/new" class="btn btn-primary btn-sm gap-1.5" data-testid="btn-new-list">
			<IconPlus class="size-4" />
			Nova lista
		</a>
	</div>

	{#if data.lists.length > 0}
		<label class="input input-bordered flex items-center gap-2 w-full">
			<Search class="size-4 shrink-0 text-base-content/40" />
			<input
				type="search"
				placeholder="Pesquisar listas..."
				class="grow"
				bind:value={search}
				data-testid="input-search-list"
			/>
		</label>
	{/if}

	{#if data.lists.length === 0}
		<div class="empty-state">
			<div class="card-body">
				<p class="font-mono text-sm opacity-80" data-testid="no-lists-msg">
					Ainda sem listas. Crie a primeira acima.
				</p>
			</div>
		</div>
	{:else if filtered.length === 0}
		<div class="empty-state">
			<div class="card-body">
				<p class="font-mono text-sm opacity-80">Nenhuma lista encontrada para "{search}".</p>
			</div>
		</div>
	{:else}
		<div class="flex flex-col gap-3">
			{#each filtered as list (list.id)}
				<a
					href="/todos/{list.id}"
					class="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md hover:border-base-content/20 transition-all"
					data-testid="list-item-{list.id}"
				>
					<div class="card-body p-4 flex-row items-center justify-between">
						<div class="flex flex-col gap-0.5">
							<span class="font-semibold text-base" data-testid="list-link-{list.id}">{list.title}</span>
							{#if list.public}
								<span class="badge badge-info badge-sm font-mono w-fit" data-testid="list-badge-{list.id}">Pública</span>
							{/if}
						</div>
						<svg class="size-5 text-base-content/30 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
