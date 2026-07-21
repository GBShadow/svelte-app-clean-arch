import { describe, expect, test } from 'vitest';
import { subscribeSchema, unsubscribeSchema } from './pushSchemas';

describe('subscribeSchema', () => {
	test('aceita payload de subscription válido', () => {
		const result = subscribeSchema.safeParse({
			endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
			keys: { p256dh: 'key-p256dh', auth: 'key-auth' }
		});
		expect(result.success).toBe(true);
	});

	test('rejeita endpoint que não é URL', () => {
		const result = subscribeSchema.safeParse({
			endpoint: 'not-a-url',
			keys: { p256dh: 'a', auth: 'b' }
		});
		expect(result.success).toBe(false);
	});

	test('rejeita keys ausentes', () => {
		const result = subscribeSchema.safeParse({
			endpoint: 'https://fcm.googleapis.com/fcm/send/abc123'
		});
		expect(result.success).toBe(false);
	});

	test('rejeita p256dh vazio', () => {
		const result = subscribeSchema.safeParse({
			endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
			keys: { p256dh: '', auth: 'b' }
		});
		expect(result.success).toBe(false);
	});

	test('aceita endpoint da Mozilla (Firefox)', () => {
		const result = subscribeSchema.safeParse({
			endpoint: 'https://updates.push.services.mozilla.com/wpush/v2/abc123',
			keys: { p256dh: 'a', auth: 'b' }
		});
		expect(result.success).toBe(true);
	});

	test('rejeita host fora da allowlist (SSRF para serviço externo arbitrário)', () => {
		const result = subscribeSchema.safeParse({
			endpoint: 'https://evil.example.com/collect',
			keys: { p256dh: 'a', auth: 'b' }
		});
		expect(result.success).toBe(false);
	});

	test('rejeita endereço interno/loopback (SSRF)', () => {
		const result = subscribeSchema.safeParse({
			endpoint: 'https://127.0.0.1:8090/api/collections/auth/records',
			keys: { p256dh: 'a', auth: 'b' }
		});
		expect(result.success).toBe(false);
	});

	test('rejeita esquema http (não-TLS) mesmo em host permitido', () => {
		const result = subscribeSchema.safeParse({
			endpoint: 'http://fcm.googleapis.com/fcm/send/abc123',
			keys: { p256dh: 'a', auth: 'b' }
		});
		expect(result.success).toBe(false);
	});

	test('rejeita truque de subdomínio disfarçado (fcm.googleapis.com.evil.com)', () => {
		const result = subscribeSchema.safeParse({
			endpoint: 'https://fcm.googleapis.com.evil.com/fcm/send/abc123',
			keys: { p256dh: 'a', auth: 'b' }
		});
		expect(result.success).toBe(false);
	});
});

describe('unsubscribeSchema', () => {
	test('aceita endpoint válido', () => {
		expect(
			unsubscribeSchema.safeParse({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc123' })
				.success
		).toBe(true);
	});

	test('rejeita endpoint inválido', () => {
		expect(unsubscribeSchema.safeParse({ endpoint: 'nope' }).success).toBe(false);
	});
});
