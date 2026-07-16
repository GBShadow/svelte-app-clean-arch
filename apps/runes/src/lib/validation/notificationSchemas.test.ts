import { describe, it, expect } from 'vitest';
import {
	createNotificationSchema,
	markReadSchema,
	listQuerySchema
} from './notificationSchemas';

describe('notificationSchemas', () => {
	describe('createNotificationSchema', () => {
		it('accepts valid chat notification', () => {
			const result = createNotificationSchema.safeParse({
				type: 'chat',
				title: 'João Silva',
				body: 'Olá, tudo bem?',
				url: '/chat/abc123',
				metadata: { roomId: 'abc123', messageId: 'msg456' }
			});
			expect(result.success).toBe(true);
		});

		it('accepts valid system notification without url', () => {
			const result = createNotificationSchema.safeParse({
				type: 'system',
				title: 'Bem-vindo!',
				body: 'Sua conta foi criada.'
			});
			expect(result.success).toBe(true);
		});

		it('rejects invalid type', () => {
			const result = createNotificationSchema.safeParse({
				type: 'invalid',
				title: 'Test',
				body: 'Test'
			});
			expect(result.success).toBe(false);
		});

		it('rejects unsafe URL (absolute)', () => {
			const result = createNotificationSchema.safeParse({
				type: 'chat',
				title: 'Test',
				body: 'Test',
				url: 'https://evil.com'
			});
			expect(result.success).toBe(false);
		});

		it('rejects unsafe URL (javascript:)', () => {
			const result = createNotificationSchema.safeParse({
				type: 'chat',
				title: 'Test',
				body: 'Test',
				url: 'javascript:alert(1)'
			});
			expect(result.success).toBe(false);
		});

		it('rejects unsafe URL (protocol-relative)', () => {
			const result = createNotificationSchema.safeParse({
				type: 'chat',
				title: 'Test',
				body: 'Test',
				url: '//evil.com'
			});
			expect(result.success).toBe(false);
		});

		it('rejects empty title', () => {
			const result = createNotificationSchema.safeParse({
				type: 'chat',
				title: '',
				body: 'Test'
			});
			expect(result.success).toBe(false);
		});

		it('rejects title too long', () => {
			const result = createNotificationSchema.safeParse({
				type: 'chat',
				title: 'a'.repeat(201),
				body: 'Test'
			});
			expect(result.success).toBe(false);
		});

		it('rejects body too long', () => {
			const result = createNotificationSchema.safeParse({
				type: 'chat',
				title: 'Test',
				body: 'a'.repeat(1001)
			});
			expect(result.success).toBe(false);
		});
	});

	describe('markReadSchema', () => {
		it('accepts valid ids array', () => {
			const result = markReadSchema.safeParse({ ids: ['id1', 'id2'] });
			expect(result.success).toBe(true);
		});

		it('rejects empty array', () => {
			const result = markReadSchema.safeParse({ ids: [] });
			expect(result.success).toBe(false);
		});

		it('rejects missing ids', () => {
			const result = markReadSchema.safeParse({});
			expect(result.success).toBe(false);
		});
	});

	describe('listQuerySchema', () => {
		it('accepts valid query', () => {
			const result = listQuerySchema.safeParse({ page: '1', perPage: '20', type: 'chat', read: 'false' });
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.page).toBe(1);
				expect(result.data.perPage).toBe(20);
				expect(result.data.type).toBe('chat');
				expect(result.data.read).toBe(false);
			}
		});

		it('uses defaults', () => {
			const result = listQuerySchema.safeParse({});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.page).toBe(1);
				expect(result.data.perPage).toBe(20);
				expect(result.data.type).toBeUndefined();
				expect(result.data.read).toBeUndefined();
			}
		});

		it('rejects invalid page', () => {
			const result = listQuerySchema.safeParse({ page: '0' });
			expect(result.success).toBe(false);
		});

		it('rejects perPage > 100', () => {
			const result = listQuerySchema.safeParse({ perPage: '101' });
			expect(result.success).toBe(false);
		});
	});
});