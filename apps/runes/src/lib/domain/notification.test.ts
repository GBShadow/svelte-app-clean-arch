import { describe, it, expect } from 'vitest';
import {
	buildNotificationPayload,
	truncatePreview,
	isExpired,
	getTypeIcon,
	getTypeLabel,
	isSafeRedirectUrl
} from './notification';
import type { NotificationRecord } from './notification';

describe('notification domain', () => {
	describe('buildNotificationPayload', () => {
		it('creates payload with all fields', () => {
			const payload = buildNotificationPayload('chat', 'Title', 'Body', '/chat/123', { roomId: '123' });
			expect(payload).toEqual({
				type: 'chat',
				title: 'Title',
				body: 'Body',
				url: '/chat/123',
				metadata: { roomId: '123' }
			});
		});

		it('creates payload without optional fields', () => {
			const payload = buildNotificationPayload('system', 'Title', 'Body');
			expect(payload).toEqual({
				type: 'system',
				title: 'Title',
				body: 'Body',
				url: undefined,
				metadata: undefined
			});
		});
	});

	describe('truncatePreview', () => {
		it('returns text unchanged if within limit', () => {
			expect(truncatePreview('short', 10)).toBe('short');
		});

		it('truncates and adds ellipsis if over limit', () => {
			expect(truncatePreview('this is a very long text', 10)).toBe('this is a\u2026');
		});

		it('uses default max of 120', () => {
			const longText = 'a'.repeat(150);
			expect(truncatePreview(longText).length).toBe(121);
		});
	});

	describe('isExpired', () => {
		it('returns false if no expiresAt', () => {
			const n = { expiresAt: undefined } as NotificationRecord;
			expect(isExpired(n)).toBe(false);
		});

		it('returns false if expiresAt is in future', () => {
			const n = { expiresAt: new Date(Date.now() + 86400000).toISOString() } as NotificationRecord;
			expect(isExpired(n)).toBe(false);
		});

		it('returns true if expiresAt is in past', () => {
			const n = { expiresAt: new Date(Date.now() - 86400000).toISOString() } as NotificationRecord;
			expect(isExpired(n)).toBe(true);
		});
	});

	describe('getTypeIcon', () => {
		it('returns correct icons', () => {
			expect(getTypeIcon('chat')).toBe('MessageSquare');
			expect(getTypeIcon('system')).toBe('Bell');
			expect(getTypeIcon('kanban')).toBe('Kanban');
			expect(getTypeIcon('poker')).toBe('Users');
		});
	});

	describe('getTypeLabel', () => {
		it('returns correct labels in pt-BR', () => {
			expect(getTypeLabel('chat')).toBe('Chat');
			expect(getTypeLabel('system')).toBe('Sistema');
			expect(getTypeLabel('kanban')).toBe('Kanban');
			expect(getTypeLabel('poker')).toBe('Poker');
		});
	});

	describe('isSafeRedirectUrl', () => {
		it('allows relative paths', () => {
			expect(isSafeRedirectUrl('/chat/123')).toBe(true);
			expect(isSafeRedirectUrl('/kanban')).toBe(true);
			expect(isSafeRedirectUrl('/')).toBe(true);
		});

		it('allows empty/undefined', () => {
			expect(isSafeRedirectUrl('')).toBe(true);
			expect(isSafeRedirectUrl(undefined as any)).toBe(true);
		});

		it('rejects absolute URLs', () => {
			expect(isSafeRedirectUrl('https://evil.com')).toBe(false);
			expect(isSafeRedirectUrl('http://evil.com')).toBe(false);
		});

		it('rejects protocol-relative URLs', () => {
			expect(isSafeRedirectUrl('//evil.com')).toBe(false);
		});

		it('rejects javascript: URLs', () => {
			expect(isSafeRedirectUrl('javascript:alert(1)')).toBe(false);
		});

		it('rejects data: URLs', () => {
			expect(isSafeRedirectUrl('data:text/html,<script>')).toBe(false);
		});
	});
});