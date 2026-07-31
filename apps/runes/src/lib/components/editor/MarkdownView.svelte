<script lang="ts">
	import { renderMarkdownSafe } from '$lib/markdown/renderMarkdownSafe';

	let { content = '' }: { content: string } = $props();

	let rendered = $derived(renderMarkdownSafe(content));
</script>

{#if content}
	<div class="prose prose-sm max-w-none">
		{@html rendered}
	</div>
{/if}
