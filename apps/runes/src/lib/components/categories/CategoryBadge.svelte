<script lang="ts">
	import Tag from 'lucide-svelte/icons/tag';
	import type { CategoryRecord } from '$lib/server/categoryRecord';

	let {
		category,
		size = 'sm',
		clickable = false,
		href,
		dataTestId
	}: {
		category?: Partial<CategoryRecord> | null;
		size?: 'xs' | 'sm' | 'md';
		clickable?: boolean;
		href?: string;
		dataTestId?: string;
	} = $props();

	let name = $derived(category?.name?.trim() || '');
	let targetHref = $derived(href || (category?.id ? `/categories/${category.id}` : undefined));
	let sizeClass = $derived(
		size === 'xs' ? 'badge-xs text-[10px] gap-1' : size === 'md' ? 'badge-md gap-1.5' : 'badge-sm gap-1'
	);
</script>

{#if name}
	{#if clickable && targetHref}
		<a
			href={targetHref}
			class="badge badge-outline badge-primary hover:badge-primary transition-colors cursor-pointer inline-flex items-center {sizeClass}"
			data-testid={dataTestId || `category-badge-${category?.id || 'named'}`}
			title={category?.description || name}
		>
			<Tag class="size-3 shrink-0" />
			<span class="truncate max-w-[150px]">{name}</span>
		</a>
	{:else}
		<span
			class="badge badge-soft badge-primary inline-flex items-center {sizeClass}"
			data-testid={dataTestId || `category-badge-${category?.id || 'named'}`}
			title={category?.description || name}
		>
			<Tag class="size-3 shrink-0" />
			<span class="truncate max-w-[150px]">{name}</span>
		</span>
	{/if}
{/if}
