import { describe, expect, test, vi, beforeEach } from 'vitest';

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/client/pocketbaseClient');

import { createBrowserClient } from '$lib/client/pocketbaseClient';
import { goto } from '$app/navigation';

describe('NotificationStore', () => {
	let subscribeCallback: ((e: any) => void) | null;

	beforeEach(() => {
		subscribeCallback = null;
		vi.clearAllMocks();
		vi.restoreAllMocks();
		vi.resetModules();

		const subscribeMock = vi.fn().mockImplementation((_event: string, cb: (e: any) => void) => {
			subscribeCallback = cb;
			return Promise.resolve(vi.fn());
		});
		const pbMock = {
			collection: vi.fn(() => ({
				subscribe: subscribeMock
			}))
		};
		vi.mocked(createBrowserClient).mockReturnValue(pbMock as any);
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ items: [], page: 1, totalPages: 1 }) }));
	});

	async function createStore() {
		const mod = await import('./notifications.svelte');
		const store = mod.notificationStore;
		store.notifications = [];
		store.page = 1;
		store.hasMore = true;
		store.loading = false;
		store.filter = {};
		return store;
	}

	test('unreadCount computa corretamente', async () => {
		const store = await createStore();
		store.notifications = [
			{ id: '1', read: false } as any,
			{ id: '2', read: true } as any,
			{ id: '3', read: false } as any
		];
		expect(store.unreadCount).toBe(2);
	});

	test('load popula notifications', async () => {
		const store = await createStore();
		const items = [{ id: '1' }, { id: '2' }];
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ items, page: 1, totalPages: 1 })
		} as any);

		store.init('user1', 'token', {});
		await store.load();

		expect((fetch as any).mock.calls[0][0]).toBe('/api/notifications?page=1&perPage=20');
		expect(store.notifications).toEqual(items);
		expect(store.loading).toBe(false);
	});

	test('load com append', async () => {
		const store = await createStore();
		store.notifications = [{ id: 'old' } as any];
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ items: [{ id: 'new' }], page: 2, totalPages: 2 })
		} as any);

		store.init('user1', 'token', {});
		await store.load({ page: 2, append: true });

		expect(store.notifications).toHaveLength(2);
		expect(store.notifications[1].id).toBe('new');
	});

	test('loadMore chama load com página seguinte', async () => {
		const store = await createStore();
		store.hasMore = true;
		store.loading = false;
		store.page = 1;
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ items: [], page: 2, totalPages: 2 })
		} as any);

		store.init('user1', 'token', {});
		await store.loadMore();

		expect((fetch as any).mock.calls[0][0]).toContain('page=2');
	});

	test('load não faz nada sem userId', async () => {
		const store = await createStore();
		await store.load();
		expect(fetch).not.toHaveBeenCalled();
	});

	test('markAsRead faz optimistic update e POST', async () => {
		const store = await createStore();
		store.notifications = [{ id: 'n1', read: false } as any, { id: 'n2', read: false } as any];
		vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as any);

		store.init('user1', 'token', {});
		await store.markAsRead(['n1']);

		expect(store.notifications[0].read).toBe(true);
		expect(store.notifications[1].read).toBe(false);
		expect(fetch).toHaveBeenCalledWith('/api/notifications/read', expect.objectContaining({
			method: 'POST',
			body: JSON.stringify({ ids: ['n1'] })
		}));
	});

	test('markAllAsRead otimista e POST', async () => {
		const store = await createStore();
		store.notifications = [{ id: 'n1', read: false } as any, { id: 'n2', read: false } as any];

		store.init('user1', 'token', {});
		await store.markAllAsRead();

		expect(store.notifications.every((n: any) => n.read)).toBe(true);
		expect(fetch).toHaveBeenCalledWith('/api/notifications/read-all', { method: 'POST' });
	});

	test('suppressChatNotification marca como lidas', async () => {
		const store = await createStore();
		store.notifications = [
			{ id: 'c1', type: 'chat', read: false, metadata: { roomId: 'r1' } } as any,
			{ id: 'c2', type: 'chat', read: false, metadata: { roomId: 'r2' } } as any,
			{ id: 'c3', type: 'chat', read: true, metadata: { roomId: 'r1' } } as any
		];

		store.init('user1', 'token', {});
		await store.suppressChatNotification('r1');

		expect(fetch).toHaveBeenCalledWith('/api/notifications/read', expect.objectContaining({
			body: JSON.stringify({ ids: ['c1'] })
		}));
	});

	test('markAsReadAndNavigate chama goto para URL segura', async () => {
		const store = await createStore();
		store.notifications = [{ id: 'n1', read: false } as any];
		store.init('user1', 'token', {});
		await store.markAsReadAndNavigate('n1', '/target');

		expect(goto).toHaveBeenCalledWith('/target');
	});

	test('markAsReadAndNavigate não navega para URL insegura', async () => {
		const store = await createStore();
		store.init('user1', 'token', {});
		await store.markAsReadAndNavigate('n1', 'http://evil.com');

		expect(goto).not.toHaveBeenCalled();
	});

	test('deleteNotification otimista e faz reload', async () => {
		const store = await createStore();
		store.notifications = [{ id: 'd1' } as any, { id: 'd2' } as any];
		vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as any);
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ items: [{ id: 'd2' }], page: 1, totalPages: 1 })
		} as any);

		store.init('user1', 'token', {});
		await store.deleteNotification('d1');

		expect(store.notifications).toHaveLength(1);
		expect(store.notifications[0].id).toBe('d2');
		expect(fetch).toHaveBeenCalledWith('/api/notifications/d1', { method: 'DELETE' });
	});

	test('subscribeRealtime: create adiciona no início', async () => {
		const store = await createStore();
		store.notifications = [{ id: 'old' } as any];
		store.init('user1', 'token', {});

		expect(subscribeCallback).not.toBeNull();
		subscribeCallback!({ action: 'create', record: { id: 'new', user: 'user1' } });

		expect(store.notifications[0].id).toBe('new');
		expect(store.notifications).toHaveLength(2);
	});

	test('subscribeRealtime: update modifica registro', async () => {
		const store = await createStore();
		store.notifications = [{ id: 'n1', read: false } as any];
		store.init('user1', 'token', {});

		subscribeCallback!({ action: 'update', record: { id: 'n1', read: true, user: 'user1' } });

		expect(store.notifications[0].read).toBe(true);
	});

	test('subscribeRealtime: delete remove registro', async () => {
		const store = await createStore();
		store.notifications = [{ id: 'n1' } as any, { id: 'n2' } as any];
		store.init('user1', 'token', {});

		subscribeCallback!({ action: 'delete', record: { id: 'n1', user: 'user1' } });

		expect(store.notifications).toHaveLength(1);
		expect(store.notifications[0].id).toBe('n2');
	});

	test('hasMore é false quando não há mais páginas', async () => {
		const store = await createStore();
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ items: [], page: 1, totalPages: 1 })
		} as any);

		store.init('user1', 'token', {});
		await store.load();

		expect(store.hasMore).toBe(false);
	});

	test('init não recria pb client para mesmo userId', async () => {
		const store = await createStore();
		store.init('user1', 'token', {});
		store.init('user1', 'token', {});
		expect(createBrowserClient).toHaveBeenCalledTimes(1);
	});
});
