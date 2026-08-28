<script lang="ts">
	import type { RetroCardRecord } from '$lib/server/retroRecord';
	import MarkdownEditor from '$lib/components/editor/MarkdownEditor.svelte';
	import MarkdownView from '$lib/components/editor/MarkdownView.svelte';
	import CategoryBadge from '$lib/components/categories/CategoryBadge.svelte';

	let {
		card,
		canEdit = false,
		canDelete = false,
		isFinalized = false,
		onEdit,
		onDelete,
		onDragStart
	}: {
		card: RetroCardRecord;
		canEdit: boolean;
		canDelete: boolean;
		isFinalized: boolean;
		onEdit?: (cardId: string, content: string) => Promise<boolean>;
		onDelete?: (cardId: string) => Promise<boolean>;
		onDragStart?: (e: DragEvent) => void;
	} = $props();

	let isEditing = $state(false);
	let editContent = $state('');

	function startEditing() {
		if (!canEdit || isFinalized) return;
		editContent = card.content;
		isEditing = true;
	}

	async function saveEdit() {
		if (!editContent.trim()) return;
		const success = await onEdit?.(card.id, editContent);
		if (success) isEditing = false;
	}

	async function handleDelete() {
		if (confirm('Excluir este card?')) {
			await onDelete?.(card.id);
		}
	}
</script>

<div
	class="bg-base-200 rounded-lg p-3 cursor-grab active:cursor-grabbing group relative"
	draggable={!isFinalized && !isEditing}
	ondragstart={onDragStart}
>
	{#if isEditing}
		<div class="flex flex-col gap-1">
			<MarkdownEditor bind:value={editContent} compact dataTestid="retro-card-editor" />
			<div class="flex gap-1">
				<button class="btn btn-primary btn-xs" onclick={saveEdit}>Salvar</button>
				<button class="btn btn-ghost btn-xs" onclick={() => { isEditing = false; }}>Cancelar</button>
			</div>
		</div>
	{:else}
		<MarkdownView content={card.content} />
		{#if card.expand?.category}
			<div class="mt-2">
				<CategoryBadge category={card.expand.category} size="xs" clickable={true} />
			</div>
		{/if}

		{#if !isFinalized && (canEdit || canDelete)}
			<div class="absolute top-1 right-1 hidden group-hover:flex gap-1">
				{#if canEdit}
					<button
						class="btn btn-ghost btn-xs btn-square"
						onclick={startEditing}
						title="Editar"
					>&#9998;</button>
				{/if}
				{#if canDelete}
					<button
						class="btn btn-ghost btn-xs btn-square text-error"
						onclick={handleDelete}
						title="Excluir"
					>&#10005;</button>
				{/if}
			</div>
		{/if}
	{/if}
</div>
