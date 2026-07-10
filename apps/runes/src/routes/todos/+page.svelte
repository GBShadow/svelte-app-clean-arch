<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Minhas listas</h1>
		<a href="/todos/new" class="btn btn-primary btn-sm">Nova lista</a>
	</div>

	{#if data.lists.length === 0}
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<p class="opacity-70">Você ainda não tem nenhuma lista.</p>
			</div>
		</div>
	{:else}
		<ul class="flex flex-col gap-2">
			{#each data.lists as list (list.id)}
				<li class="card bg-base-100 shadow-xl">
					<div class="card-body flex-row items-center justify-between py-3">
						<a href="/todos/{list.id}" class="link link-hover font-medium">{list.title}</a>
						{#if list.public}
							<span class="badge badge-info">Pública</span>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
