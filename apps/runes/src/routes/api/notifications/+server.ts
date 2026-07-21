import { json, error } from '@sveltejs/kit';
import { listQuerySchema } from '$lib/validation/notificationSchemas';
import { getNotifications, getUnreadCount } from '$lib/server/notificationStore';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	const userId = locals.pb.authStore.record?.id;
	if (!userId) throw error(401, 'Não autenticado');

	const query = Object.fromEntries(url.searchParams);
	const parsed = listQuerySchema.safeParse(query);
	if (!parsed.success) throw error(400, 'Par\u00E2metros inv\u00E1lidos');

	const { page, perPage, type, read } = parsed.data;
	const result = await getNotifications(userId, { page, perPage, type, read });
	const unreadCount = await getUnreadCount(userId);

	return json({ ...result, unreadCount });
};