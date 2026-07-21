import { describe, expect, test } from 'vitest';
import { shouldSuppressChatPush } from './pushDecision';

describe('shouldSuppressChatPush', () => {
	test('suprime quando a aba da sala está focada (AC4)', () => {
		const clients = [{ url: 'https://app.example.com/chat/room1', focused: true }];
		expect(shouldSuppressChatPush(clients, '/chat/room1')).toBe(true);
	});

	test('não suprime quando a aba da sala existe mas está sem foco (AC7)', () => {
		const clients = [{ url: 'https://app.example.com/chat/room1', focused: false }];
		expect(shouldSuppressChatPush(clients, '/chat/room1')).toBe(false);
	});

	test('não suprime quando não há aba na sala (AC3)', () => {
		const clients = [{ url: 'https://app.example.com/chat/room2', focused: true }];
		expect(shouldSuppressChatPush(clients, '/chat/room1')).toBe(false);
	});

	test('não suprime quando não há nenhuma aba aberta', () => {
		expect(shouldSuppressChatPush([], '/chat/room1')).toBe(false);
	});

	test('ignora aba focada em outra rota do app (ex.: listagem /chat)', () => {
		const clients = [{ url: 'https://app.example.com/chat', focused: true }];
		expect(shouldSuppressChatPush(clients, '/chat/room1')).toBe(false);
	});

	test('suprime considerando apenas o pathname, ignorando querystring/hash', () => {
		const clients = [{ url: 'https://app.example.com/chat/room1?ref=push#top', focused: true }];
		expect(shouldSuppressChatPush(clients, '/chat/room1')).toBe(true);
	});
});
