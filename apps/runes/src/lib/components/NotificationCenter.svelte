<script lang="ts">
	import { onMount } from 'svelte';
	import { notificationStore } from '$lib/client/notifications.svelte';
	import { formatRelativeTime, isSafeRedirectUrl } from '$lib/domain/notification';
	import MessageSquare from 'lucide-svelte/icons/message-square';
	import Bell from 'lucide-svelte/icons/bell';
	import Kanban from 'lucide-svelte/icons/kanban';
	import Gamepad2 from 'lucide-svelte/icons/gamepad-2';
	import Check from 'lucide-svelte/icons/check';
	import ExternalLink from 'lucide-svelte/icons/external-link';

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	const typeIcons = { chat: MessageSquare, system: Bell, kanban: Kanban, poker: Gamepad2 };

	let loaded = $state(false);

	async function load() {
		if (!loaded) {
			await notificationStore.load({ page: 1 });
			loaded = true;
		}
	}

	function handleClick(url: string | undefined, id: string, event: MouseEvent) {
		event.stopPropagation();
		if (url && isSafeRedirectUrl(url)) {
			notificationStore.markAsReadAndNavigate(id, url);
		} else {
			notificationStore.markAsRead([id]);
		}
		onClose();
	}

	async function markAsRead(id: string, event: MouseEvent) {
		event.stopPropagation();
		await notificationStore.markAsRead([id]);
	}

	async function markAllAsRead(event: MouseEvent) {
		event.stopPropagation();
		await notificationStore.markAllAsRead();
	}
</script>

<div class="flex flex-col max-h-[500px]">
	<div class="flex items-center justify-between p-3 border-b border-base-200 sticky top-0 bg-base-100 z-10">
		<h3 class="font-semibold">Notificações</h3>
		<div class="flex items-center gap-2">
			<span class="badge badge-sm badge-outline">{notificationStore.unreadCount} não lidas</span>
			{#if notificationStore.unreadCount > 0}
				<button
					type="button"
					class="btn btn-ghost btn-xs"
					onclick={markAllAsRead}
					data-testid="btn-mark-all-read-dropdown"
				>
					Todas como lidas
				</button>
			{/if}
		</div>
	</div>

	{#await load()}
		<div class="p-4 text-center text-base-content/60">Carregando...</div>
	{/await}

	{#if notificationStore.notifications.length === 0}
		<div class="p-4 text-center text-base-content/60">Nenhuma notificação</div>
	{:else}
		<div class="overflow-y-auto max-h-[400px]" data-testid="notification-list">
			{#each notificationStore.notifications as n (n.id)}
				<div
					class="p-3 hover:bg-base-200 flex items-start gap-3 border-b border-base-200 last:border-0 cursor-pointer { !n.read ? 'bg-base-200/50' : '' }"
					onclick={(e) => handleClick(n.url, n.id, e as unknown as MouseEvent)}
					data-testid="notification-item-{n.id}"
					role="button"
					tabindex="0"
					onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(n.url, n.id, e as unknown as MouseEvent); } }}
				>
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-base-200 shrink-0">
						{#if n.type === 'chat'}
							<MessageSquare class="size-4" />
						{:else if n.type === 'system'}
							<Bell class="size-4" />
						{:else if n.type === 'kanban'}
							<Kanban class="size-4" />
						{:else if n.type === 'poker'}
							<Gamepad2 class="size-4" />
						{/if}
					</div>
					<div class="flex-1 min-w-0">
						<div class="flex items-center justify-between gap-2">
							<p class="font-medium truncate">{n.title}</p>
							<span class="text-xs text-base-content/50 whitespace-nowrap">{formatRelativeTime(n.created)}</span>
						</div>
						<p class="text-sm text-base-content/70 truncate">{n.body}</p>
						{#if !n.read}
							<button
								type="button"
								class="btn btn-ghost btn-xs text-success mt-1"
								onclick={(e) => markAsRead(n.id, e)}
								data-testid="btn-mark-read-dropdown-{n.id}"
							>
								<Check class="size-3" />
								Marcar como lida
							</button>
						{/if}
					</div>
					{#if n.url && isSafeRedirectUrl(n.url)}
						<ExternalLink class="size-4 text-base-content/40 shrink-0 mt-1" />
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<div class="p-3 border-t border-base-200 bg-base-100">
		<a
			href="/notifications"
			class="btn btn-block btn-ghost btn-sm justify-center"
			onclick={onClose}
			data-testid="link-view-all"
		>
			Ver todas as notificações
		</a>
	</div>
</div>