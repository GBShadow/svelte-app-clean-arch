<script lang="ts">
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { RetroColumnRecord, RetroCardRecord } from '$lib/server/retroRecord';
	import RetroCard from './RetroCard.svelte';

	let {
		column,
		cards = [],
		isFinalized = false,
		cardTokens = new Map(),
		canManage = false,
		onCreateCard,
		onEditCard,
		onDeleteCard,
		onMoveCard,
		columns = []
	}: {
		column: RetroColumnRecord;
		cards: RetroCardRecord[];
		isFinalized: boolean;
		cardTokens: Map<string, { canEdit: boolean; canDelete: boolean }>;
		canManage: boolean;
		onCreateCard?: (content: string) => void;
		onEditCard?: (cardId: string, content: string) => Promise<boolean>;
		onDeleteCard?: (cardId: string) => Promise<boolean>;
		onMoveCard?: (cardId: string, columnId: string, position: number) => Promise<boolean>;
		columns?: RetroColumnRecord[];
	} = $props();

	let showNewCardInput = $state(false);
	let newCardContent = $state('');
	let showMenu = $state(false);
	let isRenaming = $state(false);
	let renameValue = $state('');

	async function postAction(action: string, fields: Record<string, string>): Promise<boolean> {
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
		return result.type === 'success';
	}

	function startRenaming() {
		renameValue = column.name;
		isRenaming = true;
		showMenu = false;
	}

	async function submitRename() {
		const trimmed = renameValue.trim();
		if (trimmed && trimmed !== column.name) {
			const ok = await postAction('renameColumn', { columnId: column.id, name: trimmed });
			if (ok) await invalidateAll();
		}
		isRenaming = false;
		renameValue = '';
	}

	function cancelRename() {
		isRenaming = false;
		renameValue = '';
	}

	async function handleCreate() {
		if (!newCardContent.trim()) return;
		onCreateCard?.(newCardContent);
		newCardContent = '';
		showNewCardInput = false;
	}

	let dragCardId = $state<string | null>(null);

	function handleDragStart(e: DragEvent, cardId: string) {
		dragCardId = cardId;
		e.dataTransfer?.setData('text/plain', cardId);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		const cardId = e.dataTransfer?.getData('text/plain');
		if (cardId && cardId !== dragCardId) {
			onMoveCard?.(cardId, column.id, cards.length);
		}
		dragCardId = null;
	}

	async function handleDeleteColumn() {
		const ok = await postAction('deleteColumn', { columnId: column.id });
		if (ok) await invalidateAll();
	}
</script>

<div
	class="flex-shrink-0 w-72 bg-base-100 rounded-box shadow flex flex-col max-h-[calc(100vh-12rem)]"
	ondragover={handleDragOver}
	ondrop={handleDrop}
>
	<!-- Column header -->
	<div class="flex items-center justify-between p-3 border-b border-base-200">
		{#if isRenaming}
			<div class="flex items-center gap-1 flex-1">
				<input
					type="text"
					class="input input-bordered input-xs flex-1"
					bind:value={renameValue}
					onkeydown={(e) => { if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') cancelRename(); }}
				/>
				<button class="btn btn-ghost btn-xs btn-square" onclick={submitRename} title="Confirmar">
					&#10003;
				</button>
				<button class="btn btn-ghost btn-xs btn-square" onclick={cancelRename} title="Cancelar">
					&#10005;
				</button>
			</div>
		{:else}
			<div class="flex items-center gap-2">
				<h3 class="font-semibold text-sm">{column.name}</h3>
				<span class="badge badge-ghost badge-xs">{cards.length}</span>
			</div>
		{/if}
		{#if canManage && !isFinalized && !isRenaming}
			<div class="relative">
				<button
					class="btn btn-ghost btn-xs btn-square"
					onclick={() => { showMenu = !showMenu; }}
				>&#8942;</button>
				{#if showMenu}
					<div class="absolute right-0 top-6 z-10 bg-base-100 shadow rounded-box p-2 min-w-32">
						<button
							class="btn btn-ghost btn-xs w-full justify-start"
							onclick={startRenaming}
						>Renomear</button>
						{#if !column.is_default}
							<button
								class="btn btn-ghost btn-xs w-full justify-start text-error"
								onclick={() => { handleDeleteColumn(); showMenu = false; }}
							>Excluir coluna</button>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Cards -->
	<div class="flex-1 overflow-y-auto p-2 space-y-2">
		{#if cards.length === 0}
			<p class="text-xs text-base-content/40 text-center py-4">Nenhum card</p>
		{/if}

		{#each cards as card (card.id)}
			<RetroCard
				{card}
				canEdit={cardTokens.get(card.id)?.canEdit ?? false}
				canDelete={cardTokens.get(card.id)?.canDelete ?? false}
				isFinalized={isFinalized}
				onEdit={onEditCard}
				onDelete={onDeleteCard}
				onDragStart={(e) => handleDragStart(e, card.id)}
			/>
		{/each}
	</div>

	<!-- Add card button -->
	{#if !isFinalized}
		<div class="p-2 border-t border-base-200">
			{#if showNewCardInput}
				<div class="flex flex-col gap-1">
					<textarea
						class="textarea textarea-bordered textarea-xs w-full"
						placeholder="Digite seu card anônimo..."
						bind:value={newCardContent}
						rows="2"
					></textarea>
					<div class="flex gap-1">
						<button class="btn btn-primary btn-xs" onclick={handleCreate}>Adicionar</button>
						<button class="btn btn-ghost btn-xs" onclick={() => { showNewCardInput = false; }}>Cancelar</button>
					</div>
				</div>
			{:else}
				<button
					class="btn btn-ghost btn-xs w-full"
					onclick={() => { showNewCardInput = true; }}
				>+ Adicionar card</button>
			{/if}
		</div>
	{/if}
</div>
