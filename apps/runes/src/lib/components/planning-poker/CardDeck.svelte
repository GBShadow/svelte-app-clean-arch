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

<div class="surface-card rounded-2xl p-5 sm:p-6">
	<h3 class="text-xs font-bold uppercase tracking-wider text-base-content/70 mb-4 flex items-center gap-2">
		<Dices class="w-4 h-4 text-primary" />
		Seu Voto
	</h3>

	<div class="grid grid-cols-4 sm:grid-cols-7 gap-3">
		{#each POKER_CARDS as card}
			<button
				type="button"
				class="aspect-[2/3] border rounded-xl flex items-center justify-center font-display font-black text-lg sm:text-xl transition-all cursor-pointer select-none
					{disabled ? 'opacity-35 cursor-not-allowed' : 'hover:-translate-y-1.5 hover:shadow-xl active:scale-95'}
					{selectedValue === card
						? 'bg-primary border-primary text-primary-content shadow-lg shadow-primary/30 scale-105 ring-2 ring-primary ring-offset-2 ring-offset-base-100'
						: 'bg-base-100/80 border-base-content/15 text-base-content/90 hover:border-primary/60 hover:bg-base-100'}"
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
