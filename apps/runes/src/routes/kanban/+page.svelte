<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { enhance, applyAction } from '$app/forms';
	import { goto } from '$app/navigation';
	import { createBrowserClient } from '$lib/client/pocketbaseClient';
	import { KanbanBoard } from '$lib/domain/KanbanBoard.svelte';
	import { canDeleteCard } from '$lib/domain/kanbanAccess';
	import Avatar from '$lib/components/Avatar.svelte';
	import RichTextEditor from '$lib/components/kanban/RichTextEditor.svelte';
	import type { PageProps } from './$types';
	import type {
		KanbanColumnRecord,
		KanbanCardRecord,
		KanbanCardCommentRecord,
		KanbanCardHistoryRecord
	} from '$lib/server/kanbanRecord';
	import type { ProjectRecord } from '$lib/server/projectRecord';
	import { dndzone, TRIGGERS, type DndEvent } from 'svelte-dnd-action';
	import Plus from 'lucide-svelte/icons/plus';
	import X from 'lucide-svelte/icons/x';
	import Search from 'lucide-svelte/icons/search';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Award from 'lucide-svelte/icons/award';
	import User from 'lucide-svelte/icons/user';
	import Tag from 'lucide-svelte/icons/tag';
	import Edit from 'lucide-svelte/icons/edit';
	import Trash from 'lucide-svelte/icons/trash';
	import Settings from 'lucide-svelte/icons/settings';
	import FolderKanban from 'lucide-svelte/icons/folder-kanban';
	import Play from 'lucide-svelte/icons/play';
	import Check from 'lucide-svelte/icons/check';

	let { data, form }: PageProps = $props();

	const project = $derived(data.project as ProjectRecord);
	const projects = $derived(data.projects as ProjectRecord[]);
	const activeSprint = $derived(data.activeSprint as any);
	const plannedSprint = $derived(data.plannedSprint as any);
	const canManageProject = $derived(data.canManageProject as boolean);

	// Initialize reactive KanbanBoard with project context
	const board = new KanbanBoard(
		data.columns as unknown as KanbanColumnRecord[],
		data.cards as unknown as KanbanCardRecord[],
		data.comments as unknown as KanbanCardCommentRecord[],
		data.history as unknown as KanbanCardHistoryRecord[],
		(onCol, onCard, onComment, onHistory) => {
			const pb = createBrowserClient(data.token, data.user as any);
			let stopped = false;

			pb.collection('kanban_columns')
				.subscribe<KanbanColumnRecord>('*', (event) => {
					if (stopped) return;
					onCol(event);
				})
				.catch((err) => console.error('[kanban] Falha ao inscrever em kanban_columns:', err));

			pb.collection('kanban_cards')
				.subscribe<KanbanCardRecord>('*', (event) => {
					if (stopped) return;
					onCard(event);
				})
				.catch((err) => console.error('[kanban] Falha ao inscrever em kanban_cards:', err));

			pb.collection('kanban_card_comments')
				.subscribe<KanbanCardCommentRecord>('*', (event) => {
					if (stopped) return;
					onComment(event);
				})
				.catch((err) => console.error('[kanban] Falha ao inscrever em kanban_card_comments:', err));

			pb.collection('kanban_card_history')
				.subscribe<KanbanCardHistoryRecord>('*', (event) => {
					if (stopped) return;
					onHistory(event);
				})
				.catch((err) => console.error('[kanban] Falha ao inscrever em kanban_card_history:', err));

			return () => {
				stopped = true;
				pb.collection('kanban_columns').unsubscribe('*');
				pb.collection('kanban_cards').unsubscribe('*');
				pb.collection('kanban_card_comments').unsubscribe('*');
				pb.collection('kanban_card_history').unsubscribe('*');
			};
		},
		data.project as unknown as ProjectRecord,
		data.activeSprint as any,
		data.plannedSprint as any
	);

	$effect(() => {
		board.sync(
			data.columns as unknown as KanbanColumnRecord[],
			data.cards as unknown as KanbanCardRecord[],
			data.comments as unknown as KanbanCardCommentRecord[],
			data.history as unknown as KanbanCardHistoryRecord[],
			data.project as unknown as ProjectRecord,
			data.activeSprint as any,
			data.plannedSprint as any
		);
	});

	onMount(() => board.start());
	onDestroy(() => board.stop());

	// Deep link handler
	onMount(() => {
		const handleHash = () => {
			const hash = window.location.hash;
			if (hash.startsWith('#card-')) {
				const cardId = hash.slice(6);
				const card = board.cards.find((c) => c.id === cardId);
				if (card) {
					openEditCard(card);
					history.replaceState(null, '', window.location.pathname + window.location.search);
				}
			}
		};
		setTimeout(handleHash, 100);
		window.addEventListener('hashchange', handleHash);
		return () => window.removeEventListener('hashchange', handleHash);
	});

	// Project switcher
	function switchProject(newProjectId: string) {
		goto(`/kanban?project=${newProjectId}`, { invalidateAll: true });
	}

	// Filters
	let filterUser = $state('');
	let filterTag = $state('');
	let filterPoints = $state<number | null>(null);
	let filterDueDate = $state('');
	let filterSprint = $state('all');

	const filteredCards = $derived(
		board.cards.filter((card) => {
			if (filterUser && !card.assignees.includes(filterUser)) return false;
			if (filterTag && !(card.tags || []).includes(filterTag)) return false;
			if (filterPoints !== null && card.points !== filterPoints) return false;
			if (filterDueDate && card.dueDate !== filterDueDate) return false;
			if (filterSprint === 'backlog' && card.sprint) return false;
			if (filterSprint === 'sprint' && !card.sprint) return false;
			return true;
		})
	);

	let localColumnCards = $state<Record<string, KanbanCardRecord[]>>({});

	$effect(() => {
		const grouped: Record<string, KanbanCardRecord[]> = {};
		for (const column of board.columns) {
			grouped[column.id] = [];
		}
		for (const card of filteredCards) {
			(grouped[card.column] ??= []).push(card);
		}
		localColumnCards = grouped;
	});

	function cardsByColumn(columnId: string): KanbanCardRecord[] {
		return localColumnCards[columnId] ?? [];
	}

	const uniqueTags = $derived(
		Array.from(new Set(board.cards.flatMap((c) => c.tags || []))).filter(Boolean)
	);

	// Modals
	let isNewCardOpen = $state(false);
	let isEditCardOpen = $state(false);
	let isNewColumnOpen = $state(false);
	let isManageColumnsOpen = $state(false);

	let selectedCard = $state<KanbanCardRecord | null>(null);
	let selectedColumnId = $state('');

	let cardTitle = $state('');
	let cardDescription = $state('');
	let cardAssignees = $state<string[]>([]);
	let cardTags = $state('');
	let cardPoints = $state<number | null>(null);
	let cardDueDate = $state('');
	let cardSprintId = $state('');

	let columnName = $state('');

	function openCreateCard(columnId: string) {
		selectedColumnId = columnId;
		cardTitle = '';
		cardDescription = '';
		cardAssignees = [];
		cardTags = '';
		cardPoints = null;
		cardDueDate = '';
		cardSprintId = activeSprint?.id || plannedSprint?.id || '';
		isNewCardOpen = true;
	}

	function openEditCard(card: KanbanCardRecord) {
		selectedCard = card;
		cardTitle = card.title;
		cardDescription = card.description || '';
		cardAssignees = card.assignees || [];
		cardTags = (card.tags || []).join(', ');
		cardPoints = card.points;
		cardDueDate = card.dueDate ? card.dueDate.slice(0, 10) : '';
		cardSprintId = card.sprint || '';
		isEditCardOpen = true;
	}

	const usersMap = $derived(new Map(data.users.map((u: any) => [u.id, u])));

	// Drag & Drop
	function handleCardConsider(columnId: string, e: CustomEvent<DndEvent<KanbanCardRecord>>) {
		localColumnCards = { ...localColumnCards, [columnId]: e.detail.items };
	}

	async function handleCardFinalize(columnId: string, e: CustomEvent<DndEvent<KanbanCardRecord>>) {
		localColumnCards = { ...localColumnCards, [columnId]: e.detail.items };

		const { trigger, id } = e.detail.info;
		if (trigger === TRIGGERS.DROPPED_INTO_ZONE) {
			const newPosition = e.detail.items.findIndex((item) => item.id === id);
			if (newPosition === -1) return;

			const form = new FormData();
			form.append('cardId', id);
			form.append('columnId', columnId);
			form.append('position', String(newPosition));

			await fetch('?/moveCard', { method: 'POST', body: form });
		}
	}

	function handleColConsider(e: CustomEvent<DndEvent<KanbanColumnRecord>>) {
		if (!data.user?.isAdmin) return;

		const items = [...e.detail.items];
		const backlogIndex = items.findIndex((c) => c.type === 'backlog');
		if (backlogIndex !== 0) {
			const backlogCol = items.splice(backlogIndex, 1)[0];
			items.unshift(backlogCol);
		}
		const doneIndex = items.findIndex((c) => c.type === 'done');
		if (doneIndex !== items.length - 1) {
			const doneCol = items.splice(doneIndex, 1)[0];
			items.push(doneCol);
		}
		const updatedCols = items.map((col, index) => ({ ...col, position: index }));
		board.sync(updatedCols, board.cards, board.comments, board.history);
	}

	async function handleColFinalize(e: CustomEvent<DndEvent<KanbanColumnRecord>>) {
		if (!data.user?.isAdmin) return;

		const { id } = e.detail.info;
		const finalIndex = e.detail.items.findIndex((item) => item.id === id);

		const form = new FormData();
		form.append('columnId', id);
		form.append('newPosition', String(finalIndex));

		await fetch('?/moveColumn', { method: 'POST', body: form });
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('pt-BR');
	}
</script>

<div class="flex flex-col gap-4 w-full h-full min-h-[85vh]">
	<!-- Project Selector & Sprint Info -->
	<div class="bg-base-100 p-4 rounded-xl border border-base-200 shadow-sm">
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
			<div class="flex items-center gap-3 flex-wrap">
				<!-- Project Switcher -->
				<div class="flex items-center gap-2">
					<FolderKanban class="w-5 h-5 text-primary" />
					<select
						class="select select-bordered select-sm font-semibold"
						value={project?.id ?? ''}
						onchange={(e) => switchProject((e.target as HTMLSelectElement).value)}
					>
						<option value="" disabled selected={!project}>Selecione um projeto</option>
						{#each projects as p}
							<option value={p.id}>{p.title}</option>
						{/each}
					</select>
				</div>

				{#if project}
					<!-- Active Sprint Badge -->
					{#if activeSprint}
						<span class="badge badge-primary gap-1 py-3">
							<Play class="w-3 h-3" />
							{activeSprint.title}
							<span class="opacity-70">({formatDate(activeSprint.startDate)} — {formatDate(activeSprint.endDate)})</span>
						</span>
					{:else if plannedSprint}
						<span class="badge badge-ghost gap-1 py-3">
							<Calendar class="w-3 h-3" />
							{plannedSprint.title} (planejada)
						</span>
					{:else}
						<span class="text-xs opacity-50">Nenhuma sprint ativa</span>
					{/if}
				{/if}
			</div>

			<!-- Actions -->
			<div class="flex items-center gap-2 flex-wrap">
				{#if project && canManageProject}
					<a href="/projects/{project.id}" class="btn btn-outline btn-xs gap-1">
						<Settings class="w-3 h-3" />
						Projeto
					</a>
				{/if}
			</div>
		</div>
	</div>

	{#if project}

	<!-- Filters & Header -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-base-100 p-4 rounded-xl border border-base-200 shadow-sm">
		<div>
			<h1 class="text-2xl font-extrabold font-display tracking-tight">{project.title}</h1>
			<p class="text-sm opacity-60 mt-1">{project.description}</p>
		</div>

		<div class="flex items-center gap-2 flex-wrap">
			<!-- Sprint Filter -->
			<select class="select select-bordered select-sm" bind:value={filterSprint}>
				<option value="all">Todos os cartões</option>
				<option value="sprint">Na sprint</option>
				<option value="backlog">Backlog (sem sprint)</option>
			</select>

			<!-- Filter by User -->
			<select class="select select-bordered select-sm" bind:value={filterUser}>
				<option value="">Filtrar por Responsável</option>
				{#each data.users as u}
					<option value={u.id}>{u.name}</option>
				{/each}
			</select>

			<!-- Filter by Tag -->
			<select class="select select-bordered select-sm" bind:value={filterTag}>
				<option value="">Filtrar por Tag</option>
				{#each uniqueTags as tag}
					<option value={tag}>{tag}</option>
				{/each}
			</select>

			<!-- Filter by Points -->
			<select
				class="select select-bordered select-sm"
				value={filterPoints === null ? '' : String(filterPoints)}
				onchange={(e) => {
					const val = (e.target as HTMLSelectElement).value;
					filterPoints = val === '' ? null : parseInt(val, 10);
				}}
			>
				<option value="">Filtrar por Pontos</option>
				{#each [0,1,2,3,5,8,13,21,34,55,89] as n}
					<option value={n}>{n} SP</option>
				{/each}
			</select>

			<!-- Filter by Date -->
			<div class="relative">
				<input type="date" class="input input-bordered input-sm pr-8" bind:value={filterDueDate} />
				{#if filterDueDate}
					<button
						class="absolute right-2 top-1/2 -translate-y-1/2 text-xs opacity-60 hover:opacity-100"
						onclick={() => (filterDueDate = '')}
					>
						<X class="size-3" />
					</button>
				{/if}
			</div>

			{#if data.user?.isAdmin}
				<button
					class="btn btn-outline btn-sm gap-2"
					onclick={() => (isManageColumnsOpen = true)}
					data-testid="btn-manage-columns"
				>
					<Settings class="size-4" />
					Colunas
				</button>
			{/if}
		</div>
	</div>

	<!-- Alerts -->
	{#if (form as any)?.errors?.general}
		<div class="alert alert-error shadow-sm" role="alert">
			<X class="size-5" />
			<span>{(form as any).errors.general}</span>
		</div>
	{/if}

	<!-- Board -->
	<div
		class="flex gap-4 overflow-x-auto pb-4 items-start flex-1 min-h-[60vh] select-none"
		use:dndzone={{
			items: board.columns,
			type: 'columns',
			dragDisabled: !data.user?.isAdmin,
			flipDurationMs: 150
		}}
		onconsider={handleColConsider}
		onfinalize={handleColFinalize}
	>
		{#each board.columns as column (column.id)}
			<div
				class="bg-base-200/60 border border-base-300 w-80 rounded-2xl flex flex-col max-h-[75vh] shadow-sm flex-shrink-0"
				data-testid="kanban-column-{column.id}"
			>
				<div class="p-4 flex items-center justify-between border-b border-base-300">
					<div class="flex items-center gap-2">
						<h2 class="font-bold text-sm tracking-wide text-base-content/80 uppercase">
							{column.name}
						</h2>
						<span class="badge badge-sm badge-neutral">
							{cardsByColumn(column.id).length}
						</span>
					</div>
					<button
						class="btn btn-ghost btn-circle btn-xs hover:bg-base-300"
						onclick={() => openCreateCard(column.id)}
						data-testid="btn-add-card-{column.id}"
					>
						<Plus class="size-4" />
					</button>
				</div>

				<div
					class="p-3 overflow-y-auto flex-1 flex flex-col gap-3 min-h-[150px]"
					use:dndzone={{
						items: cardsByColumn(column.id),
						type: 'cards',
						flipDurationMs: 150
					}}
					onconsider={(e) => handleCardConsider(column.id, e)}
					onfinalize={(e) => handleCardFinalize(column.id, e)}
				>
					{#each cardsByColumn(column.id) as card (card.id)}
						<button
							type="button"
							class="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-left block w-full focus:outline-none focus:ring-2 focus:ring-primary/50"
							onclick={() => openEditCard(card)}
							data-testid="kanban-card-{card.id}"
						>
							<div class="card-body p-4 gap-3">
								<h3 class="font-semibold text-sm leading-tight text-base-content" data-testid="card-title-{card.id}">
									{card.title}
								</h3>

								<div class="flex items-center justify-between gap-2 mt-1">
									<div class="flex items-center gap-1.5 flex-wrap">
										{#if card.points !== null}
											<div class="badge badge-sm badge-primary gap-1" data-testid="card-points-{card.id}">
												<Award class="size-3" />
												{card.points} SP
											</div>
										{/if}
										{#if card.dueDate}
											<div class="badge badge-sm badge-outline gap-1 text-xs opacity-75">
												<Calendar class="size-3" />
												{new Date(card.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
											</div>
										{/if}
									</div>

									<div class="avatar-group -space-x-3 rtl:space-x-reverse">
										{#each card.assignees.slice(0, 3) as assigneeId}
											{@const user = usersMap.get(assigneeId)}
											{#if user}
												<Avatar userId={user.id} avatar={user.avatar} name={user.name} size="size-5" />
											{/if}
										{/each}
										{#if card.assignees.length > 3}
											<div class="avatar placeholder">
												<div class="bg-neutral text-neutral-content size-5 rounded-full flex items-center justify-center text-[10px]">
													+{card.assignees.length - 3}
												</div>
											</div>
										{/if}
									</div>
								</div>

								{#if card.tags && card.tags.length > 0}
									<div class="flex gap-1 flex-wrap mt-1">
										{#each card.tags as tag}
											<span class="badge badge-xs badge-neutral opacity-80">{tag}</span>
										{/each}
									</div>
								{/if}

								{#if !card.sprint}
									<div class="mt-1">
										<span class="badge badge-xs badge-ghost">Backlog</span>
									</div>
								{/if}
							</div>
						</button>
					{/each}
				</div>
			</div>
		{/each}
	</div>
{:else}
	<div class="flex flex-col items-center justify-center flex-1 py-20 text-center">
		<FolderKanban class="w-20 h-20 text-base-content/15 mb-6" />
		<h2 class="text-2xl font-bold text-base-content/40 mb-2">Nenhum projeto selecionado</h2>
		<p class="text-base-content/30 mb-8 max-w-md">
			Selecione um projeto no menu acima para visualizar e gerenciar o Kanban.
		</p>
	</div>
{/if}
</div>

<!-- Modal: Create Card -->
{#if isNewCardOpen}
	<dialog class="modal modal-open">
		<div class="modal-box max-w-xl">
			<h3 class="font-bold text-lg mb-4">Criar Novo Cartão</h3>
			<form
				method="POST"
				action="?/createCard"
				use:enhance={() => {
					return async ({ update }) => {
						isNewCardOpen = false;
						await update();
					};
				}}
				class="flex flex-col gap-4"
			>
				<input type="hidden" name="columnId" value={selectedColumnId} />
				<input type="hidden" name="projectId" value={project.id} />
				<input type="hidden" name="sprintId" value={cardSprintId} />

				<div class="form-control">
					<label class="label font-medium text-sm" for="new-card-title">Título *</label>
					<input id="new-card-title" type="text" name="title" required
						class="input input-bordered w-full" bind:value={cardTitle}
						placeholder="Digite o título do cartão..." />
				</div>

				<div class="form-control">
					<label class="label font-medium text-sm" for="new-card-desc">Descrição</label>
					<input type="hidden" name="description" value={cardDescription} />
					<RichTextEditor bind:value={cardDescription} />
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="form-control">
						<label class="label font-medium text-sm" for="new-card-points">Pontuação</label>
						<select id="new-card-points" name="points" class="select select-bordered" bind:value={cardPoints}>
							<option value={null}>Sem Estimativa</option>
							{#each [0,1,2,3,5,8,13,21,34,55,89] as n}
								<option value={n}>{n} SP</option>
							{/each}
						</select>
					</div>

					<div class="form-control">
						<label class="label font-medium text-sm" for="new-card-due">Data de Vencimento</label>
						<input id="new-card-due" type="date" name="dueDate"
							class="input input-bordered" bind:value={cardDueDate} />
					</div>
				</div>

				<!-- Sprint Selection -->
				<div class="form-control">
					<label class="label font-medium text-sm" for="new-card-sprint">Sprint</label>
					<select id="new-card-sprint" name="sprintId" class="select select-bordered" bind:value={cardSprintId}>
						<option value="">Backlog (sem sprint)</option>
						{#if activeSprint}
							<option value={activeSprint.id}>{activeSprint.title} (ativa)</option>
						{/if}
						{#if plannedSprint}
							<option value={plannedSprint.id}>{plannedSprint.title} (planejada)</option>
						{/if}
					</select>
				</div>

				<div class="form-control">
					<span class="label font-medium text-sm">Responsáveis</span>
					<div class="flex flex-col gap-1.5 max-h-32 overflow-y-auto border border-base-300 rounded-lg p-2">
						{#each data.users as user}
							<label class="flex items-center gap-2 cursor-pointer py-1 px-1.5 hover:bg-base-200 rounded">
								<input type="checkbox" name="assigneeIds[]" value={user.id}
									checked={cardAssignees.includes(user.id)}
									onchange={(e) => {
										const checked = (e.target as HTMLInputElement).checked;
										cardAssignees = checked ? [...cardAssignees, user.id] : cardAssignees.filter((id) => id !== user.id);
									}}
									class="checkbox checkbox-sm checkbox-primary" />
								<Avatar userId={user.id} avatar={user.avatar} name={user.name} size="size-5" />
								<span class="text-sm">{user.name}</span>
							</label>
						{/each}
					</div>
				</div>

				<div class="form-control">
					<label class="label font-medium text-sm" for="new-card-tags">Tags (separadas por vírgula)</label>
					<input id="new-card-tags" type="text" name="tags" class="input input-bordered"
						bind:value={cardTags} placeholder="ex: bug, frontend, urgente" />
				</div>

				<div class="modal-action">
					<button type="button" class="btn btn-ghost" onclick={() => (isNewCardOpen = false)}>Cancelar</button>
					<button type="submit" class="btn btn-primary" data-testid="btn-save-new-card">Criar</button>
				</div>
			</form>
		</div>
	</dialog>
{/if}

<!-- Modal: Edit Card -->
{#if isEditCardOpen && selectedCard}
	<dialog class="modal modal-open">
		<div class="modal-box max-w-3xl">
			<div class="flex items-center justify-between border-b border-base-200 pb-3 mb-4">
				<h3 class="font-bold text-lg">Detalhes do Cartão</h3>
				<div class="flex items-center gap-2">
					{#if canDeleteCard(data.user?.id, selectedCard)}
						<form method="POST" action="?/deleteCard"
							use:enhance={() => {
								return async ({ update }) => {
									isEditCardOpen = false;
									await update();
								};
							}}
						>
							<input type="hidden" name="cardId" value={selectedCard.id} />
							<button type="submit" class="btn btn-error btn-outline btn-sm gap-1" data-testid="btn-delete-card">
								<Trash class="size-4" />
								Excluir
							</button>
						</form>
					{/if}
					<button class="btn btn-ghost btn-sm btn-circle" onclick={() => (isEditCardOpen = false)}>
						<X class="size-5" />
					</button>
				</div>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<form method="POST" action="?/updateCard"
					use:enhance={() => {
						return async ({ update }) => {
							isEditCardOpen = false;
							await update();
						};
					}}
					class="lg:col-span-2 flex flex-col gap-4"
				>
					<input type="hidden" name="cardId" value={selectedCard.id} />

					<div class="form-control">
						<label class="label font-medium text-sm" for="edit-card-title">Título *</label>
						<input id="edit-card-title" type="text" name="title" required class="input input-bordered w-full" bind:value={cardTitle} />
					</div>

					<div class="form-control">
						<label class="label font-medium text-sm" for="edit-card-desc">Descrição</label>
						<input type="hidden" name="description" value={cardDescription} />
						<RichTextEditor bind:value={cardDescription} />
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="form-control">
							<label class="label font-medium text-sm" for="edit-card-points">Pontuação</label>
							<select id="edit-card-points" name="points" class="select select-bordered" bind:value={cardPoints}>
							<option value={null}>Sem Estimativa</option>
							{#each [0,1,2,3,5,8,13,21,34,55,89] as n}
								<option value={n}>{n} SP</option>
							{/each}
							</select>
						</div>

						<div class="form-control">
							<label class="label font-medium text-sm" for="edit-card-due">Data de Vencimento</label>
							<input id="edit-card-due" type="date" name="dueDate" class="input input-bordered" bind:value={cardDueDate} />
						</div>
					</div>

					<!-- Sprint Selection -->
					<div class="form-control">
						<label class="label font-medium text-sm" for="edit-card-sprint">Sprint</label>
						<select id="edit-card-sprint" name="sprintId" class="select select-bordered" bind:value={cardSprintId}>
							<option value="">Backlog (sem sprint)</option>
							{#if activeSprint}
								<option value={activeSprint.id}>{activeSprint.title} (ativa)</option>
							{/if}
							{#if plannedSprint}
								<option value={plannedSprint.id}>{plannedSprint.title} (planejada)</option>
							{/if}
						</select>
					</div>

					<div class="form-control">
						<span class="label font-medium text-sm">Responsáveis</span>
						<div class="flex flex-col gap-1.5 max-h-32 overflow-y-auto border border-base-300 rounded-lg p-2">
							{#each data.users as user}
								<label class="flex items-center gap-2 cursor-pointer py-1 px-1.5 hover:bg-base-200 rounded">
									<input type="checkbox" name="assigneeIds[]" value={user.id}
										checked={cardAssignees.includes(user.id)}
										onchange={(e) => {
											const checked = (e.target as HTMLInputElement).checked;
											cardAssignees = checked ? [...cardAssignees, user.id] : cardAssignees.filter((id) => id !== user.id);
										}}
										class="checkbox checkbox-sm checkbox-primary" />
									<Avatar userId={user.id} avatar={user.avatar} name={user.name} size="size-5" />
									<span class="text-sm">{user.name}</span>
								</label>
							{/each}
						</div>
					</div>

					<div class="form-control">
						<label class="label font-medium text-sm" for="edit-card-tags">Tags</label>
						<input id="edit-card-tags" type="text" name="tags" class="input input-bordered" bind:value={cardTags} />
					</div>

					<div class="flex gap-2 justify-end mt-2">
						<button type="button" class="btn btn-ghost" onclick={() => (isEditCardOpen = false)}>Fechar</button>
						<button type="submit" class="btn btn-primary" data-testid="btn-save-card">Salvar Alterações</button>
					</div>
				</form>

				<div class="flex flex-col gap-6 border-t lg:border-t-0 lg:border-l border-base-200 pt-6 lg:pt-0 lg:pl-6 max-h-[70vh] overflow-y-auto">
					<!-- Comments -->
					<div class="flex flex-col gap-3">
						<h4 class="font-bold text-sm text-base-content/85 flex items-center gap-1.5">
							Comentários ({board.comments.filter((c) => c.card === selectedCard?.id).length})
						</h4>
						<div class="flex flex-col gap-2 max-h-56 overflow-y-auto border border-base-200 rounded-xl p-2 bg-base-50">
							{#each board.comments.filter((c) => c.card === selectedCard?.id) as comment (comment.id)}
								<div class="bg-base-100 p-2.5 rounded-lg border border-base-200 relative group flex gap-2">
									<Avatar userId={comment.user} avatar={comment.expand?.user?.avatar || ''}
										name={comment.expand?.user?.name || ''} size="size-5" />
									<div class="flex-1">
										<div class="flex items-center justify-between">
											<span class="text-xs font-bold text-base-content/80">{comment.expand?.user?.name || 'Desconhecido'}</span>
											<span class="text-[10px] opacity-50">{new Date(comment.created).toLocaleDateString('pt-BR')}</span>
										</div>
										<p class="text-sm mt-1 text-base-content/90 font-light break-words">{comment.text}</p>
									</div>
									{#if comment.user === data.user?.id}
										<form method="POST" action="?/deleteComment" use:enhance
											class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
											<input type="hidden" name="commentId" value={comment.id} />
											<button type="submit" class="btn btn-ghost btn-xs text-error p-0.5 min-h-0 h-auto">
												<X class="size-3" />
											</button>
										</form>
									{/if}
								</div>
							{:else}
								<p class="text-xs text-center opacity-50 py-4">Nenhum comentário.</p>
							{/each}
						</div>
						<form method="POST" action="?/addComment"
							use:enhance={() => {
								return async ({ update }) => {
									await update({ reset: true });
								};
							}}
							class="flex gap-2"
						>
							<input type="hidden" name="cardId" value={selectedCard.id} />
							<input type="text" name="text" required placeholder="Escreva um comentário..." class="input input-bordered input-sm flex-1" data-testid="input-comment" />
							<button type="submit" class="btn btn-sm btn-outline" data-testid="btn-add-comment">Enviar</button>
						</form>
					</div>

					<!-- History -->
					<div class="flex flex-col gap-3 border-t border-base-200 pt-4">
						<h4 class="font-bold text-sm text-base-content/85">Histórico de Alterações</h4>
						<div class="flex flex-col gap-2 max-h-48 overflow-y-auto border border-base-200 rounded-xl p-2 bg-base-50 text-xs">
							{#each board.history.filter((h) => h.card === selectedCard?.id) as h (h.id)}
								<div class="py-1 border-b border-base-200/60 last:border-b-0">
									<span class="font-semibold">{h.expand?.user?.name || 'Sistema'}</span>
									<span class="opacity-75">
										{h.field === 'created' ? 'criou o cartão' :
										h.field === 'title' ? 'alterou o título' :
										h.field === 'description' ? 'alterou a descrição' :
										h.field === 'column' ? 'moveu o cartão de coluna' :
										h.field === 'assignees' ? 'alterou os responsáveis' :
										h.field === 'points' ? 'alterou os Story Points' :
										h.field === 'tags' ? 'alterou as tags' :
										h.field === 'dueDate' ? 'alterou a data de vencimento' :
										h.field === 'sprint' ? 'alterou a sprint' :
										`alterou o campo ${h.field}`}
									</span>
									<span class="block text-[10px] opacity-50 mt-0.5">{new Date(h.created).toLocaleString('pt-BR')}</span>
								</div>
							{:else}
								<p class="text-xs text-center opacity-50 py-4">Nenhuma alteração registrada.</p>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	</dialog>
{/if}

<!-- Modal: Manage Columns -->
{#if isManageColumnsOpen}
	<dialog class="modal modal-open">
		<div class="modal-box max-w-md">
			<div class="flex items-center justify-between border-b border-base-200 pb-3 mb-4">
				<h3 class="font-bold text-lg">Gerenciar Colunas</h3>
				<button class="btn btn-ghost btn-sm btn-circle" onclick={() => (isManageColumnsOpen = false)}>
					<X class="size-5" />
				</button>
			</div>

			<form method="POST" action="?/createColumn"
				use:enhance={() => {
					return async ({ update }) => {
						columnName = '';
						await update();
					};
				}}
				class="flex gap-2 mb-6"
			>
				<input type="hidden" name="projectId" value={project.id} />
				<input type="text" name="name" required placeholder="Nome da nova coluna..." class="input input-bordered input-sm flex-1"
					bind:value={columnName} data-testid="input-new-column-name" />
				<button type="submit" class="btn btn-sm btn-primary gap-1" data-testid="btn-create-column">
					<Plus class="size-4" />
					Adicionar
				</button>
			</form>

			<div class="flex flex-col gap-2 max-h-64 overflow-y-auto">
				{#each board.columns as column}
					<div class="flex items-center justify-between bg-base-100 border border-base-300 p-2.5 rounded-xl">
						<div class="flex flex-col">
							<span class="font-semibold text-sm">{column.name}</span>
							<span class="text-xs opacity-50 uppercase tracking-wider">{column.type}</span>
						</div>
						<div class="flex items-center gap-1">
							{#if column.type === 'custom'}
								<form method="POST" action="?/renameColumn" use:enhance class="flex gap-1">
									<input type="hidden" name="columnId" value={column.id} />
									<input type="text" name="name" required placeholder="Novo nome" class="input input-bordered input-xs w-28" />
									<button type="submit" class="btn btn-xs btn-outline">OK</button>
								</form>
								<form method="POST" action="?/deleteColumn"
									use:enhance={() => {
										return async ({ update }) => {
											await update();
										};
									}}
								>
									<input type="hidden" name="columnId" value={column.id} />
									<button type="submit" class="btn btn-ghost btn-xs text-error hover:bg-error/10" data-testid="btn-delete-column-{column.id}">
										<Trash class="size-4" />
									</button>
								</form>
							{:else}
								<span class="text-xs opacity-40 px-2 select-none">Fixa</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<div class="modal-action">
				<button class="btn btn-neutral btn-sm" onclick={() => (isManageColumnsOpen = false)}>Fechar</button>
			</div>
		</div>
	</dialog>
{/if}
