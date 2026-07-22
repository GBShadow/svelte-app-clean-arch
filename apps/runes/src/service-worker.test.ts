import { describe, expect, test, vi, beforeEach } from 'vitest';

vi.mock('$lib/client/pushDecision', () => ({ shouldSuppressChatPush: vi.fn() }));
vi.mock('$lib/domain/pushPayload', () => ({ isSafeRedirectUrl: vi.fn() }));

import { shouldSuppressChatPush } from '$lib/client/pushDecision';
import { isSafeRedirectUrl } from '$lib/domain/pushPayload';

function setupSw() {
	const eventListeners: Record<string, Function[]> = {};
	const addEventListener = vi.fn((type: string, cb: Function) => {
		if (!eventListeners[type]) eventListeners[type] = [];
		eventListeners[type].push(cb);
	});
	const showNotification = vi.fn().mockResolvedValue(undefined);
	const close = vi.fn();
	const matchAll = vi.fn().mockResolvedValue([]);
	const focus = vi.fn().mockResolvedValue(undefined);
	const openWindow = vi.fn().mockResolvedValue(undefined);

	const selfMock = {
		addEventListener,
		registration: { showNotification },
		clients: { matchAll, openWindow },
		location: { origin: 'http://localhost' }
	};

	Object.defineProperty(globalThis, 'self', {
		value: selfMock,
		configurable: true,
		writable: true
	});

	return { eventListeners, addEventListener, showNotification, close, matchAll, focus, openWindow };
}

function triggerPushEvent(listener: Function, payload?: any) {
	const data = payload ? { json: () => payload } : null;
	const waitUntil = vi.fn((cb: Promise<any>) => cb);
	listener({ data, waitUntil } as any);
}

function triggerNotificationClick(listener: Function, url?: string) {
	const close = vi.fn();
	listener({
		notification: { close, data: url ? { url } : {} },
		waitUntil: vi.fn((cb: Promise<any>) => cb)
	} as any);
}

describe('service-worker', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		setupSw();
		vi.resetModules();
	});

async function loadSw() {
	await import('./service-worker');
	const self = (globalThis as any).self;
	const listeners = self.addEventListener.mock.calls;
	const handlers: Record<string, Function> = {};
	for (const [type, cb] of listeners) {
		if (!handlers[type]) handlers[type] = cb;
	}
	return handlers;
}

	test('push sem data não mostra notificação', async () => {
		const handlers = await loadSw();
		triggerPushEvent(handlers.push, null);
		expect((globalThis as any).self.registration.showNotification).not.toHaveBeenCalled();
	});

	test('push com JSON inválido não mostra notificação', async () => {
		const handlers = await loadSw();
		const event = { data: null, waitUntil: vi.fn() };
		handlers.push(event);
		expect((globalThis as any).self.registration.showNotification).not.toHaveBeenCalled();
	});

	test('push system com URL segura mostra notificação', async () => {
		vi.mocked(isSafeRedirectUrl).mockReturnValue(true);
		const handlers = await loadSw();

		triggerPushEvent(handlers.push, { type: 'system', title: 'Sys', body: 'Msg', url: '/ok' });
		await vi.waitFor(() => {
			expect((globalThis as any).self.registration.showNotification).toHaveBeenCalledWith('Sys', {
				body: 'Msg',
				data: { url: '/ok' }
			});
		});
	});

	test('push com URL insegura não mostra notificação', async () => {
		vi.mocked(isSafeRedirectUrl).mockReturnValue(false);
		const handlers = await loadSw();

		triggerPushEvent(handlers.push, { type: 'system', title: 'Sys', body: 'Msg', url: 'http://evil.com' });
		await vi.waitFor(() => {
			expect((globalThis as any).self.registration.showNotification).not.toHaveBeenCalled();
		});
	});

	test('push chat com aba não focada mostra notificação', async () => {
		vi.mocked(isSafeRedirectUrl).mockReturnValue(true);
		vi.mocked(shouldSuppressChatPush).mockResolvedValue(false);
		const handlers = await loadSw();

		triggerPushEvent(handlers.push, { type: 'chat', title: 'Chat', body: 'Msg', url: '/chat/r1' });
		await vi.waitFor(() => {
			expect((globalThis as any).self.registration.showNotification).toHaveBeenCalled();
		});
	});

	test('push chat com aba focada suprime notificação', async () => {
		vi.mocked(isSafeRedirectUrl).mockReturnValue(true);
		vi.mocked(shouldSuppressChatPush).mockResolvedValue(true);
		const handlers = await loadSw();

		triggerPushEvent(handlers.push, { type: 'chat', title: 'Chat', body: 'Msg', url: '/chat/r1' });
		await vi.waitFor(() => {
			expect((globalThis as any).self.registration.showNotification).not.toHaveBeenCalled();
		});
	});

	test('notificationclick com URL segura abre ou foca aba', async () => {
		vi.mocked(isSafeRedirectUrl).mockReturnValue(true);
		const handlers = await loadSw();

		triggerNotificationClick(handlers.notificationclick, '/target');
		await vi.waitFor(() => {
			expect((globalThis as any).self.clients.openWindow).toHaveBeenCalledWith('/target');
		});
	});

	test('notificationclick com URL insegura não abre aba', async () => {
		vi.mocked(isSafeRedirectUrl).mockReturnValue(false);
		const handlers = await loadSw();

		triggerNotificationClick(handlers.notificationclick, 'http://evil.com');
		await vi.waitFor(() => {
			expect((globalThis as any).self.clients.openWindow).not.toHaveBeenCalled();
		});
	});

	test('notificationclick sem data não abre aba', async () => {
		const handlers = await loadSw();
		triggerNotificationClick(handlers.notificationclick, undefined);
		await vi.waitFor(() => {
			expect((globalThis as any).self.clients.openWindow).not.toHaveBeenCalled();
		});
	});

	test('notificationclick foca aba existente', async () => {
		vi.mocked(isSafeRedirectUrl).mockReturnValue(true);
		const focus = vi.fn().mockResolvedValue(undefined);
		(globalThis as any).self.clients.matchAll.mockResolvedValue([
			{ url: 'http://localhost/target', focus }
		]);

		const handlers = await loadSw();
		triggerNotificationClick(handlers.notificationclick, '/target');
		await vi.waitFor(() => {
			expect(focus).toHaveBeenCalled();
		});
	});
});
