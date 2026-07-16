import PocketBase from 'pocketbase';
import { PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD } from '$env/static/private';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

let adminClient: PocketBase | undefined;

export async function getAdminClient(): Promise<PocketBase> {
	if (adminClient && adminClient.authStore.isValid) {
		return adminClient;
	}

	const pb = new PocketBase(PUBLIC_POCKETBASE_URL);
	// Este client é um singleton reusado por TODAS as requisições concorrentes do
	// servidor (não é por-request como locals.pb). A autocancelação por padrão do
	// SDK agrupa requisições por método+endpoint e cancela a anterior quando uma
	// nova começa — o que aqui cancela chamadas concorrentes legítimas de
	// handlers diferentes (ex: resolveUserIdsToAuthIds sendo abortado pelo load
	// da própria página), fazendo notificações falharem de forma intermitente.
	pb.autoCancellation(false);
	await pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);

	adminClient = pb;
	return adminClient;
}
