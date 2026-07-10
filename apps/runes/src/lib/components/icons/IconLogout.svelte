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
	<path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4" />
	<path d="M16 17l5-5-5-5" />
	<path d="M21 12H9" />
</svg>
