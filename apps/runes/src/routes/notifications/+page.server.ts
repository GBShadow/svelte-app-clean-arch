import type { PageServerLoad } from './$types';
import { getNotifications, getUnreadCount } from '$lib/server/notificationStore';
import { listQuerySchema } from '$lib/validation/notificationSchemas';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const userId = locals.pb.authStore.record?.id;
	if (!userId) throw error(401, 'Não autenticado');

	const query = Object.fromEntries(url.searchParams);
	const parsed = listQuerySchema.safeParse(query);
	if (!parsed.success) throw error(400, 'Parâmetros inválidos');

	const { page, perPage, type, read } = parsed.data;
	const result = await getNotifications(userId, { page, perPage, type, read });
	const unreadCount = await getUnreadCount(userId);

	return {
		notifications: result.items,
		totalItems: result.totalItems,
		totalPages: result.totalPages,
		currentPage: page,
		perPage,
		type: type ?? 'all',
		read: read ?? 'all',
		unreadCount
	};
};