import { describe, expect, test } from 'vitest';
import { avatarSchema, createRoomSchema, sendMessageSchema } from './chatSchemas';

describe('createRoomSchema', () => {
	test('aceita ao menos um participante, nome opcional', () => {
		const result = createRoomSchema.safeParse({ participantIds: ['a@x.com'] });
		expect(result.success).toBe(true);
	});

	test('rejeita sem participantes', () => {
		const result = createRoomSchema.safeParse({ participantIds: [] });
		expect(result.success).toBe(false);
	});
});

describe('sendMessageSchema', () => {
	test('aceita texto dentro do limite', () => {
		expect(sendMessageSchema.safeParse({ text: 'oi' }).success).toBe(true);
	});

	test('rejeita texto vazio', () => {
		expect(sendMessageSchema.safeParse({ text: '' }).success).toBe(false);
	});

	test('rejeita texto acima de 2000 caracteres', () => {
		expect(sendMessageSchema.safeParse({ text: 'a'.repeat(2001) }).success).toBe(false);
	});
});

describe('avatarSchema', () => {
	test('aceita imagem jpeg dentro do limite', () => {
		const file = new File(['x'], 'avatar.jpg', { type: 'image/jpeg' });
		expect(avatarSchema.safeParse(file).success).toBe(true);
	});

	test('rejeita formato inválido', () => {
		const file = new File(['x'], 'avatar.gif', { type: 'image/gif' });
		expect(avatarSchema.safeParse(file).success).toBe(false);
	});

	test('rejeita arquivo maior que 2MB', () => {
		const big = new Uint8Array(2 * 1024 * 1024 + 1);
		const file = new File([big], 'avatar.png', { type: 'image/png' });
		expect(avatarSchema.safeParse(file).success).toBe(false);
	});

	test('rejeita arquivo vazio', () => {
		const file = new File([], 'avatar.png', { type: 'image/png' });
		expect(avatarSchema.safeParse(file).success).toBe(false);
	});
});
