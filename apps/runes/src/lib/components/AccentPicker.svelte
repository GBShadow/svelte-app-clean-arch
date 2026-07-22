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

<div class="flex flex-wrap gap-3">
	{#each palettes as p}
		<button
			type="button"
			class="size-9 rounded-full transition-all duration-200 cursor-pointer shrink-0"
			class:outline-2={accent.value === p.id}
			class:outline-offset-2={accent.value === p.id}
			style="background: {p.color}; outline-color: {p.color}"
			onclick={() => accent.set(p.id)}
			title={p.label}
			aria-label={p.label}
			aria-pressed={accent.value === p.id}
		></button>
	{/each}
</div>
