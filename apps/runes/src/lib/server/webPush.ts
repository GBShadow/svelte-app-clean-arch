import webpush from 'web-push';
import { vapidKeys } from './vapidKeys';
import { getSubscriptionsForUsers, removeInvalidSubscription } from './pushSubscriptionStore';
import { buildChatPushPayload, buildSystemPushPayload } from '$lib/domain/pushPayload';
import type { PushSubscriptionRecord } from './pushRecord';

webpush.setVapidDetails(vapidKeys.subject, vapidKeys.publicKey, vapidKeys.privateKey);

async function dispatchToSubscriptions(
	subscriptions: PushSubscriptionRecord[],
	payload: unknown
): Promise<void> {
	const body = JSON.stringify(payload);

	await Promise.allSettled(
		subscriptions.map(async (subscription) => {
			try {
				await webpush.sendNotification(
					{
						endpoint: subscription.endpoint,
						keys: { p256dh: subscription.p256dh, auth: subscription.auth_key }
					},
					body
				);
			} catch (err) {
				const statusCode = (err as { statusCode?: number }).statusCode;
				if (statusCode === 404 || statusCode === 410) {
					await removeInvalidSubscription(subscription.id);
				}
			}
		})
	);
}

/** RF3: dispara push de nova mensagem para todos os participantes exceto o remetente. */
export async function sendChatPush(params: {
	roomId: string;
	roomName: string;
	senderName: string;
	text: string;
	recipientUserIds: string[];
}): Promise<void> {
	if (params.recipientUserIds.length === 0) return;

	const payload = buildChatPushPayload(params);
	const subscriptions = await getSubscriptionsForUsers(params.recipientUserIds);
	await dispatchToSubscriptions(subscriptions, payload);
}

/** RF5: canal genérico para qualquer serviço do sistema disparar um push. */
export async function sendSystemPush(
	userIds: string[],
	payload: { title: string; body: string; url: string }
): Promise<void> {
	if (userIds.length === 0) return;

	const systemPayload = buildSystemPushPayload(payload);
	if (!systemPayload) {
		throw new Error(
			'Payload de notificação de sistema inválido (url insegura ou payload acima do limite).'
		);
	}

	const subscriptions = await getSubscriptionsForUsers(userIds);
	await dispatchToSubscriptions(subscriptions, systemPayload);
}
