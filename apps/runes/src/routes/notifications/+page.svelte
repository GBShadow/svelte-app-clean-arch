<script lang="ts">
	import { onMount } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { notificationStore } from '$lib/client/notifications.svelte';
	import { formatRelativeTime, getTypeIcon, getTypeLabel, isSafeRedirectUrl } from '$lib/domain/notification';
	import MessageSquare from 'lucide-svelte/icons/message-square';
	import Bell from 'lucide-svelte/icons/bell';
	import Kanban from 'lucide-svelte/icons/kanban';
	import Gamepad2 from 'lucide-svelte/icons/gamepad-2';
	import Check from 'lucide-svelte/icons/check';
	import X from 'lucide-svelte/icons/x';
	import Clock from 'lucide-svelte/icons/clock';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const typeIcons = { chat: MessageSquare, system: Bell, kanban: Kanban, poker: Gamepad2 };

	let selectedType = $state(data.type);
	let selectedRead = $state(data.read);
	let currentPage = $state(data.currentPage);
	let loading = $state(false);
	let deleting = $state<string | null>(null);

	function getIconComponent(type: string) {
		const iconName = getTypeIcon(type as any);
		return typeIcons[iconName as keyof typeof typeIcons] || Bell;
	}

	$effect(() => {
		notificationStore.notifications = data.notifications as any;
		notificationStore.page = data.currentPage;
		notificationStore.hasMore = data.currentPage < data.totalPages;
	});

	async function loadPage(page: number) {
		if (loading || page < 1 || page > data.totalPages) return;
		loading = true;
		try {
			await invalidateAll();
		} finally {
			loading = false;
		}
	}

	async function handleFilterChange() {
		await invalidateAll();
	}

	async function handleMarkRead(id: string, event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		await notificationStore.markAsRead([id]);
	}

	async function handleMarkAllRead(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		await notificationStore.markAllAsRead();
	}

	async function handleDelete(id: string, event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		deleting = id;
		try {
			await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
			notificationStore.notifications = notificationStore.notifications.filter((n) => n.id !== id);
		} catch {
			console.error('Erro ao deletar notificação');
		} finally {
			deleting = null;
		}
	}

	async function handleNavigate(notification: any, event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		if (notification.url && isSafeRedirectUrl(notification.url)) {
			await notificationStore.markAsReadAndNavigate(notification.id, notification.url);
		} else {
			await notificationStore.markAsRead([notification.id]);
		}
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<h1 class="text-2xl font-bold font-display">Notificações</h1>
		<div class="flex items-center gap-2">
			<span class="badge badge-lg">{data.unreadCount} não lidas</span>
			{#if data.unreadCount > 0}
				<button
					type="button"
					class="btn btn-primary btn-sm"
					onclick={handleMarkAllRead}
					data-testid="btn-mark-all-read-page"
				>
					<Check class="size-4" />
					Marcar todas como lidas
				</button>
			{/if}
		</div>
	</div>

	<div class="card bg-base-100 border border-base-300 shadow-sm">
		<div class="card-body p-0">
			<div class="overflow-x-auto">
				<table class="table table-zebra w-full">
					<thead>
						<tr class="bg-base-200">
							<th class="w-10"></th>
							<th>Tipo</th>
							<th class="min-w-[200px]">Título</th>
							<th>Mensagem</th>
							<th class="w-32">Hora</th>
							<th class="w-12"></th>
						</tr>
					</thead>
					<tbody>
						{#if data.notifications.length === 0}
							<tr>
								<td colspan="6" class="text-center py-8 text-base-content/60">Nenhuma notificação</td>
							</tr>
						{:else}
							{#each data.notifications as n (n.id)}
								<tr class="{!n.read ? 'bg-base-200/50' : ''}" data-testid="notification-row-{n.id}">
									<td>
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-base-200">
											<svelte:component this={getIconComponent(n.type)} class="size-4" />
										</div>
									</td>
									<td>
										<span class="badge badge-sm badge-outline">{getTypeLabel(n.type)}</span>
									</td>
									<td class="font-medium truncate max-w-xs">{n.title}</td>
									<td class="text-sm text-base-content/70 truncate max-w-md">{n.body}</td>
									<td class="text-xs text-base-content/50 whitespace-nowrap">
										<Clock class="size-3 inline" /> {formatRelativeTime(n.created)}
									</td>
									<td>
										<div class="flex items-center justify-end gap-1">
											{#if !n.read}
												<button
													type="button"
													class="btn btn-ghost btn-xs text-success"
													onclick={(e) => handleMarkRead(n.id, e)}
													data-testid="btn-mark-read-page-{n.id}"
												>
													<Check class="size-3.5" />
												</button>
											{/if}
											<button
												type="button"
												class="btn btn-ghost btn-xs text-error"
												onclick={(e) => handleDelete(n.id, e)}
												disabled={deleting === n.id}
												data-testid="btn-delete-page-{n.id}"
											>
												<X class="size-3.5" />
											</button>
											{#if n.url && isSafeRedirectUrl(n.url)}
												<a
													href={n.url}
													class="btn btn-ghost btn-xs"
													onclick={(e) => handleNavigate(n, e)}
													data-testid="notification-link-page-{n.id}"
												>
													<ExternalLink class="size-3.5" />
												</a>
											{/if}
										</div>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>

			{#if data.totalPages > 1}
				<div class="flex items-center justify-between p-4 border-t border-base-200">
					<div class="text-sm text-base-content/60">
						Página {data.currentPage} de {data.totalPages} — {data.totalItems} itens
					</div>
					<div class="flex gap-2">
						<button
							type="button"
							class="btn btn-ghost btn-sm"
							onclick={() => loadPage(data.currentPage - 1)}
							disabled={data.currentPage <= 1 || loading}
						>
							<ChevronLeft class="size-4" />
						</button>
						<button
							type="button"
							class="btn btn-ghost btn-sm"
							onclick={() => loadPage(data.currentPage + 1)}
							disabled={data.currentPage >= data.totalPages || loading}
						>
							<ChevronRight class="size-4" />
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>