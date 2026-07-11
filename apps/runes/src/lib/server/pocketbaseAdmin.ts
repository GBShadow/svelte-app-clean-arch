import PocketBase from 'pocketbase';
import { PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD } from '$env/static/private';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

let adminClient: PocketBase | undefined;

export async function getAdminClient(): Promise<PocketBase> {
	if (adminClient && adminClient.authStore.isValid) {
		return adminClient;
	}

	const pb = new PocketBase(PUBLIC_POCKETBASE_URL);
	await pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);

	adminClient = pb;
	return adminClient;
}
