<script lang="ts">
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import Coffee from 'lucide-svelte/icons/coffee';
	import HelpCircle from 'lucide-svelte/icons/help-circle';
	import Award from 'lucide-svelte/icons/award';

	let {
		average = 0,
		distribution = {},
		totalVotes = 0
	} = $props();

	// Ordena a distribuição por chave ou frequência descendente
	let distributionEntries = $derived(
		Object.entries(distribution).sort((a, b) => b[1] - a[1])
	);
</script>

<div class="bg-base-200 border border-base-300 rounded-2xl p-6 h-full">
	<h3 class="text-sm font-semibold uppercase tracking-wider text-base-content/60 mb-6 flex items-center gap-2">
		<BarChart3 class="w-4 h-4 text-primary" />
		Resultado da Votação
	</h3>

	<div class="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
		<!-- Média -->
		<div class="flex flex-col items-center justify-center p-6 bg-base-100 border border-base-300 rounded-xl text-center">
			<Award class="w-8 h-8 text-warning mb-2" />
			<span class="text-xs font-semibold uppercase tracking-wider text-base-content/50">Média Geral</span>
			<span class="text-4xl font-black text-base-content mt-1">
				{average > 0 ? average : '—'}
			</span>
			<span class="text-[10px] text-base-content/40 mt-1">Pontos (Fibonacci)</span>
		</div>

		<!-- Gráficos de Distribuição -->
		<div class="sm:col-span-2 space-y-3">
			{#if totalVotes === 0}
				<div class="text-center py-6 text-sm text-base-content/45">
					Nenhum voto registrado para consolidar.
				</div>
			{:else}
				{#each distributionEntries as [val, count]}
					{@const percentage = Math.round((count / totalVotes) * 100)}
					<div class="space-y-1">
						<div class="flex justify-between items-center text-xs">
							<span class="font-bold flex items-center gap-1.5 text-base-content/85">
								{#if val === '☕'}
									<Coffee class="w-3.5 h-3.5 text-error" /> Café
								{:else if val === '?'}
									<HelpCircle class="w-3.5 h-3.5 text-info" /> Dúvida
								{:else}
									Carta <span class="badge badge-sm badge-neutral">{val}</span>
								{/if}
							</span>
							<span class="text-base-content/60">{count} {count === 1 ? 'voto' : 'votos'} ({percentage}%)</span>
						</div>
						<div class="w-full bg-base-100 rounded-full h-2.5 overflow-hidden border border-base-300">
							<div
								class="bg-primary h-full rounded-full transition-all duration-500"
								style="width: {percentage}%"
							></div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
