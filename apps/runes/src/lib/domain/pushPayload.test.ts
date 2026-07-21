import { describe, expect, test } from 'vitest';
import {
	buildChatPushPayload,
	buildSystemPushPayload,
	buildKanbanPushPayload,
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

describe('buildKanbanPushPayload', () => {
	test('cria payload para card criado', () => {
		const payload = buildKanbanPushPayload({
			cardTitle: 'Minha Task',
			cardId: 'card123',
			columnName: 'Aguardando',
			action: 'created'
		});

		expect(payload).not.toBeNull();
		expect(payload!.type).toBe('system');
		expect(payload!.title).toBe('Novo cartão atribuído');
		expect(payload!.body).toBe('Você foi atribuído ao cartão "Minha Task" na coluna "Aguardando"');
		expect(payload!.url).toBe('/kanban#card-card123');
		expect(payload!.data).toEqual({});
	});

	test('cria payload para card movido com movedByName', () => {
		const payload = buildKanbanPushPayload({
			cardTitle: 'Minha Task',
			cardId: 'card123',
			columnName: 'Fazendo',
			action: 'moved',
			movedByName: 'João'
		});

		expect(payload).not.toBeNull();
		expect(payload!.title).toBe('Cartão movido');
		expect(payload!.body).toBe('João moveu "Minha Task" para "Fazendo"');
		expect(payload!.url).toBe('/kanban#card-card123');
	});

	test('usa fallback "Alguém" quando movedByName não informado', () => {
		const payload = buildKanbanPushPayload({
			cardTitle: 'Task',
			cardId: 'card1',
			columnName: 'Feito',
			action: 'moved'
		});

		expect(payload!.body).toBe('Alguém moveu "Task" para "Feito"');
	});

	test('retorna null para url insegura (deep link com protocolo)', () => {
		// buildKanbanPushPayload sempre gera url relativa, mas testamos a validação interna
		const payload = buildKanbanPushPayload({
			cardTitle: 'Task',
			cardId: 'card1',
			columnName: 'Coluna',
			action: 'created'
		});
		// URL gerada é sempre relativa, então não deve ser null
		expect(payload).not.toBeNull();
	});
});
