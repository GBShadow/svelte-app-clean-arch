import { describe, expect, test, vi, beforeEach } from 'vitest';

vi.mock('$env/static/public', () => ({ PUBLIC_VAPID_PUBLIC_KEY: 'testkey' }));

function setupBrowser() {
	const sw = {
		ready: Promise.resolve({
			pushManager: {
				subscribe: vi.fn().mockResolvedValue({
					toJSON: () => ({ endpoint: 'https://push.endpoint', keys: { p256dh: 'k1', auth: 'a1' } })
				}),
				getSubscription: vi.fn()
			}
		})
	};
	Object.defineProperty(globalThis, 'window', {
		value: { PushManager: {}, Notification: {} },
		configurable: true
	});
	Object.defineProperty(navigator, 'serviceWorker', { value: sw, configurable: true });
	Object.defineProperty(globalThis, 'Notification', {
		value: { requestPermission: vi.fn().mockResolvedValue('granted') },
		configurable: true
	});
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
}

function teardownBrowser() {
	Object.defineProperty(globalThis, 'window', { value: undefined, configurable: true });
	delete (navigator as any).serviceWorker;
	delete (globalThis as any).Notification;
	vi.unstubAllGlobals();
}

describe('isPushSupported', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.resetModules();
	});

	test('retorna true quando todas as APIs existem', async () => {
		setupBrowser();
		const { isPushSupported } = await import('./pushSubscription');
		expect(isPushSupported()).toBe(true);
		teardownBrowser();
	});

	test('retorna false sem window', async () => {
		teardownBrowser();
		const { isPushSupported } = await import('./pushSubscription');
		expect(isPushSupported()).toBe(false);
	});

	test('retorna false sem serviceWorker', async () => {
		setupBrowser();
		delete (navigator as any).serviceWorker;
		const { isPushSupported } = await import('./pushSubscription');
		expect(isPushSupported()).toBe(false);
		teardownBrowser();
	});
});

describe('enablePushNotifications', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.resetModules();
	});

	test('retorna unsupported quando não suportado', async () => {
		teardownBrowser();
		const { enablePushNotifications } = await import('./pushSubscription');
		const result = await enablePushNotifications();
		expect(result).toBe('unsupported');
	});

	test('retorna denied quando permissão negada', async () => {
		setupBrowser();
		vi.mocked(Notification.requestPermission).mockResolvedValue('denied');
		const { enablePushNotifications } = await import('./pushSubscription');
		const result = await enablePushNotifications();
		expect(result).toBe('denied');
		teardownBrowser();
	});

	test('retorna granted e registra subscription', async () => {
		setupBrowser();
		const { enablePushNotifications } = await import('./pushSubscription');
		const result = await enablePushNotifications();
		expect(result).toBe('granted');
		expect(fetch).toHaveBeenCalledWith('/api/push/subscribe', expect.objectContaining({ method: 'POST' }));
		teardownBrowser();
	});
});

describe('disablePushNotifications', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.resetModules();
	});

	test('não faz nada quando não suportado', async () => {
		teardownBrowser();
		const { disablePushNotifications } = await import('./pushSubscription');
		await expect(disablePushNotifications()).resolves.toBeUndefined();
	});

	test('revoga subscription e remove do servidor', async () => {
		setupBrowser();
		const unsubscribeMock = vi.fn();
		navigator.serviceWorker.ready = Promise.resolve({
			pushManager: {
				getSubscription: vi.fn().mockResolvedValue({
					endpoint: 'https://ep',
					toJSON: () => ({}),
					unsubscribe: unsubscribeMock
				})
			}
		} as any);
		const { disablePushNotifications } = await import('./pushSubscription');
		await disablePushNotifications();
		expect(fetch).toHaveBeenCalledWith('/api/push/unsubscribe', expect.objectContaining({ method: 'POST' }));
		expect(unsubscribeMock).toHaveBeenCalled();
		teardownBrowser();
	});
});

describe('hasActiveSubscription', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.resetModules();
	});

	test('retorna false quando não suportado', async () => {
		teardownBrowser();
		const { hasActiveSubscription } = await import('./pushSubscription');
		const result = await hasActiveSubscription();
		expect(result).toBe(false);
	});

	test('retorna false quando subscription não existe', async () => {
		setupBrowser();
		navigator.serviceWorker.ready = Promise.resolve({
			pushManager: { getSubscription: vi.fn().mockResolvedValue(null) }
		} as any);
		const { hasActiveSubscription } = await import('./pushSubscription');
		const result = await hasActiveSubscription();
		expect(result).toBe(false);
		teardownBrowser();
	});

	test('retorna true quando subscription existe', async () => {
		setupBrowser();
		navigator.serviceWorker.ready = Promise.resolve({
			pushManager: { getSubscription: vi.fn().mockResolvedValue({ endpoint: 'ep' }) }
		} as any);
		const { hasActiveSubscription } = await import('./pushSubscription');
		const result = await hasActiveSubscription();
		expect(result).toBe(true);
		teardownBrowser();
	});
});
