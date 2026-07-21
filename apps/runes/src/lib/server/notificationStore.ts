import { getAdminClient } from '$lib/server/pocketbaseAdmin';
import type { NotificationRecord } from './notificationRecord';
import { buildNotificationPayload, isSafeRedirectUrl } from '$lib/domain/notification';

const EXPIRY_DAYS = 30;

function getExpiresAt(): string {
	return new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Resolve user collection IDs (from kanban assignees) to auth collection IDs
 * (required by notifications collection e push_subscriptions). Returns Map<userId, authId>.
 */
export async function resolveUserIdsToAuthIds(userIds: string[]): Promise<Map<string, string>> {
	if (userIds.length === 0) return new Map();

	const adminPb = await getAdminClient();

	// Get user profiles with emails
	// PocketBase não tem operador "IN (...)" — múltiplos valores exigem OR de igualdades.
	const idFilter = userIds.map((id) => adminPb.filter('id = {:id}', { id })).join(' || ');
	const users = await adminPb.collection('user').getFullList({
		filter: idFilter,
		fields: 'id,email'
	});

	if (users.length === 0) return new Map();

	const userIdToEmail = new Map(users.map((u) => [u.id, u.email]));
	const emails = [...userIdToEmail.values()];

	// Get auth records with matching emails
	const emailFilter = emails
		.map((email) => adminPb.filter('email = {:email}', { email }))
		.join(' || ');
	const authRecords = await adminPb.collection('auth').getFullList({
		filter: emailFilter,
		fields: 'id,email'
	});

	const emailToAuthId = new Map(authRecords.map((a) => [a.email, a.id]));

	// Build result map
	const result = new Map<string, string>();
	for (const [userId, email] of userIdToEmail) {
		const authId = emailToAuthId.get(email);
		if (authId) result.set(userId, authId);
	}

	return result;
}

export async function getNotifications(
	userId: string,
	opts: { page?: number; perPage?: number; type?: string; read?: boolean } = {}
): Promise<{ items: NotificationRecord[]; totalItems: number; totalPages: number }> {
	const pb = await getAdminClient();
	const { page = 1, perPage = 20, type, read } = opts;

	const filterParts = [`user = "${userId}"`];
	if (type) filterParts.push(`type = "${type}"`);
	if (read !== undefined) filterParts.push(`read = ${read}`);

	const result = await pb.collection('notifications').getList<NotificationRecord>(page, perPage, {
		filter: filterParts.join(' && '),
		sort: '-created'
	});

	return {
		items: result.items,
		totalItems: result.totalItems,
		totalPages: result.totalPages
	};
}

export async function getUnreadCount(userId: string): Promise<number> {
	const pb = await getAdminClient();
	const result = await pb.collection('notifications').getList<NotificationRecord>(1, 1, {
		filter: `user = "${userId}" && read = false`,
		sort: '-created'
	});
	return result.totalItems;
}

export async function createChatNotification(
	recipientId: string,
	senderName: string,
	preview: string,
	roomId: string,
	messageId: string
): Promise<NotificationRecord> {
	const payload = buildNotificationPayload('chat', senderName, preview, `/chat/${roomId}`, {
		roomId,
		messageId
	});
	return createNotification(recipientId, payload);
}

export async function createSystemNotification(
	recipientId: string,
	title: string,
	body: string,
	url: string,
	metadata?: Record<string, unknown>
): Promise<NotificationRecord> {
	if (!isSafeRedirectUrl(url)) {
		throw new Error('URL inv\u00E1lida para notifica\u00E7\u00E3o');
	}
	const payload = buildNotificationPayload('system', title, body, url, metadata);
	return createNotification(recipientId, payload);
}

export async function createKanbanNotification(
	assigneeIds: string[],
	cardTitle: string,
	columnName: string,
	cardId: string
): Promise<NotificationRecord[]> {
	const authIdMap = await resolveUserIdsToAuthIds(assigneeIds);
	if (authIdMap.size === 0) return [];

	const payload = buildNotificationPayload(
		'kanban',
		'Novo cart\u00E3o atribu\u00EDdo',
		`Voc\u00EA foi atribu\u00EDdo ao cart\u00E3o "${cardTitle}" na coluna "${columnName}"`,
		`/kanban#card-${cardId}`,
		{ cardId, columnName }
	);

	const results: NotificationRecord[] = [];
	for (const [userId, authId] of authIdMap) {
		const record = await createNotification(authId, payload);
		results.push(record);
	}
	return results;
}

export async function createKanbanMovedNotification(
	assigneeIds: string[],
	cardTitle: string,
	columnName: string,
	cardId: string,
	movedByName: string
): Promise<NotificationRecord[]> {
	const authIdMap = await resolveUserIdsToAuthIds(assigneeIds);
	if (authIdMap.size === 0) return [];

	const payload = buildNotificationPayload(
		'kanban',
		'Cart\u00E3o movido',
		`${movedByName} moveu "${cardTitle}" para "${columnName}"`,
		`/kanban#card-${cardId}`,
		{ cardId, columnName, movedBy: movedByName }
	);

	const results: NotificationRecord[] = [];
	for (const [userId, authId] of authIdMap) {
		const record = await createNotification(authId, payload);
		results.push(record);
	}
	return results;
}

export async function createKanbanCommentedNotification(
	assigneeIds: string[],
	cardTitle: string,
	cardId: string,
	commenterName: string
): Promise<NotificationRecord[]> {
	const authIdMap = await resolveUserIdsToAuthIds(assigneeIds);
	if (authIdMap.size === 0) return [];

	const payload = buildNotificationPayload(
		'kanban',
		'Novo coment\u00E1rio',
		`${commenterName} comentou em "${cardTitle}"`,
		`/kanban#card-${cardId}`,
		{ cardId, commenterName }
	);

	const results: NotificationRecord[] = [];
	for (const [, authId] of authIdMap) {
		const record = await createNotification(authId, payload);
		results.push(record);
	}
	return results;
}

export async function createKanbanDeletedNotification(
	assigneeIds: string[],
	cardTitle: string,
	deleterName: string
): Promise<NotificationRecord[]> {
	const authIdMap = await resolveUserIdsToAuthIds(assigneeIds);
	if (authIdMap.size === 0) return [];

	const payload = buildNotificationPayload(
		'kanban',
		'Cart\u00E3o removido',
		`"${cardTitle}" foi removido do kanban por ${deleterName}`,
		`/kanban`,
		{ deletedBy: deleterName }
	);

	const results: NotificationRecord[] = [];
	for (const [, authId] of authIdMap) {
		const record = await createNotification(authId, payload);
		results.push(record);
	}
	return results;
}

export async function createPokerNotification(
	userId: string,
	title: string,
	body: string,
	pokerRoomId: string
): Promise<NotificationRecord> {
	const payload = buildNotificationPayload('poker', title, body, `/poker/${pokerRoomId}`, {
		pokerRoomId
	});
	return createNotification(userId, payload);
}

async function createNotification(
	userId: string,
	payload: ReturnType<typeof buildNotificationPayload>
): Promise<NotificationRecord> {
	const pb = await getAdminClient();
	const record = await pb.collection('notifications').create<NotificationRecord>({
		user: userId,
		...payload,
		read: false,
		expiresAt: getExpiresAt()
	});
	return record;
}

export async function markAsRead(userId: string, ids: string[]): Promise<number> {
	const pb = await getAdminClient();
	let updated = 0;
	for (const id of ids) {
		try {
			await pb.collection('notifications').update(id, { read: true }, { filter: `user = "${userId}"` });
			updated++;
		} catch {
			// ignore not found / not owned
		}
	}
	return updated;
}

export async function markAllAsRead(userId: string): Promise<number> {
	const pb = await getAdminClient();
	const result = await pb.collection('notifications').getFullList<NotificationRecord>({
		filter: `user = "${userId}" && read = false`
	});
	if (result.length === 0) return 0;
	const ids = result.map((r) => r.id);
	await Promise.all(ids.map((id) => pb.collection('notifications').update(id, { read: true })));
	return ids.length;
}

export async function deleteExpiredNotifications(): Promise<number> {
	const pb = await getAdminClient();
	const now = new Date().toISOString();
	const result = await pb.collection('notifications').getFullList<NotificationRecord>({
		filter: `expiresAt != "" && expiresAt < "${now}"`
	});
	for (const record of result) {
		await pb.collection('notifications').delete(record.id);
	}
	return result.length;
}