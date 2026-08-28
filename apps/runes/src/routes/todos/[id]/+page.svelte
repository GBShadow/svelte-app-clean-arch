<script lang="ts">
	import IconLock from '$lib/components/icons/IconLock.svelte';
	import IconPlus from '$lib/components/icons/IconPlus.svelte';
	import IconTrash from '$lib/components/icons/IconTrash.svelte';
	import IconUnlock from '$lib/components/icons/IconUnlock.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import CategoryBadge from '$lib/components/categories/CategoryBadge.svelte';
	import CategorySelect from '$lib/components/categories/CategorySelect.svelte';
	import Tag from 'lucide-svelte/icons/tag';
	import { enhance } from '$app/forms';
	import { withToast } from '$lib/client/enhanceWithToast';
	import type { PageProps } from './$types';
	import type { CategoryRecord } from '$lib/server/categoryRecord';

	let { data, form }: PageProps = $props();

	let categories = $derived((data.categories || []) as CategoryRecord[]);
	let selectedCategoryFilter = $state<string>('');

	let filteredItems = $derived(
		data.items.filter((item) => {
			if (!selectedCategoryFilter) return true;
			return item.category === selectedCategoryFilter;
		})
	);
</script>

<PageShell width="md" testId="todo-detail-{data.list.id}">
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
				<form method="POST" action="?/updateTitle" novalidate class="flex gap-2" data-testid="update-title-form" use:enhance={withToast({ successMessage: 'Título atualizado!' })}>
					<input
						type="text"
						name="title"
						value={data.list.title}
						placeholder="Título da lista..."
						data-testid="input-edit-title"
						class="input input-bordered flex-1 font-mono text-sm"
						required
					/>
					<button type="submit" class="btn btn-primary btn-sm self-center" data-testid="btn-save-title">
						Salvar
					</button>
				</form>

				<form method="POST" action="?/togglePublic" data-testid="toggle-public-form" use:enhance={withToast({ successMessage: 'Visibilidade alterada!' })}>
					<button type="submit" class="btn btn-outline btn-sm gap-2" data-testid="btn-toggle-public">
						{#if data.list.public}
							<IconLock class="size-4" />
							Tornar privada
						{:else}
							<IconUnlock class="size-4" />
							Tornar pública
						{/if}
					</button>
				</form>

				<form method="POST" action="?/delete" data-testid="delete-list-form" use:enhance={withToast({ successMessage: 'Lista excluída!' })}>
					<button type="submit" class="btn btn-outline btn-error btn-sm gap-2" data-testid="btn-delete-list">
						<IconTrash class="size-4" />
						Excluir lista
					</button>
				</form>
			</div>
		</div>
	{/if}

	<div class="card bg-base-100 border border-base-300 shadow-sm" data-testid="todo-items-card">
		<div class="card-body gap-3">
			<!-- Barra de filtro por categoria -->
			{#if categories.length > 0}
				<div class="flex items-center justify-between gap-2 pb-2 border-b border-base-200">
					<div class="flex items-center gap-1.5 text-xs text-base-content/70">
						<Tag class="size-3.5" />
						<span>Filtrar:</span>
					</div>
					<select
						bind:value={selectedCategoryFilter}
						class="select select-bordered select-xs w-auto max-w-[200px]"
						data-testid="select-todo-category-filter"
					>
						<option value="">Todas as categorias</option>
						{#each categories as cat (cat.id)}
							<option value={cat.id}>{cat.name}</option>
						{/each}
					</select>
				</div>
			{/if}

			{#if filteredItems.length === 0}
				<p class="font-mono text-sm opacity-80 py-2" data-testid="no-items-msg">
					{selectedCategoryFilter
						? 'Nenhuma tarefa encontrada com esta categoria.'
						: 'Ainda sem tarefas. Adicione a primeira abaixo.'}
				</p>
			{/if}

			{#each filteredItems as item (item.id)}
				<div class="flex items-center gap-2 py-1" data-testid="todo-item-{item.id}">
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

					<div class="flex items-center gap-2 flex-1 min-w-0">
						<span class:line-through={item.done} class="truncate" data-testid="item-desc-{item.id}">
							{item.description}
						</span>
						{#if item.expand?.category}
							<CategoryBadge category={item.expand.category} size="xs" clickable={true} />
						{/if}
					</div>

					{#if data.isOwner}
						<form method="POST" action="?/removeItem" use:enhance={withToast({ successMessage: 'Tarefa removida!' })}>
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
				<form
					method="POST"
					action="?/addItem"
					novalidate
					class="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-base-200"
					data-testid="add-item-form"
					use:enhance={withToast({ successMessage: 'Tarefa adicionada!' })}
				>
					<input
						type="text"
						name="description"
						placeholder="Nova tarefa..."
						data-testid="input-add-item"
						class="input input-bordered flex-1 input-sm sm:input-md"
						required
					/>
					<div class="w-full sm:w-48">
						<CategorySelect
							{categories}
							name="category"
							placeholder="Categoria (opcional)"
							size="sm"
							dataTestId="select-add-item-category"
						/>
					</div>
					<button type="submit" class="btn btn-primary btn-sm sm:btn-md gap-1.5" data-testid="btn-add-item">
						<IconPlus class="size-4" />
						Adicionar
					</button>
				</form>
			{/if}
		</div>
	</div>
</PageShell>
