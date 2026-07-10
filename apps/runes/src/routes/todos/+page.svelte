<script lang="ts">
	import IconPlus from '$lib/components/icons/IconPlus.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="flex flex-col gap-4 mx-auto w-full max-w-2xl">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold font-display">Minhas listas</h1>
		<a href="/todos/new" class="btn btn-primary btn-sm gap-1.5" data-testid="btn-new-list">
			<IconPlus class="size-4" />
			Nova lista
		</a>
	</div>

	{#if data.lists.length === 0}
		<div class="empty-state">
			<div class="card-body">
				<p class="font-mono text-sm opacity-80" data-testid="no-lists-msg">
					Ainda sem listas. Crie a primeira acima.
				</p>
			</div>
		</div>
	{:else}
		<ul class="flex flex-col gap-2">
			{#each data.lists as list (list.id)}
				<li class="card bg-base-100 border border-base-300 shadow-sm" data-testid="list-item-{list.id}">
					<div class="card-body flex-row items-center justify-between py-3">
						<a href="/todos/{list.id}" class="link link-hover font-medium" data-testid="list-link-{list.id}">{list.title}</a>
						{#if list.public}
							<span class="badge badge-info font-mono" data-testid="list-badge-{list.id}">Pública</span>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
