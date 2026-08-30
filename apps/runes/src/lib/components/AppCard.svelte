<script lang="ts">
	let {
		icon: Icon,
		name,
		description,
		href,
		badge,
		pulseDot = false
	}: {
		icon: any;
		name: string;
		description: string;
		href: string;
		badge?: string | number;
		pulseDot?: boolean;
	} = $props();
</script>

<a
	{href}
	data-testid="app-card-{name.toLowerCase()}"
	class="surface-card rounded-2xl p-6 cursor-pointer group relative overflow-hidden flex flex-col justify-between"
>
	<div class="absolute -right-8 -top-8 size-24 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-all duration-300 blur-xl pointer-events-none"></div>
	<div class="flex items-start gap-4">
		<div class="relative size-14 shrink-0 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-content group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-200">
			<Icon class="size-7 transition-transform group-hover:scale-110" />
			{#if pulseDot}
				<span
					class="absolute -top-1 -right-1 size-3.5 animate-pulse rounded-full bg-error ring-2 ring-base-100 shadow-md"
					data-testid="app-card-pulse-dot"
					aria-label="Mensagens não lidas"
				></span>
			{/if}
		</div>

		<div class="space-y-1 min-w-0 flex-1">
			<div class="flex items-center justify-between gap-2">
				<h3 class="card-title text-lg font-display font-bold tracking-tight text-base-content group-hover:text-primary transition-colors">{name}</h3>
				{#if badge !== undefined}
					<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20" data-testid="app-card-badge">
						{badge}
					</span>
				{/if}
			</div>
			<p class="text-sm text-base-content/65 leading-relaxed">{description}</p>
		</div>
	</div>
</a>
