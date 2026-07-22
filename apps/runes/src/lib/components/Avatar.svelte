<script lang="ts">
	import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

	let {
		userId,
		avatar,
		name,
		size = 'size-8'
	}: { userId: string; avatar: string; name: string; size?: string } = $props();

	const initials = $derived(
		name
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? '')
			.join('')
	);

	const textSize = $derived.by(() => {
		const m = size.match(/size-(\d+)/);
		if (!m) return 'text-xs';
		const n = parseInt(m[1]);
		if (n >= 24) return 'text-3xl';
		if (n >= 16) return 'text-2xl';
		if (n >= 12) return 'text-xl';
		if (n >= 10) return 'text-lg';
		if (n >= 8) return 'text-base';
		return 'text-xs';
	});

	const src = $derived(
		avatar ? `${PUBLIC_POCKETBASE_URL}/api/files/auth/${userId}/${avatar}?thumb=64x64` : null
	);
</script>

{#if src}
	<img
		{src}
		alt={name}
		class="rounded-full object-cover {size}"
		data-testid="avatar-{userId}"
	/>
{:else}
	<div
		class="rounded-full bg-neutral text-neutral-content flex items-center justify-center font-mono {size}"
		data-testid="avatar-{userId}"
	>
		<span class="{textSize} font-medium">{initials}</span>
	</div>
{/if}
