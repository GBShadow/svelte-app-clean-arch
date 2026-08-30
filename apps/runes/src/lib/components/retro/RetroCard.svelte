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
	class="surface-card rounded-xl p-3.5 bg-base-100/90 border border-base-content/10 cursor-grab active:cursor-grabbing group relative hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-md transition-all"
	draggable={!isFinalized && !isEditing}
	ondragstart={onDragStart}
>
	{#if isEditing}
		<div class="flex flex-col gap-2">
			<MarkdownEditor bind:value={editContent} compact dataTestid="retro-card-editor" />
			<div class="flex gap-1.5 pt-1">
				<button class="btn btn-primary btn-xs rounded-lg px-3" onclick={saveEdit}>Salvar</button>
				<button class="btn btn-ghost btn-xs rounded-lg" onclick={() => { isEditing = false; }}>Cancelar</button>
			</div>
		</div>
	{:else}
		<div class="text-sm text-base-content/90 leading-relaxed">
			<MarkdownView content={card.content} />
		</div>
		{#if card.expand?.category}
			<div class="mt-2.5">
				<CategoryBadge category={card.expand.category} size="xs" clickable={true} />
			</div>
		{/if}

		{#if !isFinalized && (canEdit || canDelete)}
			<div class="absolute top-1.5 right-1.5 hidden group-hover:flex gap-1 bg-base-100/90 rounded-lg p-0.5 shadow-sm border border-base-content/10">
				{#if canEdit}
					<button
						class="btn btn-ghost btn-xs btn-square text-base-content/70 hover:text-base-content"
						onclick={startEditing}
						title="Editar"
					>&#9998;</button>
				{/if}
				{#if canDelete}
					<button
						class="btn btn-ghost btn-xs btn-square text-error/80 hover:text-error"
						onclick={handleDelete}
						title="Excluir"
					>&#10005;</button>
				{/if}
			</div>
		{/if}
	{/if}
</div>
