import { describe, expect, test, vi, beforeEach } from 'vitest';

vi.mock('web-push', () => ({
	default: {
		setVapidDetails: vi.fn(),
		sendNotification: vi.fn()
	}
}));

vi.mock('./vapidKeys', () => ({
	vapidKeys: { subject: 'mailto:test@test.com', publicKey: 'pub', privateKey: 'priv' }
}));

vi.mock('./pushSubscriptionStore', () => ({
	getSubscriptionsForUsers: vi.fn(),
	removeInvalidSubscription: vi.fn()
}));

vi.mock('$lib/domain/pushPayload', () => ({
	buildChatPushPayload: vi.fn().mockReturnValue({ type: 'chat', title: 'test' }),
	buildSystemPushPayload: vi.fn()
}));

import webpush from 'web-push';
import { getSubscriptionsForUsers, removeInvalidSubscription } from './pushSubscriptionStore';
import { buildChatPushPayload, buildSystemPushPayload } from '$lib/domain/pushPayload';

describe('webPush', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('sendChatPush com recipients vazios não faz nada', async () => {
		const { sendChatPush } = await import('./webPush');
		await sendChatPush({ roomId: 'r1', roomName: 'test', senderName: 'A', text: 'hi', recipientUserIds: [] });
		expect(getSubscriptionsForUsers).not.toHaveBeenCalled();
	});

	test('sendChatPush busca subscriptions e dispatch', async () => {
		vi.mocked(getSubscriptionsForUsers).mockResolvedValue([{ id: 's1', endpoint: 'https://ep', p256dh: 'k', auth_key: 'a' } as any]);
		vi.mocked(webpush.sendNotification).mockResolvedValue(undefined);

		const { sendChatPush } = await import('./webPush');
		await sendChatPush({ roomId: 'r1', roomName: 'test', senderName: 'A', text: 'hi', recipientUserIds: ['u1'] });

		expect(buildChatPushPayload).toHaveBeenCalledWith({ roomId: 'r1', roomName: 'test', senderName: 'A', text: 'hi', recipientUserIds: ['u1'] });
		expect(getSubscriptionsForUsers).toHaveBeenCalledWith(['u1']);
		expect(webpush.sendNotification).toHaveBeenCalledWith(
			{ endpoint: 'https://ep', keys: { p256dh: 'k', auth: 'a' } },
			JSON.stringify({ type: 'chat', title: 'test' })
		);
	});

	test('sendChatPush trata 404/410 removendo subscription', async () => {
		vi.mocked(getSubscriptionsForUsers).mockResolvedValue([{ id: 's1', endpoint: 'https://ep', p256dh: 'k', auth_key: 'a' } as any]);
		const err = new Error('gone');
		(err as any).statusCode = 410;
		vi.mocked(webpush.sendNotification).mockRejectedValue(err);

		const { sendChatPush } = await import('./webPush');
		await sendChatPush({ roomId: 'r1', roomName: 'test', senderName: 'A', text: 'hi', recipientUserIds: ['u1'] });

		expect(removeInvalidSubscription).toHaveBeenCalledWith('s1');
	});

	test('sendChatPush trata 404', async () => {
		vi.mocked(getSubscriptionsForUsers).mockResolvedValue([{ id: 's1', endpoint: 'https://ep', p256dh: 'k', auth_key: 'a' } as any]);
		const err = new Error('not found');
		(err as any).statusCode = 404;
		vi.mocked(webpush.sendNotification).mockRejectedValue(err);

		const { sendChatPush } = await import('./webPush');
		await sendChatPush({ roomId: 'r1', roomName: 'test', senderName: 'A', text: 'hi', recipientUserIds: ['u1'] });

		expect(removeInvalidSubscription).toHaveBeenCalledWith('s1');
	});

	test('sendChatPush não remove subscription em outros erros', async () => {
		vi.mocked(getSubscriptionsForUsers).mockResolvedValue([{ id: 's1', endpoint: 'https://ep', p256dh: 'k', auth_key: 'a' } as any]);
		vi.mocked(webpush.sendNotification).mockRejectedValue(new Error('network error'));

		const { sendChatPush } = await import('./webPush');
		await sendChatPush({ roomId: 'r1', roomName: 'test', senderName: 'A', text: 'hi', recipientUserIds: ['u1'] });

		expect(removeInvalidSubscription).not.toHaveBeenCalled();
	});

	test('sendSystemPush com userIds vazios não faz nada', async () => {
		const { sendSystemPush } = await import('./webPush');
		await sendSystemPush([], { title: 't', body: 'b', url: '/ok' });
		expect(buildSystemPushPayload).not.toHaveBeenCalled();
	});

	test('sendSystemPush throw se payload inválido', async () => {
		vi.mocked(buildSystemPushPayload).mockReturnValue(undefined);
		const { sendSystemPush } = await import('./webPush');
		await expect(sendSystemPush(['u1'], { title: 't', body: 'b', url: 'http://evil.com' })).rejects.toThrow(
			'Payload de notificação de sistema inválido'
		);
	});

	test('sendSystemPush dispatch para subscriptions', async () => {
		vi.mocked(buildSystemPushPayload).mockReturnValue({ type: 'system', title: 'Sys', body: 'Msg', url: '/ok' });
		vi.mocked(getSubscriptionsForUsers).mockResolvedValue([{ id: 's1', endpoint: 'https://ep', p256dh: 'k', auth_key: 'a' } as any]);
		vi.mocked(webpush.sendNotification).mockResolvedValue(undefined);

		const { sendSystemPush } = await import('./webPush');
		await sendSystemPush(['u1'], { title: 'Sys', body: 'Msg', url: '/ok' });

		expect(webpush.sendNotification).toHaveBeenCalled();
	});
});
