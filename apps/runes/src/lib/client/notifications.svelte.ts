import { browser } from '$app/environment';
import { createBrowserClient } from '$lib/client/pocketbaseClient';
import { goto } from '$app/navigation';
import type { NotificationRecord, NotificationType } from '$lib/domain/notification';
import { isSafeRedirectUrl } from '$lib/domain/notification';

interface NotificationFilter {
	type?: NotificationType;
	read?: boolean;
}

export class NotificationStore {
	#pb: ReturnType<typeof createBrowserClient> | null = null;
	#userId: string | null = null;
	#unsubscribe: (() => void) | null = null;

	notifications = $state<NotificationRecord[]>([]);
	loading = $state(false);
	page = $state(1);
	hasMore = $state(true);
	filter = $state<NotificationFilter>({});

	unreadCount = $derived(this.notifications.filter((n) => !n.read).length);

	init(authId: string, pbToken: string, pbRecord: any) {
		if (this.#userId === authId && this.#pb) return;
		this.#userId = authId;
		this.#pb = createBrowserClient(pbToken, pbRecord);
		this.destroy();
		this.subscribeRealtime();
	}

	async load(opts: { page?: number; append?: boolean; filter?: NotificationFilter } = {}) {
		if (!this.#pb || !this.#userId) return;
		const { page = 1, append = false, filter } = opts;
		this.loading = true;
		try {
			if (filter) this.filter = filter;
			const params = new URLSearchParams({
				page: String(page),
				perPage: '20',
				...(this.filter.type && { type: this.filter.type }),
				...(this.filter.read !== undefined && { read: String(this.filter.read) })
			});
			const res = await this.#pb.send(`/api/notifications?${params}`, { method: 'GET' });
			if (append) {
				this.notifications = [...this.notifications, ...res.items];
			} else {
				this.notifications = res.items;
			}
			this.page = res.page;
			this.hasMore = res.page < res.totalPages;
		} catch (e) {
			console.error('Erro ao carregar notificações:', e);
		} finally {
			this.loading = false;
		}
	}

	async loadMore() {
		if (this.hasMore && !this.loading) {
			await this.load({ page: this.page + 1, append: true });
		}
	}

	async markAsRead(ids: string[]) {
		if (!this.#pb || !this.#userId) return;
		for (const id of ids) {
			const idx = this.notifications.findIndex((n) => n.id === id);
			if (idx !== -1) this.notifications[idx] = { ...this.notifications[idx], read: true };
		}
		try {
			await this.#pb.send('/api/notifications/read', { method: 'POST', body: { ids } });
		} catch (e) {
			console.error('Erro ao marcar como lida:', e);
			this.load({ page: 1 });
		}
	}

	async markAllAsRead() {
		if (!this.#pb || !this.#userId) return;
		this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
		try {
			await this.#pb.send('/api/notifications/read-all', { method: 'POST' });
		} catch (e) {
			console.error('Erro ao marcar todas como lidas:', e);
			this.load({ page: 1 });
		}
	}

	suppressChatNotification(roomId: string) {
		const ids = this.notifications
			.filter((n) => n.type === 'chat' && !n.read && n.metadata?.roomId === roomId)
			.map((n) => n.id);
		if (ids.length > 0) this.markAsRead(ids);
	}

	async markAsReadAndNavigate(id: string, url: string) {
		if (!isSafeRedirectUrl(url)) return;
		await this.markAsRead([id]);
		await goto(url);
	}

	subscribeRealtime() {
		if (!this.#pb || !this.#userId || !browser) return;
		const promise = this.#pb.collection('notifications').subscribe(
			'*',
			(e) => {
				if (!('user' in e.record) || e.record.user !== this.#userId) return;
				const record = e.record as unknown as NotificationRecord;
				switch (e.action) {
					case 'create':
						this.notifications = [record, ...this.notifications].slice(0, 100);
						break;
					case 'update':
						this.notifications = this.notifications.map((n) =>
							n.id === record.id ? record : n
						);
						break;
					case 'delete':
						this.notifications = this.notifications.filter((n) => n.id !== record.id);
						break;
				}
			},
			{ filter: `user = "${this.#userId}"` }
		);
		promise.then((unsub) => {
			this.#unsubscribe = unsub;
		});
	}

	async deleteNotification(id: string) {
		if (!this.#pb || !this.#userId) return;
		this.notifications = this.notifications.filter((n) => n.id !== id);
		try {
			await this.#pb.collection('notifications').delete(id);
		} catch (e) {
			console.error('Erro ao deletar notificação:', e);
			this.load({ page: 1 });
		}
	}

	destroy() {
		this.#unsubscribe?.();
		this.#unsubscribe = null;
	}
}

export const notificationStore = new NotificationStore();