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
			class="inline-flex items-center rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 hover:border-primary/50 transition-all cursor-pointer font-medium {sizeClass}"
			data-testid={dataTestId || `category-badge-${category?.id || 'named'}`}
			title={category?.description || name}
		>
			<span class="size-1.5 rounded-full bg-primary animate-pulse shrink-0"></span>
			<span class="truncate max-w-[150px]">{name}</span>
		</a>
	{:else}
		<span
			class="inline-flex items-center rounded-full bg-base-300/60 text-base-content/80 border border-base-content/10 font-medium {sizeClass}"
			data-testid={dataTestId || `category-badge-${category?.id || 'named'}`}
			title={category?.description || name}
		>
			<span class="size-1.5 rounded-full bg-primary/60 shrink-0"></span>
			<span class="truncate max-w-[150px]">{name}</span>
		</span>
	{/if}
{/if}
