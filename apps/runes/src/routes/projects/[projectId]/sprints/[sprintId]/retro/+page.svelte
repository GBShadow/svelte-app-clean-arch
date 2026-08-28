<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import RetroColumn from '$lib/components/retro/RetroColumn.svelte';
	import RetroParticipants from '$lib/components/retro/RetroParticipants.svelte';
	import { RetroBoard } from '$lib/domain/RetroBoard.svelte';
import PageShell from '$lib/components/PageShell.svelte';
	import { createBrowserClient } from '$lib/client/pocketbaseClient';
	import type {
		RetroRecord,
		RetroColumnRecord,
		RetroCardRecord,
		RetroParticipantRecord
	} from '$lib/server/retroRecord';
	import type { ProjectRecord, SprintRecord } from '$lib/server/projectRecord';

	let {
		data
	}: {
		data: PageData;
	} = $props();

	let editTokens = $state<Map<string, string>>(new Map());
	let showAddParticipant = $state(false);
	let participantUserId = $state('');
	let addParticipantMessage = $state('');
	let newColumnName = $state('');
	let showCreateColumn = $state(false);
	let showFinalizeConfirm = $state(false);
	let selectedCategoryFilter = $state('');
	function loadEditTokens(): Map<string, string> {
		try {
			const stored = localStorage.getItem('retroEditTokens');
			if (stored) {
				const parsed = JSON.parse(stored);
				return new Map(Object.entries(parsed));
			}
		} catch {
			/* ignore */
		}
		return new Map();
	}

	function saveEditTokens(tokens: Map<string, string>): void {
		const obj: Record<string, string> = {};
		tokens.forEach((v, k) => {
			obj[k] = v;
		});
		localStorage.setItem('retroEditTokens', JSON.stringify(obj));
	}

	const board = new RetroBoard(
		(onRetro, onColumn, onCard, onParticipant) => {
			const pb = createBrowserClient(data.token, data.user as any);
			let stopped = false;

			pb.collection('retrospectives')
				.subscribe('*', (e) => {
					if (stopped) return;
					onRetro({ action: e.action, record: e.record as any });
				})
				.catch((err) => console.error('[retro] Falha ao inscrever em retrospectives:', err));

			pb.collection('retrospective_columns')
				.subscribe('*', (e) => {
					if (stopped) return;
					onColumn({ action: e.action, record: e.record as any });
				})
				.catch((err) => console.error('[retro] Falha ao inscrever em retrospective_columns:', err));

			pb.collection('retrospective_cards')
				.subscribe('*', (e) => {
					if (stopped) return;
					const record = e.record as any;
					onCard({ action: e.action, record: { ...record, edit_token_hash: null } });
				})
				.catch((err) => console.error('[retro] Falha ao inscrever em retrospective_cards:', err));

			pb.collection('retrospective_participants')
				.subscribe('*', (e) => {
					if (stopped) return;
					onParticipant({ action: e.action, record: e.record as any });
				})
				.catch((err) =>
					console.error('[retro] Falha ao inscrever em retrospective_participants:', err)
				);

			return () => {
				stopped = true;
				pb.collection('retrospectives').unsubscribe('*');
				pb.collection('retrospective_columns').unsubscribe('*');
				pb.collection('retrospective_cards').unsubscribe('*');
				pb.collection('retrospective_participants').unsubscribe('*');
			};
		},
		data.retro as RetroRecord | null,
		data.columns as unknown as RetroColumnRecord[],
		data.cards as unknown as RetroCardRecord[],
		data.participants as unknown as RetroParticipantRecord[],
		data.project as unknown as ProjectRecord,
		data.sprint as unknown as SprintRecord,
		new Map()
	);

	$effect(() => {
		board.sync(
			data.retro as RetroRecord | null,
			data.columns as unknown as RetroColumnRecord[],
			data.cards as unknown as RetroCardRecord[],
			data.participants as unknown as RetroParticipantRecord[],
			data.project as unknown as ProjectRecord,
			data.sprint as unknown as SprintRecord
		);
	});

	onMount(() => {
		const loadedTokens = loadEditTokens();
		editTokens = loadedTokens;
		board.updateEditTokens(loadedTokens);
		board.start();
	});

	onDestroy(() => {
		board.stop();
	});

	$effect(() => {
		saveEditTokens(editTokens);
	});

	async function postAction(
		action: string,
		fields: Record<string, string>
	): Promise<{ ok: boolean; data?: Record<string, unknown> }> {
		const res = await fetch(`?/${action}`, {
			method: 'POST',
			body: new URLSearchParams(fields),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
				'x-sveltekit-action': 'true'
			}
		});
		const result = deserialize(await res.text());
		if (result.type === 'success') {
			return { ok: true, data: (result.data ?? undefined) as Record<string, unknown> | undefined };
		}
		return { ok: false };
	}

	async function handleCreateCard(columnId: string, content: string) {
		try {
			const { ok, data: actionData } = await postAction('createCard', { columnId, content });
			if (!ok) {
				console.error('Failed to create card');
				return;
			}
			if (actionData?.cardId && actionData?.editToken) {
				const updated = new Map(editTokens);
				updated.set(String(actionData.cardId), String(actionData.editToken));
				editTokens = updated;
				board.updateEditTokens(updated);
			}
			// Fallback if realtime does not deliver the create event
			await invalidateAll();
		} catch (err) {
			console.error('Failed to create card', err);
		}
	}

	async function handleEditCard(cardId: string, content: string): Promise<boolean> {
		const token = editTokens.get(cardId);
		if (!token) return false;

		try {
			const { ok } = await postAction('editCard', { cardId, content, editToken: token });
			if (ok) await invalidateAll();
			return ok;
		} catch {
			return false;
		}
	}

	async function handleDeleteCard(cardId: string): Promise<boolean> {
		const token = editTokens.get(cardId);

		try {
			const fields: Record<string, string> = { cardId };
			if (token) fields.editToken = token;
			const { ok } = await postAction('deleteCard', fields);
			if (ok) {
				const updated = new Map(editTokens);
				updated.delete(cardId);
				editTokens = updated;
				board.updateEditTokens(updated);
				await invalidateAll();
			}
			return ok;
		} catch {
			return false;
		}
	}

	async function handleMoveCard(cardId: string, columnId: string, position: number) {
		const { ok } = await postAction('moveCard', {
			cardId,
			columnId,
			position: String(position)
		});
		if (ok) await invalidateAll();
		return ok;
	}

	async function handleAddParticipant() {
		if (!participantUserId) return;
		const { ok } = await postAction('addParticipant', { userId: participantUserId });
		if (ok) {
			showAddParticipant = false;
			participantUserId = '';
			addParticipantMessage = 'Participante adicionado!';
			setTimeout(() => {
				addParticipantMessage = '';
			}, 3000);
			await invalidateAll();
		} else {
			addParticipantMessage = 'Erro ao adicionar participante.';
		}
	}

	async function handleRemoveParticipant(partId: string) {
		const { ok } = await postAction('removeParticipant', { participantId: partId });
		if (ok) await invalidateAll();
	}

	const retro = $derived(board.retro);
	const columns = $derived(board.columns);
	const cards = $derived(board.cards);
	const participants = $derived(board.participants);
	const isFinalized = $derived(board.isFinalized);
	const filteredCards = $derived(
		cards.filter((c) => {
			if (!selectedCategoryFilter) return true;
			return c.category === selectedCategoryFilter;
		})
	);

	const cardsByColumn = $derived.by(() => {
		const map = new Map<string, typeof cards>();
		for (const col of columns) {
			map.set(
				col.id,
				filteredCards.filter((c) => c.column === col.id)
			);
		}
		return map;
	});

	function getCardTokens(cardId: string): { canEdit: boolean; canDelete: boolean } {
		const hasToken = editTokens.has(cardId);
		return {
			canEdit: hasToken,
			canDelete: hasToken || data.canManageRetro
		};
	}
</script>

<svelte:head>
	<title>Retrospectiva - {data.project?.title} / {data.sprint?.title}</title>
</svelte:head>

<PageShell bleed class="px-2 sm:px-4 py-3" testId="retro-page">
	<!-- Header -->
	<div class="mb-6">
		<div class="flex items-center justify-between mb-2 page-header">
			<div>
				<a href="/projects/{data.project?.id}" class="link link-neutral text-sm">
					{data.project?.title ?? 'Projeto'}
				</a>
				<span class="mx-2 text-base-content/40">/</span>
				<span class="text-sm text-base-content/60">{data.sprint?.title ?? 'Sprint'}</span>
				<h1 class="text-2xl font-bold mt-1">
					Retrospectiva
					{#if isFinalized}
						<span class="badge badge-warning ml-2">Finalizada</span>
					{:else}
						<span class="badge badge-success ml-2">Aberta</span>
					{/if}
				</h1>
			</div>
			<div class="flex items-center gap-2">
				{#if data.categories && data.categories.length > 0}
					<select
						bind:value={selectedCategoryFilter}
						class="select select-bordered select-sm"
						data-testid="select-retro-category-filter"
					>
						<option value="">Todas as categorias</option>
						{#each data.categories as cat (cat.id)}
							<option value={cat.id}>{cat.name}</option>
						{/each}
					</select>
				{/if}

				{#if !retro && data.canManageRetro}
					<form method="POST" action="?/createRetro" use:enhance>
						<input type="hidden" name="sprintId" value={data.sprint?.id} />
						<button class="btn btn-primary">Criar Retrospectiva</button>
					</form>
				{/if}
			</div>
		</div>
	</div>

	{#if !retro}
		<div class="flex flex-col items-center justify-center py-20">
			<p class="text-lg text-base-content/60 mb-4">Nenhuma retrospectiva para esta sprint.</p>
			{#if data.canManageRetro}
				<p class="text-sm text-base-content/40">
					Clique em "Criar Retrospectiva" para começar.
				</p>
			{/if}
		</div>
	{:else}
		<!-- Columns -->
		<div class="flex gap-4 overflow-x-auto pb-4">
			{#each columns as column (column.id)}
				<RetroColumn
					{column}
					cards={cardsByColumn.get(column.id) ?? []}
					isFinalized={isFinalized}
					cardTokens={new Map(
						cards
							.filter((c) => c.column === column.id)
							.map((c) => [c.id, getCardTokens(c.id)])
					)}
					canManage={data.canManageRetro}
					onCreateCard={(content) => handleCreateCard(column.id, content)}
					onEditCard={handleEditCard}
					onDeleteCard={handleDeleteCard}
					onMoveCard={handleMoveCard}
					{columns}
				/>
			{/each}

			<!-- Create column button (responsaveis only) -->
			{#if data.canManageRetro && !isFinalized}
				<div class="flex-shrink-0 w-72">
					{#if showCreateColumn}
						<div class="bg-base-100 rounded-box p-3 shadow">
							<form
								method="POST"
								action="?/createColumn"
								use:enhance={() => {
									showCreateColumn = false;
									newColumnName = '';
									return async ({ update }) => update();
								}}
							>
								<input
									type="text"
									name="name"
									class="input input-bordered input-sm w-full mb-2"
									placeholder="Nome da coluna"
									bind:value={newColumnName}
									required
								/>
								<div class="flex gap-1">
									<button class="btn btn-primary btn-xs" type="submit">Criar</button>
									<button
										class="btn btn-ghost btn-xs"
										type="button"
										onclick={() => {
											showCreateColumn = false;
										}}>Cancelar</button
									>
								</div>
							</form>
						</div>
					{:else}
						<button
							class="btn btn-outline btn-dash w-full h-24"
							onclick={() => {
								showCreateColumn = true;
							}}
						>
							+ Nova Coluna
						</button>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Bottom bar: participants + finalize -->
		<div class="mt-6 flex flex-col-reverse sm:flex-row gap-4 items-stretch sm:items-start">
			<RetroParticipants
				{participants}
				projectUsers={data.project?.expand?.participants ?? []}
				canManage={data.canManageRetro && !isFinalized}
				showAddForm={showAddParticipant}
				participantUserId={participantUserId}
				message={addParticipantMessage}
				onToggleForm={() => {
					showAddParticipant = !showAddParticipant;
				}}
				onUserIdChange={(id) => {
					participantUserId = id;
				}}
				onAddParticipant={handleAddParticipant}
				onRemoveParticipant={handleRemoveParticipant}
			/>

			{#if data.canManageRetro && !isFinalized}
				<div class="flex-shrink-0">
					{#if showFinalizeConfirm}
						<div class="card bg-base-100 shadow p-4">
							<p class="text-sm mb-3">
								Tem certeza? Após finalizar, ninguém poderá editar ou excluir cards.
							</p>
							<form
								method="POST"
								action="?/finalize"
								use:enhance={() => {
									showFinalizeConfirm = false;
									return async ({ update }) => update();
								}}
							>
								<button class="btn btn-warning btn-sm" type="submit">
									Sim, finalizar retrospectiva
								</button>
								<button
									class="btn btn-ghost btn-sm ml-2"
									type="button"
									onclick={() => {
										showFinalizeConfirm = false;
									}}>Cancelar</button
								>
							</form>
						</div>
					{:else}
						<button
							class="btn btn-warning"
							onclick={() => {
								showFinalizeConfirm = true;
							}}
						>
							Finalizar Retrospectiva
						</button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</PageShell>
