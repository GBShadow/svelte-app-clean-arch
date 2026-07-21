<script lang="ts">
	import { notificationStore } from '$lib/client/notifications.svelte';

	let { roomId }: { roomId: string } = $props();

	let hasUnread = $derived.by(() => {
		return notificationStore.notifications.some(
			(n) => n.type === 'chat' && !n.read && n.metadata?.roomId === roomId
		);
	});
</script>

{#if hasUnread}
	<span
		class="flex h-2.5 w-2.5 animate-pulse rounded-full bg-red-500"
		data-testid="new-message-indicator"
		title="Nova mensagem"
		aria-label="Nova mensagem nesta sala"
	></span>
{/if}