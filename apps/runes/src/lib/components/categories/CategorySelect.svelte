<script lang="ts">
	import Tag from 'lucide-svelte/icons/tag';
	import type { CategoryRecord } from '$lib/server/categoryRecord';

	let {
		categories = [],
		value = $bindable(''),
		name = 'category',
		label,
		placeholder = 'Nenhuma categoria',
		disabled = false,
		required = false,
		dataTestId = 'category-select',
		size = 'md'
	}: {
		categories: CategoryRecord[];
		value?: string | null;
		name?: string;
		label?: string;
		placeholder?: string;
		disabled?: boolean;
		required?: boolean;
		dataTestId?: string;
		size?: 'sm' | 'md';
	} = $props();

	let selectClass = $derived(
		size === 'sm'
			? 'select select-bordered select-sm w-full rounded-xl bg-base-100/70 border-base-content/15 focus:border-primary transition-all text-xs'
			: 'select select-bordered w-full rounded-xl bg-base-100/70 border-base-content/15 focus:border-primary transition-all text-sm'
	);
</script>

<div class="form-control w-full">
	{#if label}
		<label for="category-select-input" class="label pb-1">
			<span class="label-text flex items-center gap-1.5 font-medium">
				<Tag class="size-3.5 opacity-70" />
				{label}
			</span>
		</label>
	{/if}
	<select
		id="category-select-input"
		{name}
		bind:value
		{disabled}
		{required}
		data-testid={dataTestId}
		class={selectClass}
	>
		<option value="">{placeholder}</option>
		{#each categories as category (category.id)}
			<option value={category.id}>{category.name}</option>
		{/each}
	</select>
</div>
