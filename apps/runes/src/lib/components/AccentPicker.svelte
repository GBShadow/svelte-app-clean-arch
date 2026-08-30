<script lang="ts">
	import { accent } from '$lib/client/accent.svelte';

	const palettes = [
		{ id: 'magenta', label: 'Magenta', color: 'oklch(0.73 0.22 330)' },
		{ id: 'roxo', label: 'Roxo', color: 'oklch(0.68 0.2 295)' },
		{ id: 'ciano', label: 'Ciano', color: 'oklch(0.8 0.14 195)' },
		{ id: 'verde', label: 'Verde', color: 'oklch(0.76 0.18 155)' },
		{ id: 'ambar', label: 'Âmbar', color: 'oklch(0.8 0.18 85)' },
		{ id: 'rosa', label: 'Rosa', color: 'oklch(0.72 0.18 5)' },
		{ id: 'azul', label: 'Azul', color: 'oklch(0.72 0.16 245)' },
	];
</script>

<div class="flex flex-wrap gap-3.5 items-center">
	{#each palettes as p}
		<button
			type="button"
			class="size-10 rounded-full transition-all duration-200 cursor-pointer shrink-0 relative flex items-center justify-center interactive-scale shadow-md {accent.value === p.id ? 'ring-3 ring-offset-3 ring-offset-base-100 ring-base-content scale-110 shadow-lg' : 'opacity-80 hover:opacity-100 hover:scale-105'}"
			style="background: {p.color}; ring-color: {p.color}"
			onclick={() => accent.set(p.id)}
			title={p.label}
			aria-label={p.label}
			aria-pressed={accent.value === p.id}
		>
			{#if accent.value === p.id}
				<span class="size-2 rounded-full bg-white shadow-sm"></span>
			{/if}
		</button>
	{/each}
</div>
