import { describe, expect, test } from 'vitest';
import {
	buildChatPushPayload,
	buildSystemPushPayload,
	isSafeRedirectUrl,
	truncateMessage
} from './pushPayload';

describe('truncateMessage', () => {
	test('mantém texto curto intacto', () => {
		expect(truncateMessage('oi')).toBe('oi');
	});

	test('trunca texto longo em 120 caracteres (com reticências)', () => {
		const text = 'a'.repeat(200);
		const result = truncateMessage(text);
		expect(result.length).toBe(120);
		expect(result.endsWith('…')).toBe(true);
	});

	test('respeita limite customizado', () => {
		expect(truncateMessage('abcdefgh', 5)).toBe('abcd…');
	});
});

describe('isSafeRedirectUrl', () => {
	test('aceita path relativo same-origin', () => {
		expect(isSafeRedirectUrl('/chat/room123')).toBe(true);
	});

	test('rejeita URL absoluta http', () => {
		expect(isSafeRedirectUrl('http://evil.com')).toBe(false);
	});

	test('rejeita esquema javascript:', () => {
		expect(isSafeRedirectUrl('javascript:alert(1)')).toBe(false);
	});

	test('rejeita protocol-relative //', () => {
		expect(isSafeRedirectUrl('//evil.com')).toBe(false);
	});

	test('rejeita backslash disfarçado de path', () => {
		expect(isSafeRedirectUrl('/\\evil.com')).toBe(false);
	});

	test('rejeita string vazia', () => {
		expect(isSafeRedirectUrl('')).toBe(false);
	});
});

describe('buildChatPushPayload', () => {
	test('monta payload tipo chat com preview truncado e url da sala', () => {
		const payload = buildChatPushPayload({
			roomId: 'room1',
			roomName: 'Sala 1',
			senderName: 'Ana',
			text: 'olá'
		});

		expect(payload).toEqual({
			type: 'chat',
			title: 'Ana',
			body: 'olá',
			url: '/chat/room1',
			data: { roomId: 'room1', roomName: 'Sala 1' }
		});
	});
});

describe('buildSystemPushPayload', () => {
	test('monta payload tipo system com url válida', () => {
		const payload = buildSystemPushPayload({
			title: 'Novo cartão',
			body: 'Você foi atribuído',
			url: '/kanban'
		});

		expect(payload).toEqual({
			type: 'system',
			title: 'Novo cartão',
			body: 'Você foi atribuído',
			url: '/kanban',
			data: {}
		});
	});

	test('retorna null para url insegura', () => {
		expect(buildSystemPushPayload({ title: 't', body: 'b', url: 'https://evil.com' })).toBeNull();
	});

	test('retorna null quando payload excede o limite prático de tamanho', () => {
		const payload = buildSystemPushPayload({
			title: 'x'.repeat(5000),
			body: 'y',
			url: '/kanban'
		});
		expect(payload).toBeNull();
	});
});
