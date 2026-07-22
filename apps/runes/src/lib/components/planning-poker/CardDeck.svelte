<script lang="ts">
	import { POKER_CARDS } from '$lib/validation/pokerSchemas';
	import Dices from 'lucide-svelte/icons/dices';

	let {
		selectedValue = $bindable(''),
		disabled = false,
		onVote
	} = $props();

	function selectCard(val: string) {
		if (disabled) return;
		selectedValue = val;
		onVote(val);
	}
</script>

<div class="bg-base-200 border border-base-300 rounded-2xl p-6">
	<h3 class="text-sm font-semibold uppercase tracking-wider text-base-content/60 mb-4 flex items-center gap-2">
		<Dices class="w-4 h-4 text-primary" />
		Seu Voto
	</h3>

	<div class="grid grid-cols-4 sm:grid-cols-7 gap-3">
		{#each POKER_CARDS as card}
			<button
				type="button"
				class="aspect-[2/3] border-2 rounded-xl flex items-center justify-center font-black text-lg transition-all
					{disabled ? 'opacity-40 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-lg active:scale-95'}
					{selectedValue === card
						? 'bg-primary border-primary text-primary-content shadow-lg shadow-primary/20 scale-105'
						: 'bg-base-100 border-base-300 text-base-content/80 hover:border-primary/50'}"
				onclick={() => selectCard(card)}
				{disabled}
				data-testid="poker-card-{card}"
				aria-label="Votar {card}"
			>
				{card}
			</button>
		{/each}
	</div>
</div>
