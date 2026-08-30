<script lang="ts">
	import { enhance } from '$app/forms';
	import PageShell from '$lib/components/PageShell.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Tag from 'lucide-svelte/icons/tag';
	import Plus from 'lucide-svelte/icons/plus';
	import Edit2 from 'lucide-svelte/icons/edit-2';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Search from 'lucide-svelte/icons/search';
	import Layers from 'lucide-svelte/icons/layers';
	import type { PageProps } from './$types';
	import type { CategoryRecord } from '$lib/server/categoryRecord';

	let { data, form }: PageProps = $props();

	let categories = $derived((data.categories || []) as CategoryRecord[]);
	let counts = $derived((data.counts || {}) as Record<string, number>);

	let searchQuery = $state('');
	let isCreateModalOpen = $state(false);
	let editingCategory = $state<CategoryRecord | null>(null);
	let deletingCategory = $state<CategoryRecord | null>(null);

	let filteredCategories = $derived(
		categories.filter((cat) => {
			const query = searchQuery.toLowerCase().trim();
			if (!query) return true;
			return (
				cat.name.toLowerCase().includes(query) ||
				(cat.description && cat.description.toLowerCase().includes(query))
			);
		})
	);

	function openCreateModal() {
		isCreateModalOpen = true;
	}

	function closeCreateModal() {
		isCreateModalOpen = false;
	}

	function openEditModal(category: CategoryRecord) {
		editingCategory = category;
	}

	function closeEditModal() {
		editingCategory = null;
	}

	function openDeleteModal(category: CategoryRecord) {
		deletingCategory = category;
	}

	function closeDeleteModal() {
		deletingCategory = null;
	}
</script>

<PageShell width="xl" testId="categories-page">
	<PageHeader
		title="Categorias"
		description="Gerencie a taxonomia global da aplicação para Todos, Kanban, Poker, Especificações e Retrospectivas"
	>
		<button
			type="button"
			class="btn btn-primary gap-2"
			onclick={openCreateModal}
			data-testid="btn-new-category"
		>
			<Plus class="size-4" />
			Nova Categoria
		</button>
	</PageHeader>

	<!-- Feedback de Erro Geral -->
	{#if form?.errors?.form}
		<div class="alert alert-error mb-6 shadow-sm" data-testid="category-form-error">
			<span>{form.errors.form}</span>
		</div>
	{/if}

	<!-- Barra de Busca -->
	<div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
		<div class="relative w-full sm:w-80">
			<Search class="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
			<input
				type="text"
				placeholder="Buscar categorias..."
				bind:value={searchQuery}
				class="input input-bordered w-full pl-10 rounded-xl bg-base-100/70 border-base-content/15 focus:border-primary text-sm transition-all"
				data-testid="input-search-categories"
			/>
		</div>
		<div class="text-xs text-base-content/60 self-end sm:self-center font-medium">
			Total: <span class="font-bold text-primary">{filteredCategories.length}</span> categoria(s)
		</div>
	</div>

	<!-- Listagem / Grid -->
	{#if filteredCategories.length === 0}
		<div
			class="surface-card rounded-2xl flex flex-col items-center justify-center py-16 px-4 text-center border-dashed"
			data-testid="categories-empty-state"
		>
			<div class="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-inner">
				<Tag class="size-8 opacity-80" />
			</div>
			<h3 class="text-lg font-display font-bold text-base-content">
				{searchQuery ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria cadastrada'}
			</h3>
			<p class="text-sm text-base-content/60 max-w-sm mt-1.5 leading-relaxed">
				{searchQuery
					? 'Tente ajustar os termos da sua busca para encontrar o que procura.'
					: 'Crie sua primeira categoria para começar a classificar e buscar seus itens de trabalho.'}
			</p>
			{#if !searchQuery}
				<button
					type="button"
					class="btn btn-primary btn-sm mt-6 gap-2 rounded-xl font-medium shadow-md shadow-primary/20"
					onclick={openCreateModal}
					data-testid="btn-empty-new-category"
				>
					<Plus class="size-4" />
					Criar primeira categoria
				</button>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="categories-grid">
			{#each filteredCategories as category (category.id)}
				<div
					class="surface-card rounded-2xl p-5 group flex flex-col justify-between"
					data-testid="category-card-{category.id}"
				>
					<div>
						<div class="flex items-start justify-between gap-3">
							<div class="flex items-center gap-2.5 min-w-0">
								<div class="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
									<Tag class="size-5" />
								</div>
								<h3
									class="font-display font-bold text-base truncate text-base-content group-hover:text-primary transition-colors"
									data-testid="category-name-{category.id}"
								>
									{category.name}
								</h3>
							</div>
							<div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-base-300/80 text-base-content/80 border border-base-content/10 shrink-0" title="Itens associados">
								<Layers class="size-3 text-primary" />
								<span>{counts[category.id] || 0}</span>
							</div>
						</div>

						<p class="text-xs text-base-content/65 mt-3.5 line-clamp-2 min-h-[32px] leading-relaxed">
							{category.description || 'Sem descrição.'}
						</p>
					</div>

					<div class="flex items-center justify-between mt-5 pt-3.5 border-t border-base-content/10">
						<a
							href="/categories/{category.id}"
							class="btn btn-ghost btn-xs gap-1.5 text-primary hover:bg-primary/10 rounded-lg font-medium"
							data-testid="btn-view-category-{category.id}"
						>
							Ver itens
							<ArrowRight class="size-3.5" />
						</a>

						<div class="flex items-center gap-1">
							<button
								type="button"
								class="btn btn-ghost btn-xs btn-square rounded-lg text-base-content/70 hover:text-base-content hover:bg-base-content/10"
								onclick={() => openEditModal(category)}
								data-testid="btn-edit-category-{category.id}"
								title="Editar"
							>
								<Edit2 class="size-3.5" />
							</button>
							<button
								type="button"
								class="btn btn-ghost btn-xs btn-square rounded-lg text-error/70 hover:text-error hover:bg-error/10"
								onclick={() => openDeleteModal(category)}
								data-testid="btn-delete-category-{category.id}"
								title="Excluir"
							>
								<Trash2 class="size-3.5" />
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Modal: Criar Categoria -->
	{#if isCreateModalOpen}
		<div class="modal modal-open" role="dialog" data-testid="create-category-modal">
			<div class="modal-box">
				<h3 class="font-bold text-lg flex items-center gap-2 mb-4">
					<Tag class="size-5 text-primary" />
					Nova Categoria
				</h3>

				<form
					method="POST"
					action="?/create"
					use:enhance={() => {
						return async ({ result, update }) => {
							await update();
							if (result.type === 'success') {
								closeCreateModal();
							}
						};
					}}
					class="space-y-4"
				>
					<div class="form-control w-full">
						<label for="create-name" class="label pb-1">
							<span class="label-text font-medium">Nome da Categoria *</span>
						</label>
						<input
							id="create-name"
							type="text"
							name="name"
							required
							maxlength="50"
							placeholder="Ex: Frontend, Urgente, Segurança..."
							class="input input-bordered w-full {form?.errors?.name ? 'input-error' : ''}"
							data-testid="input-category-name"
						/>
						{#if form?.errors?.name}
							<span class="text-error text-xs mt-1">{form.errors.name}</span>
						{/if}
					</div>

					<div class="form-control w-full">
						<label for="create-description" class="label pb-1">
							<span class="label-text font-medium">Descrição (Opcional)</span>
						</label>
						<textarea
							id="create-description"
							name="description"
							maxlength="250"
							rows="3"
							placeholder="Breve resumo da finalidade desta categoria..."
							class="textarea textarea-bordered w-full {form?.errors?.description ? 'textarea-error' : ''}"
							data-testid="input-category-description"
						></textarea>
						{#if form?.errors?.description}
							<span class="text-error text-xs mt-1">{form.errors.description}</span>
						{/if}
					</div>

					<div class="modal-action mt-6">
						<button
							type="button"
							class="btn btn-ghost"
							onclick={closeCreateModal}
							data-testid="btn-cancel-create-category"
						>
							Cancelar
						</button>
						<button
							type="submit"
							class="btn btn-primary"
							data-testid="btn-submit-create-category"
						>
							Criar Categoria
						</button>
					</div>
				</form>
			</div>
			<div class="modal-backdrop" onclick={closeCreateModal}></div>
		</div>
	{/if}

	<!-- Modal: Editar Categoria -->
	{#if editingCategory}
		<div class="modal modal-open" role="dialog" data-testid="edit-category-modal">
			<div class="modal-box">
				<h3 class="font-bold text-lg flex items-center gap-2 mb-4">
					<Edit2 class="size-5 text-primary" />
					Editar Categoria
				</h3>

				<form
					method="POST"
					action="?/update"
					use:enhance={() => {
						return async ({ result, update }) => {
							await update();
							if (result.type === 'success') {
								closeEditModal();
							}
						};
					}}
					class="space-y-4"
				>
					<input type="hidden" name="id" value={editingCategory.id} />

					<div class="form-control w-full">
						<label for="edit-name" class="label pb-1">
							<span class="label-text font-medium">Nome da Categoria *</span>
						</label>
						<input
							id="edit-name"
							type="text"
							name="name"
							value={editingCategory.name}
							required
							maxlength="50"
							class="input input-bordered w-full {form?.errors?.name ? 'input-error' : ''}"
							data-testid="input-edit-category-name"
						/>
						{#if form?.errors?.name}
							<span class="text-error text-xs mt-1">{form.errors.name}</span>
						{/if}
					</div>

					<div class="form-control w-full">
						<label for="edit-description" class="label pb-1">
							<span class="label-text font-medium">Descrição (Opcional)</span>
						</label>
						<textarea
							id="edit-description"
							name="description"
							maxlength="250"
							rows="3"
							class="textarea textarea-bordered w-full {form?.errors?.description ? 'textarea-error' : ''}"
							data-testid="input-edit-category-description"
						>{editingCategory.description || ''}</textarea>
						{#if form?.errors?.description}
							<span class="text-error text-xs mt-1">{form.errors.description}</span>
						{/if}
					</div>

					<div class="modal-action mt-6">
						<button
							type="button"
							class="btn btn-ghost"
							onclick={closeEditModal}
							data-testid="btn-cancel-edit-category"
						>
							Cancelar
						</button>
						<button
							type="submit"
							class="btn btn-primary"
							data-testid="btn-submit-edit-category"
						>
							Salvar Alterações
						</button>
					</div>
				</form>
			</div>
			<div class="modal-backdrop" onclick={closeEditModal}></div>
		</div>
	{/if}

	<!-- Modal: Excluir Categoria -->
	{#if deletingCategory}
		<div class="modal modal-open" role="dialog" data-testid="delete-category-modal">
			<div class="modal-box">
				<h3 class="font-bold text-lg text-error flex items-center gap-2 mb-2">
					<Trash2 class="size-5" />
					Excluir Categoria
				</h3>
				<p class="text-sm text-base-content/80 mt-2">
					Tem certeza que deseja excluir a categoria <strong class="text-base-content">{deletingCategory.name}</strong>?
				</p>
				<p class="text-xs text-base-content/60 mt-2">
					Os itens associados a esta categoria não serão excluídos — apenas o vínculo da categoria será removido.
				</p>

				<form
					method="POST"
					action="?/delete"
					use:enhance={() => {
						return async ({ result, update }) => {
							await update();
							if (result.type === 'success') {
								closeDeleteModal();
							}
						};
					}}
					class="modal-action mt-6"
				>
					<input type="hidden" name="id" value={deletingCategory.id} />
					<button
						type="button"
						class="btn btn-ghost"
						onclick={closeDeleteModal}
						data-testid="btn-cancel-delete-category"
					>
						Cancelar
					</button>
					<button
						type="submit"
						class="btn btn-error"
						data-testid="btn-confirm-delete-category"
					>
						Sim, Excluir
					</button>
				</form>
			</div>
			<div class="modal-backdrop" onclick={closeDeleteModal}></div>
		</div>
	{/if}
</PageShell>
