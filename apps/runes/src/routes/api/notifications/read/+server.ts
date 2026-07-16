import { json, error } from '@sveltejs/kit';
import { markReadSchema } from '$lib/validation/notificationSchemas';
import { markAsRead } from '$lib/server/notificationStore';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	const userId = locals.pb.authStore.record?.id;
	if (!userId) throw error(401, 'Não autenticado');

	const body = await request.json();
	const parsed = markReadSchema.safeParse(body);
	if (!parsed.success) throw error(400, 'IDs inv\u00E1lidos');

	const updated = await markAsRead(userId, parsed.data.ids);
	return json({ success: true, updated });
};