import { describe, expect, test } from 'vitest';
import { loginSchema } from './authSchemas';

describe('loginSchema', () => {
	test('aceita e-mail e senha válidos', () => {
		const result = loginSchema.safeParse({ email: 'user@example.com', password: '123456' });
		expect(result.success).toBe(true);
	});

	test('rejeita e-mail inválido', () => {
		const result = loginSchema.safeParse({ email: 'not-an-email', password: '123456' });
		expect(result.success).toBe(false);
	});

	test('rejeita senha vazia', () => {
		const result = loginSchema.safeParse({ email: 'user@example.com', password: '' });
		expect(result.success).toBe(false);
	});

	test('rejeita campos ausentes', () => {
		const result = loginSchema.safeParse({});
		expect(result.success).toBe(false);
	});
});
