<script lang="ts">
	let { class: className = 'size-4' }: { class?: string } = $props();
</script>

<svg
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.5"
	stroke-linecap="round"
	stroke-linejoin="round"
	class={className}
	aria-hidden="true"
>
	<rect x="5" y="11" width="14" height="9" rx="1.5" />
	<path d="M8 11V7a4 4 0 0 1 7.2-2.4" />
</svg>
