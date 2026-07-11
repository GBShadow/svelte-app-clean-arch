import { getAdminClient } from './pocketbaseAdmin';

export async function findAuthRecordByEmail(email: string) {
	const pb = await getAdminClient();
	return pb.collection('auth').getFirstListItem(pb.filter('email = {:email}', { email }));
}
