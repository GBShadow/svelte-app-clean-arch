import { getAdminClient } from './pocketbaseAdmin';
import type { PushSubscriptionRecord } from './pushRecord';

/**
 * Lê subscriptions de outros usuários (RF3/RF5) — o remetente/serviço não é
 * dono dessas linhas, então precisa do cliente superusuário para consultá-las.
 */
export async function getSubscriptionsForUsers(
	userIds: string[]
): Promise<PushSubscriptionRecord[]> {
	if (userIds.length === 0) return [];

	const admin = await getAdminClient();
	const filter = userIds.map((id) => admin.filter('user = {:id}', { id })).join(' || ');

	return admin.collection('push_subscriptions').getFullList<PushSubscriptionRecord>({ filter });
}

/**
 * RF8: remove uma subscription expirada/cancelada (404/410 vindos da Push API).
 * Roda no contexto do remetente, não do dono da subscription — daí o admin client.
 */
export async function removeInvalidSubscription(id: string): Promise<void> {
	const admin = await getAdminClient();
	try {
		await admin.collection('push_subscriptions').delete(id);
	} catch {
		// já removida por outra rota de limpeza — best-effort.
	}
}
