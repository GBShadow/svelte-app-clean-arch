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
		<span class="text-xs">{initials}</span>
	</div>
{/if}
