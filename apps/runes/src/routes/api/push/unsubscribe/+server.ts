import { json } from '@sveltejs/kit';
import { ClientResponseError } from 'pocketbase';
import type { RequestHandler } from './$types';
import { unsubscribeSchema } from '$lib/validation/pushSchemas';

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

	const parsed = unsubscribeSchema.safeParse(body);
	if (!parsed.success) {
		return json({ errors: { general: 'Endpoint de push inválido.' } }, { status: 400 });
	}

	// listRule/deleteRule de push_subscriptions restringem a busca e a remoção
	// ao próprio usuário — mesmo conhecendo o endpoint de outro, a deleção falha.
	try {
		const existing = await locals.pb
			.collection('push_subscriptions')
			.getFirstListItem(locals.pb.filter('endpoint = {:endpoint}', { endpoint: parsed.data.endpoint }));
		await locals.pb.collection('push_subscriptions').delete(existing.id);
	} catch (err) {
		if (!(err instanceof ClientResponseError && err.status === 404)) {
			return json({ errors: { general: 'Não foi possível remover a assinatura.' } }, { status: 400 });
		}
	}

	return new Response(null, { status: 204 });
};
