import { json } from '@sveltejs/kit';
import { ClientResponseError } from 'pocketbase';
import type { RequestHandler } from './$types';
import { subscribeSchema } from '$lib/validation/pushSchemas';

export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = locals.pb.authStore.record?.id;
	if (!userId) {
		return json({ errors: { general: 'Não autenticado.' } }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ errors: { general: 'JSON inválido.' } }, { status: 400 });
	}

	const parsed = subscribeSchema.safeParse(body);
	if (!parsed.success) {
		return json({ errors: { general: 'Assinatura de push inválida.' } }, { status: 400 });
	}

	const { endpoint, keys } = parsed.data;

	// Idempotente por endpoint (RF1.1): reassinatura do mesmo dispositivo
	// (rotação de chaves) substitui a linha existente em vez de falhar por
	// conflito de unicidade — o endpoint é único e updateRule = null.
	try {
		const existing = await locals.pb
			.collection('push_subscriptions')
			.getFirstListItem(locals.pb.filter('endpoint = {:endpoint}', { endpoint }));
		await locals.pb.collection('push_subscriptions').delete(existing.id);
	} catch (err) {
		if (!(err instanceof ClientResponseError && err.status === 404)) {
			return json({ errors: { general: 'Não foi possível registrar a assinatura.' } }, { status: 400 });
		}
	}

	try {
		await locals.pb.collection('push_subscriptions').create({
			user: userId,
			endpoint,
			p256dh: keys.p256dh,
			auth_key: keys.auth
		});
	} catch {
		return json({ errors: { general: 'Não foi possível registrar a assinatura.' } }, { status: 400 });
	}

	return json({ success: true }, { status: 201 });
};
