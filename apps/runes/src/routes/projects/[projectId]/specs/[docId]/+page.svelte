<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import PageShell from '$lib/components/PageShell.svelte';
	import SpecPermissionManager from '$lib/components/specs/SpecPermissionManager.svelte';
	import SpecTaskCreator from '$lib/components/specs/SpecTaskCreator.svelte';
	import MarkdownEditor from '$lib/components/editor/MarkdownEditor.svelte';

	let {
		data
	}: {
		data: PageData;
	} = $props();

	let isEditing = $state(false);
	let showPermissionManager = $state(false);
	let showTaskCreator = $state(false);
	let editTitle = $state('');
	let editBody = $state('');
	let editTags = $state('');
	let saveMessage = $state('');
	let viewTheme = $state<'dark' | 'light'>('dark');

	onMount(() => {
		editTitle = data.doc.title;
		editBody = data.doc.body_md;
		editTags = data.tags.join(', ');
	});

	const permissions = $derived(data.permissions);
	const linkedTasks = $derived(data.linkedTasks);
	const linkedCards = $derived(data.linkedCards);

	const isOwner = $derived(data.canManagePermissions);

	function toggleEdit() {
		isEditing = !isEditing;
		if (isEditing) {
			editTitle = data.doc.title;
			editBody = data.doc.body_md;
			editTags = data.tags.join(', ');
		}
	}

	function toggleTheme() {
		viewTheme = viewTheme === 'dark' ? 'light' : 'dark';
	}
</script>

<svelte:head>
	<title>{data.doc.title} - Especificações</title>
</svelte:head>

<PageShell width="2xl" class="flex flex-col" testId="specs-doc-page">
	<a href="/projects/{data.project.id}/specs" class="link link-neutral text-sm mb-2 inline-block shrink-0">
		&larr; Voltar para especificações
	</a>

		{#if saveMessage}
			<div class="alert alert-success mb-4 shrink-0">{saveMessage}</div>
		{/if}

		{#if isEditing && data.canEdit}
			<div class="card bg-base-100 shadow mb-4 flex flex-col flex-1 min-h-0">
				<div class="card-body flex flex-col flex-1 min-h-0">
					<form
						method="POST"
						action="?/updateDoc"
						class="flex flex-col flex-1 min-h-0"
						use:enhance={() => {
							return async ({ update }) => {
								await update();
								isEditing = false;
								saveMessage = 'Documento salvo!';
								setTimeout(() => { saveMessage = ''; }, 3000);
							};
						}}
					>
						<div class="shrink-0">
							<input type="hidden" name="tags" value={editTags} />
							<input
								type="text"
								name="title"
								class="input input-bordered w-full text-lg font-bold mb-3"
								bind:value={editTitle}
								required
							/>

							<div class="flex items-center gap-2 mb-3">
								<button class="btn btn-primary btn-sm" type="submit">Salvar</button>
								<button class="btn btn-ghost btn-sm" type="button" onclick={toggleEdit}>Cancelar</button>
								<div class="flex-1"></div>
								<div class="tooltip tooltip-top" data-tip={viewTheme === 'dark' ? 'Tema claro' : 'Tema escuro'}>
									<button type="button" class="btn btn-ghost btn-sm btn-square"
										onclick={toggleTheme}
									>
										{viewTheme === 'dark' ? '☀️' : '🌙'}
									</button>
								</div>
							</div>

							<input
								type="text"
								name="tags"
								class="input input-bordered w-full mb-3"
								placeholder="Tags (separadas por vírgula)"
								bind:value={editTags}
							/>
						</div>

						<input type="hidden" name="body_md" value={editBody} />
						<div class="flex-1 min-h-0">
							<MarkdownEditor bind:value={editBody} fullHeight bind:theme={viewTheme} />
						</div>
					</form>
				</div>
			</div>
		{/if}

		{#if !isEditing}
			<div class="card bg-base-100 shadow mb-4 flex flex-col flex-1 min-h-0">
				<div class="card-body flex flex-col flex-1 min-h-0">
					<div class="flex items-start justify-between mb-4 shrink-0">
						<div>
							<h1 class="text-2xl font-bold">{data.doc.title}</h1>
							<p class="text-xs text-base-content/40 mt-1">
								{data.doc.expand?.created_by?.name ?? 'Desconhecido'}
								&middot; Atualizado {new Date(data.doc.updated).toLocaleDateString('pt-BR')}
							</p>
						</div>
						<div class="flex items-center gap-1">
							{#if data.canEdit}
								<button class="btn btn-outline btn-sm" onclick={toggleEdit}>Editar</button>
							{/if}
							{#if data.canDelete}
								<form method="POST" action="?/deleteDoc" use:enhance class="inline">
									<button class="btn btn-outline btn-sm text-error">Excluir</button>
								</form>
							{/if}
							<div class="tooltip tooltip-top" data-tip={viewTheme === 'dark' ? 'Tema claro' : 'Tema escuro'}>
								<button type="button" class="btn btn-ghost btn-sm btn-square ml-1"
									onclick={toggleTheme}
								>
									{viewTheme === 'dark' ? '☀️' : '🌙'}
								</button>
							</div>
						</div>
					</div>

					{#if data.tags.length > 0}
						<div class="flex gap-1 mb-4 shrink-0">
							{#each data.tags as tag (tag)}
								<span class="badge badge-ghost">{tag}</span>
							{/each}
						</div>
					{/if}

					<div class="flex-1 min-h-0">
						<MarkdownEditor
							value={data.doc.body_md || 'Nenhum conteúdo.'}
							readonly
							fullHeight
							bind:theme={viewTheme}
						/>
					</div>
				</div>
			</div>

			<div class="shrink-0 space-y-4">
				{#if data.canManagePermissions}
					<div class="card bg-base-100 shadow">
						<div class="card-body p-4">
							<div class="flex items-center gap-2">
								<form method="POST" action="?/togglePublic" use:enhance>
									<button class="btn btn-outline btn-xs">
										{data.doc.is_public_link ? 'Desabilitar' : 'Habilitar'} link público
									</button>
								</form>
								<span class="text-xs text-base-content/40">
									{data.doc.is_public_link ? 'Qualquer pessoa logada com o link pode ver' : 'Apenas quem tem permissão vê'}
								</span>
							</div>
						</div>
					</div>
				{/if}

				{#if data.canManagePermissions}
					<div class="card bg-base-100 shadow">
						<div class="card-body p-4">
							<button
								class="btn btn-outline btn-xs"
								onclick={() => { showPermissionManager = !showPermissionManager; }}
							>
								{showPermissionManager ? 'Fechar' : 'Gerenciar permissões'}
							</button>
							{#if showPermissionManager}
								<SpecPermissionManager
									documentId={data.doc.id}
									{permissions}
									users={data.users}
								/>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<div class="card bg-base-100 shadow mt-4 shrink-0">
				<div class="card-body p-4">
					<h2 class="card-title text-lg">Tasks vinculadas</h2>

					{#if linkedTasks.length === 0 && linkedCards.length === 0}
						<p class="text-sm text-base-content/40">Nenhuma task vinculada.</p>
					{/if}

					{#if linkedTasks.length > 0}
						<div class="space-y-1 mb-2">
							<h3 class="text-sm font-semibold">Backlog Global</h3>
							{#each linkedTasks as task (task.id)}
								<div class="flex items-center gap-2 text-sm">
									<span class="badge badge-sm {task.status === 'exported' ? 'badge-success' : 'badge-ghost'}">{task.status}</span>
									<span>{task.title}</span>
								</div>
							{/each}
						</div>
					{/if}

					{#if linkedCards.length > 0}
						<div class="space-y-1">
							<h3 class="text-sm font-semibold">Kanban</h3>
							{#each linkedCards as card (card.id)}
								<div class="text-sm">
									<a href="/kanban?project={data.project.id}#card-{card.id}" class="link">
										{card.title}
									</a>
								</div>
							{/each}
						</div>
					{/if}

					{#if data.canEdit}
						<div class="mt-3">
							<button
								class="btn btn-primary btn-sm"
								onclick={() => { showTaskCreator = !showTaskCreator; }}
							>
								{showTaskCreator ? 'Cancelar' : '+ Criar task no backlog'}
							</button>

							{#if showTaskCreator}
								<div class="mt-2">
									<SpecTaskCreator
										documentId={data.doc.id}
										projectId={data.project.id}
									/>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			{#if !data.canManagePermissions && permissions.length > 0}
				<div class="card bg-base-100 shadow mt-4 shrink-0">
					<div class="card-body p-4">
						<h3 class="font-semibold text-sm">Permissões concedidas a você</h3>
						{#each permissions as perm (perm.id)}
							{#if perm.expand?.user?.id === data.doc.created_by}
								<span class="badge badge-sm">{perm.role === 'edit' ? 'Pode editar' : 'Pode ver'}</span>
							{/if}
						{/each}
					</div>
				</div>
			{/if}
		{/if}
</PageShell>
