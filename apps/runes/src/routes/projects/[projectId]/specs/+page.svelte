<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import MarkdownEditor from '$lib/components/editor/MarkdownEditor.svelte';

	let {
		data
	}: {
		data: PageData;
	} = $props();

	let activeTab = $state(data.tab || 'mine');
	let searchQuery = $state(data.q || '');
	let tagFilter = $state(data.tagFilter || '');
	let showCreateForm = $state(false);
	let newTitle = $state('');
	let newBody = $state('');
	let newTags = $state('');

	const filteredDocCount = $derived(data.docs.length);

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

<div class="min-h-screen bg-base-200 p-4">
	<div class="max-w-5xl mx-auto">
		<div class="flex items-center justify-between mb-6">
			<div>
				<a href="/projects/{data.project.id}" class="link link-neutral text-sm">
					{data.project.title}
				</a>
				<h1 class="text-2xl font-bold mt-1">Especificações</h1>
			</div>
			<button
				class="btn btn-primary"
				onclick={() => {
					showCreateForm = !showCreateForm;
				}}
			>
				{showCreateForm ? 'Cancelar' : '+ Nova Especificação'}
			</button>
		</div>

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
							class="input input-bordered w-full mb-2 mt-2"
							placeholder="Tags (separadas por vírgula)"
						/>
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
		</div>

		{#if data.docs.length === 0}
			<div class="text-center py-16 text-base-content/60">
				<p class="text-lg mb-2">
					{activeTab === 'mine' ? 'Você ainda não criou nenhuma especificação.' : 'Nenhum documento compartilhado com você ainda.'}
				</p>
			</div>
		{:else}
			<div class="space-y-2">
				{#each data.docs as doc (doc.id)}
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
	</div>
</div>
