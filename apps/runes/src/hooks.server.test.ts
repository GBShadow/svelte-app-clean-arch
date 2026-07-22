import { describe, expect, test, vi, beforeEach } from 'vitest';

vi.mock('$app/environment', () => ({ dev: true }));
vi.mock('$lib/server/pocketbase', () => ({ createServerClient: vi.fn() }));
vi.mock('$lib/auth/passwordGate', () => ({ isPasswordExpired: vi.fn() }));
vi.mock('$lib/server/notificationStore', () => ({ deleteExpiredNotifications: vi.fn() }));

import { createServerClient } from '$lib/server/pocketbase';
import { isPasswordExpired } from '$lib/auth/passwordGate';
import { deleteExpiredNotifications } from '$lib/server/notificationStore';
import { redirect } from '@sveltejs/kit';

function fakeUrl(path: string): URL {
	return new URL(`http://localhost${path}`);
}

function fakeEvent(overrides: Record<string, any> = {}) {
	const authStore = {
		isValid: false,
		clear: vi.fn(),
		exportToCookie: vi.fn(() => 'cookie=val'),
		loadFromCookie: vi.fn()
	};
	const pb = { authStore, collection: vi.fn(), filter: vi.fn(() => '') };

	return {
		url: fakeUrl('/'),
		request: { headers: { get: vi.fn(() => '') } },
		locals: { pb, user: null },
		...overrides,
		pb // keep pb accessible
	};
}

function fakeResolve(): Response {
	return new Response('ok', { headers: { 'set-cookie': '' } });
}

describe('hooks.server', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(createServerClient).mockReturnValue(fakeEvent().locals.pb as any);
	});

	async function getHandle() {
		const mod = await import('./hooks.server');
		return mod.handle;
	}

	test('rota pública sem user não redireciona', async () => {
		const handle = await getHandle();
		const evt = fakeEvent({ url: fakeUrl('/login') });
		const resolve = vi.fn().mockResolvedValue(new Response('ok'));

		await handle({ event: evt as any, resolve });

		expect(resolve).toHaveBeenCalled();
	});

	test('rota protegida sem user redireciona para /login', async () => {
		const handle = await getHandle();
		const evt = fakeEvent({ url: fakeUrl('/kanban') });
		const resolve = vi.fn();

		await expect(handle({ event: evt as any, resolve })).rejects.toMatchObject({
			status: 303,
			location: '/login'
		});
	});

	test('rota pública com user redireciona para /', async () => {
		const pb = fakeEvent().locals.pb;
		pb.authStore.isValid = true;
		pb.collection = vi.fn(() => ({
			authRefresh: vi.fn().mockResolvedValue({
				record: { id: 'auth1', email: 'a@a.com', isAdmin: false, mustChangePassword: false, passwordSetAt: null, avatar: '' }
			}),
			getFirstListItem: vi.fn().mockResolvedValue({ id: 'p1', name: 'Alice', email: 'a@a.com', jobTitle: '' })
		}));
		vi.mocked(createServerClient).mockReturnValue(pb as any);

		const handle = await getHandle();
		const evt = fakeEvent({ url: fakeUrl('/login') });
		const resolve = vi.fn();

		await expect(handle({ event: evt as any, resolve })).rejects.toMatchObject({
			status: 303,
			location: '/'
		});
	});

	test('user autenticado com password expirado redireciona para /change-password', async () => {
		const pb = fakeEvent().locals.pb;
		pb.authStore.isValid = true;
		pb.collection = vi.fn(() => ({
			authRefresh: vi.fn().mockResolvedValue({
				record: { id: 'auth1', email: 'a@a.com', isAdmin: false, mustChangePassword: true, passwordSetAt: null, avatar: '' }
			}),
			getFirstListItem: vi.fn().mockResolvedValue({ id: 'p1', name: 'Alice', email: 'a@a.com', jobTitle: '' })
		}));
		vi.mocked(createServerClient).mockReturnValue(pb as any);
		vi.mocked(isPasswordExpired).mockReturnValue(true);

		const handle = await getHandle();
		const evt = fakeEvent({ url: fakeUrl('/kanban') });
		const resolve = vi.fn();

		await expect(handle({ event: evt as any, resolve })).rejects.toMatchObject({
			status: 303,
			location: '/change-password'
		});
	});

	test('authRefresh com erro limpa authStore e user fica null', async () => {
		const pb = fakeEvent().locals.pb;
		pb.authStore.isValid = true;
		pb.collection = vi.fn(() => ({
			authRefresh: vi.fn().mockRejectedValue(new Error('invalid'))
		}));
		vi.mocked(createServerClient).mockReturnValue(pb as any);

		const handle = await getHandle();
		const evt = fakeEvent({ url: fakeUrl('/login') });
		const resolve = vi.fn().mockResolvedValue(new Response('ok'));

		await handle({ event: evt as any, resolve });
		expect(evt.locals.user).toBeNull();
		expect(pb.authStore.clear).toHaveBeenCalled();
	});

	test('handle adiciona cookie set-cookie na resposta', async () => {
		const handle = await getHandle();
		const evt = fakeEvent({ url: fakeUrl('/login') });
		const resolve = vi.fn().mockResolvedValue(new Response('ok'));

		const response = await handle({ event: evt as any, resolve });
		const cookies = response.headers.get('set-cookie') || '';
		expect(cookies).toContain('cookie=val');
	});

	test('cleanup não roda em dev', async () => {
		await getHandle();
		expect(deleteExpiredNotifications).not.toHaveBeenCalled();
	});
});
