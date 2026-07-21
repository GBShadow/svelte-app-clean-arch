<script lang="ts">
	import { onMount } from 'svelte';
	import { notificationStore } from '$lib/client/notifications.svelte';
	import { formatRelativeTime, isSafeRedirectUrl } from '$lib/domain/notification';
	import MessageSquare from 'lucide-svelte/icons/message-square';
	import Bell from 'lucide-svelte/icons/bell';
	import Kanban from 'lucide-svelte/icons/kanban';
	import Gamepad2 from 'lucide-svelte/icons/gamepad-2';
	import Check from 'lucide-svelte/icons/check';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import ExternalLink from 'lucide-svelte/icons/external-link';

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	const typeIcons = { chat: MessageSquare, system: Bell, kanban: Kanban, poker: Gamepad2 };

	onMount(() => {
		notificationStore.load({ page: 1 });
	});

	async function markAsRead(id: string, event: MouseEvent) {
		event.stopPropagation();
		await notificationStore.markAsRead([id]);
	}

	async function deleteNotification(id: string, event: MouseEvent) {
		event.stopPropagation();
		await notificationStore.deleteNotification(id);
	}

	async function navigateTo(url: string, id: string, event: MouseEvent) {
		event.stopPropagation();
		await notificationStore.markAsReadAndNavigate(id, url);
		onClose();
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

	{#if notificationStore.loading}
		<div class="p-4 text-center text-base-content/60">Carregando...</div>
	{:else if notificationStore.notifications.length === 0}
		<div class="p-4 text-center text-base-content/60">Nenhuma notificação</div>
	{:else}
		<div class="overflow-y-auto max-h-[400px]" data-testid="notification-list">
			{#each notificationStore.notifications as n (n.id)}
				<div
					class="p-3 flex items-start gap-3 border-b border-base-200 last:border-0 {!n.read ? 'bg-base-200/50' : ''}"
					data-testid="notification-item-{n.id}"
				>
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-base-200 shrink-0 mt-1">
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
							<span class="text-xs text-base-content/50 whitespace-nowrap shrink-0">{formatRelativeTime(n.created)}</span>
						</div>
						<p class="text-sm text-base-content/70 truncate">{n.body}</p>
					</div>
					<div class="flex items-center gap-1 shrink-0 mt-1">
						{#if !n.read}
							<span class="tooltip tooltip-left" data-tip="Marcar como lida">
								<button
									type="button"
									class="btn btn-ghost btn-xs text-success"
									onclick={(e) => markAsRead(n.id, e)}
									data-testid="btn-mark-read-dropdown-{n.id}"
								>
									<Check class="size-3.5" />
								</button>
							</span>
						{/if}
						<span class="tooltip tooltip-left" data-tip="Excluir">
							<button
								type="button"
								class="btn btn-ghost btn-xs text-error"
								onclick={(e) => deleteNotification(n.id, e)}
								data-testid="btn-delete-dropdown-{n.id}"
							>
								<Trash2 class="size-3.5" />
							</button>
						</span>
						{#if n.url && isSafeRedirectUrl(n.url)}
							<span class="tooltip tooltip-left" data-tip="Ir para o destino">
								<button
									type="button"
									class="btn btn-ghost btn-xs"
									onclick={(e) => navigateTo(n.url, n.id, e)}
									data-testid="notification-link-dropdown-{n.id}"
								>
									<ExternalLink class="size-3.5" />
								</button>
							</span>
						{/if}
					</div>
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