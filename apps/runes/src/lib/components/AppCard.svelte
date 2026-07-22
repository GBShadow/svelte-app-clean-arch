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
	class="card card-compact bg-base-100 border border-base-300 hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
>
	<div class="card-body gap-4 p-6">
		<div class="flex items-start gap-4">
			<div class="relative size-14 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-200">
				<Icon class="size-7" />
				{#if pulseDot}
					<span
						class="absolute -top-0.5 -right-0.5 size-3 animate-pulse rounded-full bg-red-500 ring-2 ring-base-100"
						data-testid="app-card-pulse-dot"
						aria-label="Mensagens não lidas"
					></span>
				{/if}
			</div>

			<div class="space-y-1.5 min-w-0">
				<h3 class="card-title text-lg font-display font-semibold tracking-tight">{name}</h3>
				<p class="text-sm text-base-content/60 leading-snug">{description}</p>

				{#if badge !== undefined}
					<div class="badge badge-soft badge-primary badge-sm mt-1" data-testid="app-card-badge">
						{badge}
					</div>
				{/if}
			</div>
		</div>
	</div>
</a>
