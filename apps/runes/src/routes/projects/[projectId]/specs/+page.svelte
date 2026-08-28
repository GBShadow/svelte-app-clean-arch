<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import PageShell from '$lib/components/PageShell.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MarkdownEditor from '$lib/components/editor/MarkdownEditor.svelte';
	import CategoryBadge from '$lib/components/categories/CategoryBadge.svelte';
	import CategorySelect from '$lib/components/categories/CategorySelect.svelte';
	let {
		data
	}: {
		data: PageData;
	} = $props();

	let activeTab = $state(data.tab || 'mine');
	let searchQuery = $state(data.q || '');
	let tagFilter = $state(data.tagFilter || '');
	let categoryFilter = $state('');
	let showCreateForm = $state(false);
	let newTitle = $state('');
	let newBody = $state('');
	let newTags = $state('');
	let newCategory = $state('');
	const filteredDocs = $derived(
		data.docs.filter((doc: any) => {
			if (!categoryFilter) return true;
			return doc.category === categoryFilter;
		})
	);
	function switchTab(tab: string) {
		activeTab = tab;
		goto(`/projects/${data.project.id}/specs?tab=${tab}${searchQuery ? `&q=${searchQuery}` : ''}${tagFilter ? `&tag=${tagFilter}` : ''}`, { replaceState: true });
	}

	function applyFilters() {
		const params = new URLSearchParams();
		params.set('tab', activeTab);
		if (searchQuery) params.set('q', searchQuery);
		if (tagFilter) params.set('tag', tagFilter);
		goto(`/projects/${data.project.id}/specs?${params.toString()}`, { replaceState: true });
	}
</script>

<svelte:head>
	<title>Especificações - {data.project?.title}</title>
</svelte:head>

<PageShell width="xl" testId="specs-list-page">
	<a href="/projects/{data.project.id}" class="link link-neutral text-sm mb-2 inline-block">{data.project.title}</a>
	<PageHeader title="Especificações">
		<button
			class="btn btn-primary"
			onclick={() => { showCreateForm = !showCreateForm; }}
		>
			{showCreateForm ? 'Cancelar' : '+ Nova Especificação'}
		</button>
	</PageHeader>
		{#if showCreateForm}
			<div class="card bg-base-100 shadow mb-6">
				<div class="card-body">
					<h2 class="card-title">Nova Especificação</h2>
					<form
						method="POST"
						action="?/createDoc"
						use:enhance={() => {
							showCreateForm = false;
							newBody = '';
							return async ({ update }) => update();
						}}
					>
						<input
							type="text"
							name="title"
							class="input input-bordered w-full mb-2"
							placeholder="Título"
							required
						/>
						<input type="hidden" name="body_md" value={newBody} />
						<MarkdownEditor bind:value={newBody} />
						<input
							type="text"
							name="tags"
							placeholder="Tags (separadas por vírgula)"
						/>
						<div class="mb-3">
							<CategorySelect
								categories={data.categories || []}
								bind:value={newCategory}
								name="category"
								placeholder="Categoria (opcional)"
								size="sm"
								dataTestId="select-new-spec-category"
							/>
						</div>
						<button class="btn btn-primary btn-sm" type="submit">Criar</button>
					</form>
				</div>
			</div>
		{/if}

		<div class="flex items-center gap-4 mb-4 flex-wrap">
			<div class="tabs tabs-box">
				<button
					class="tab {activeTab === 'mine' ? 'tab-active' : ''}"
					onclick={() => switchTab('mine')}
				>
					Minhas Especificações
				</button>
				<button
					class="tab {activeTab === 'shared' ? 'tab-active' : ''}"
					onclick={() => switchTab('shared')}
				>
					Com Acesso
				</button>
			</div>

			<input
				type="text"
				class="input input-bordered input-sm flex-1 min-w-40"
				placeholder="Buscar por nome..."
				bind:value={searchQuery}
				oninput={applyFilters}
			/>

			<select
				class="select select-bordered select-sm"
				value={tagFilter}
				onchange={(e) => { tagFilter = (e.target as HTMLSelectElement).value; applyFilters(); }}
			>
				<option value="">Todas tags</option>
				{#each data.allProjectTags as tag (tag)}
					<option value={tag}>{tag}</option>
				{/each}
			</select>

			{#if data.categories && data.categories.length > 0}
				<select
					class="select select-bordered select-sm"
					bind:value={categoryFilter}
					data-testid="select-specs-category-filter"
				>
					<option value="">Todas categorias</option>
					{#each data.categories as cat (cat.id)}
						<option value={cat.id}>{cat.name}</option>
					{/each}
				</select>
			{/if}
		</div>
		{#if filteredDocs.length === 0}
			<div class="text-center py-16 text-base-content/60">
				<p class="text-lg mb-2">
					{categoryFilter
						? 'Nenhuma especificação encontrada com esta categoria.'
						: activeTab === 'mine'
							? 'Você ainda não criou nenhuma especificação.'
							: 'Nenhum documento compartilhado com você ainda.'}
				</p>
			</div>
		{:else}
			<div class="space-y-2">
				{#each filteredDocs as doc (doc.id)}
					<a
						href="/projects/{data.project.id}/specs/{doc.id}"
						class="block bg-base-100 rounded-box shadow p-4 hover:shadow-md transition"
					>
						<div class="flex items-start justify-between">
							<div>
								<h3 class="font-semibold">{doc.title}</h3>
								<p class="text-xs text-base-content/40 mt-1">
									Atualizado {new Date(doc.updated).toLocaleDateString('pt-BR')}
									&middot; {doc.expand?.created_by?.name ?? 'Desconhecido'}
								</p>
							</div>
							<div class="flex flex-col items-end gap-1.5 shrink-0">
								{#if doc.expand?.category}
									<CategoryBadge category={doc.expand.category} size="xs" clickable={true} />
								{/if}
								{#if doc.tags && doc.tags.length > 0}
									<div class="flex gap-1 flex-wrap">
										{#each doc.tags as tag (tag)}
											<span class="badge badge-ghost badge-sm">{tag}</span>
										{/each}
									</div>
								{/if}
							</div>
					</a>
				{/each}
			</div>
		{/if}
</PageShell>
