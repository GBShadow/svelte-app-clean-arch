import { describe, expect, test, vi } from 'vitest';
import { onAuthEvent, postAuthEvent } from './authChannel';

describe('authChannel', () => {
	test('entrega o evento postado para quem está inscrito', async () => {
		const received: string[] = [];
		const unsubscribe = onAuthEvent((type) => received.push(type));

		postAuthEvent('login');

		await vi.waitFor(() => {
			expect(received).toEqual(['login']);
		});

		unsubscribe();
	});

	test('degrada silenciosamente quando BroadcastChannel não está disponível', () => {
		const original = globalThis.BroadcastChannel;
		// @ts-expect-error - simula ambiente sem suporte a BroadcastChannel
		delete globalThis.BroadcastChannel;

		expect(() => postAuthEvent('logout')).not.toThrow();
		const unsubscribe = onAuthEvent(() => {});
		expect(() => unsubscribe()).not.toThrow();

		globalThis.BroadcastChannel = original;
	});
});
