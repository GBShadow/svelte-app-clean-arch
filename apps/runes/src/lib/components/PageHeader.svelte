<script lang="ts">
	let {
		title,
		description,
		testId,
		children
	}: {
		title: string;
		description?: string;
		testId?: string;
		children?: import('svelte').Snippet;
	} = $props();
</script>

<div class="page-header" data-testid={testId}>
	<div class="min-w-0">
		<h1 class="text-2xl sm:text-3xl font-bold font-display tracking-tight text-base-content">{title}</h1>
		{#if description}
			<p class="mt-1 text-sm text-base-content/60">{description}</p>
		{/if}
	</div>
	{#if children}
		<div class="toolbar-wrap shrink-0">{@render children()}</div>
	{/if}
</div>
