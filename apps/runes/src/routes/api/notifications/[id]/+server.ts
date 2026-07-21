import { json, error } from '@sveltejs/kit';
import { getAdminClient } from '$lib/server/pocketbaseAdmin';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const userId = locals.pb.authStore.record?.id;
	if (!userId) throw error(401, 'Não autenticado');

	const { id } = params;
	if (!id) throw error(400, 'ID não fornecido');

	const adminPb = await getAdminClient();
	try {
		await adminPb.collection('notifications').delete(id);
		return json({ success: true });
	} catch {
		throw error(404, 'Notificação não encontrada');
	}
};
