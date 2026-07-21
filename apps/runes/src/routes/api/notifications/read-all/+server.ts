import { json, error } from '@sveltejs/kit';
import { markAllAsRead } from '$lib/server/notificationStore';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
	const userId = locals.pb.authStore.record?.id;
	if (!userId) throw error(401, 'Não autenticado');

	const count = await markAllAsRead(userId);
	return json({ success: true, count });
};