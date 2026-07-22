<script lang="ts">
	import IconLock from '$lib/components/icons/IconLock.svelte';
	import IconPlus from '$lib/components/icons/IconPlus.svelte';
	import IconTrash from '$lib/components/icons/IconTrash.svelte';
	import IconUnlock from '$lib/components/icons/IconUnlock.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<div class="flex flex-col gap-4 max-w-xl mx-auto w-full">
	<div class="flex items-center gap-2">
		<a href="/todos" class="btn btn-ghost btn-sm btn-square shrink-0 tooltip tooltip-right" data-testid="btn-back-lists" data-tip="Voltar" aria-label="Voltar">
			<svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
		</a>
		<h1 class="text-2xl font-bold font-display flex-1 min-w-0 truncate">{data.list.title}</h1>
		{#if data.list.public}
			<span class="badge badge-info font-mono shrink-0" data-testid="list-public-badge">Pública</span>
		{/if}
	</div>

	{#if form?.errors?.general}
		<div class="alert alert-error" role="alert" data-testid="error-todo">{form.errors.general}</div>
	{/if}

	{#if data.isOwner}
		<div class="card bg-base-100 border border-base-300 shadow-sm">
			<div class="card-body gap-4">
				<form method="POST" action="?/updateTitle" novalidate class="flex gap-2" data-testid="update-title-form">
					<input
						type="text"
						name="title"
						data-testid="input-title"
						value={data.list.title}
						class="input input-bordered flex-1"
						required
					/>
					<button type="submit" class="btn btn-primary" data-testid="btn-save-title">Salvar título</button>
				</form>

				<form method="POST" action="?/togglePublic" data-testid="toggle-public-form">
					<button type="submit" class="btn btn-outline btn-sm gap-1.5" data-testid="btn-toggle-public">
						{#if data.list.public}
							<IconLock class="size-4" />
							Tornar privada
						{:else}
							<IconUnlock class="size-4" />
							Tornar pública
						{/if}
					</button>
				</form>

				<form method="POST" action="?/delete" data-testid="delete-list-form">
					<button type="submit" class="btn btn-error btn-sm w-fit gap-1.5" data-testid="btn-delete-list">
						<IconTrash class="size-4" />
						Excluir lista
					</button>
				</form>
			</div>
		</div>
	{/if}

	<div class="card bg-base-100 border border-base-300 shadow-sm" data-testid="todo-items-card">
		<div class="card-body gap-2">
			{#if data.items.length === 0}
				<p class="font-mono text-sm opacity-80" data-testid="no-items-msg">
					Ainda sem tarefas. Adicione a primeira abaixo.
				</p>
			{/if}

			{#each data.items as item (item.id)}
				<div class="flex items-center gap-2" data-testid="todo-item-{item.id}">
					{#if data.isOwner}
						<form method="POST" action="?/toggleItem">
							<input type="hidden" name="itemId" value={item.id} />
							<input
								type="checkbox"
								data-testid="checkbox-item-{item.id}"
								class="checkbox"
								checked={item.done}
								onchange={(e) => e.currentTarget.form?.requestSubmit()}
							/>
						</form>
					{:else}
						<input type="checkbox" class="checkbox" checked={item.done} disabled />
					{/if}

					<span class:line-through={item.done} class="flex-1" data-testid="item-desc-{item.id}">{item.description}</span>

					{#if data.isOwner}
						<form method="POST" action="?/removeItem">
							<input type="hidden" name="itemId" value={item.id} />
							<button type="submit" class="btn btn-ghost btn-xs gap-1 text-error hover:bg-error/10" data-testid="btn-remove-item-{item.id}">
								<IconTrash class="size-3.5" />
								Remover
							</button>
						</form>
					{/if}
				</div>
			{/each}

			{#if data.isOwner}
				<form method="POST" action="?/addItem" novalidate class="flex gap-2 mt-2" data-testid="add-item-form">
					<input
						type="text"
						name="description"
						placeholder="Nova tarefa..."
						data-testid="input-add-item"
						class="input input-bordered flex-1"
						required
					/>
					<button type="submit" class="btn btn-primary gap-1.5" data-testid="btn-add-item">
						<IconPlus class="size-4" />
						Adicionar
					</button>
				</form>
			{/if}
		</div>
	</div>
</div>
