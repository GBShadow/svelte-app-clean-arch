import { json, error } from '@sveltejs/kit';
import { getUnreadCount } from '$lib/server/notificationStore';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const userId = locals.pb.authStore.record?.id;
	if (!userId) throw error(401, 'Não autenticado');

	const count = await getUnreadCount(userId);
	return json({ count });
};