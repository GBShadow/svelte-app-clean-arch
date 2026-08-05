<script lang="ts">
	let {
		width = 'lg',
		bleed = false,
		class: className = '',
		testId,
		children
	}: {
		width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
		bleed?: boolean;
		class?: string;
		testId?: string;
		children: import('svelte').Snippet;
	} = $props();

	const widthClass = $derived(
		bleed ? 'page-shell-bleed' :
		width === 'sm' ? 'page-shell-sm' :
		width === 'md' ? 'page-shell-md' :
		width === 'lg' ? 'page-shell-lg' :
		width === 'xl' ? 'page-shell-xl' :
		width === '2xl' ? 'page-shell-2xl' :
		'page-shell-full'
	);
</script>

<div class={['page-shell', widthClass, className].filter(Boolean).join(' ')} data-testid={testId}>
	{@render children()}
</div>
