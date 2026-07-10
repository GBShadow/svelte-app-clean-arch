<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<div class="flex flex-col gap-4 max-w-xl">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">{data.list.title}</h1>
		{#if data.list.public}
			<span class="badge badge-info">Pública</span>
		{/if}
	</div>

	{#if form?.errors?.general}
		<div class="alert alert-error" role="alert">{form.errors.general}</div>
	{/if}

	{#if data.isOwner}
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body gap-4">
				<form method="POST" action="?/updateTitle" class="flex gap-2">
					<input
						type="text"
						name="title"
						value={data.list.title}
						class="input input-bordered flex-1"
						required
					/>
					<button type="submit" class="btn btn-primary">Salvar título</button>
				</form>

				<form method="POST" action="?/togglePublic">
					<button type="submit" class="btn btn-outline btn-sm">
						{data.list.public ? 'Tornar privada' : 'Tornar pública'}
					</button>
				</form>

				<form method="POST" action="?/delete">
					<button type="submit" class="btn btn-error btn-sm w-fit">Excluir lista</button>
				</form>
			</div>
		</div>
	{/if}

	<div class="card bg-base-100 shadow-xl">
		<div class="card-body gap-2">
			{#if data.items.length === 0}
				<p class="opacity-70">Nenhum item ainda.</p>
			{/if}

			{#each data.items as item (item.id)}
				<div class="flex items-center gap-2">
					{#if data.isOwner}
						<form method="POST" action="?/toggleItem">
							<input type="hidden" name="itemId" value={item.id} />
							<input
								type="checkbox"
								class="checkbox"
								checked={item.done}
								onchange={(e) => e.currentTarget.form?.requestSubmit()}
							/>
						</form>
					{:else}
						<input type="checkbox" class="checkbox" checked={item.done} disabled />
					{/if}

					<span class:line-through={item.done} class="flex-1">{item.description}</span>

					{#if data.isOwner}
						<form method="POST" action="?/removeItem">
							<input type="hidden" name="itemId" value={item.id} />
							<button type="submit" class="btn btn-ghost btn-xs">Remover</button>
						</form>
					{/if}
				</div>
			{/each}

			{#if data.isOwner}
				<form method="POST" action="?/addItem" class="flex gap-2 mt-2">
					<input
						type="text"
						name="description"
						placeholder="Nova tarefa..."
						class="input input-bordered flex-1"
						required
					/>
					<button type="submit" class="btn btn-primary">Adicionar</button>
				</form>
			{/if}
		</div>
	</div>
</div>
