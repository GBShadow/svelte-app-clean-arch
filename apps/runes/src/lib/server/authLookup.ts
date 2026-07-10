import type PocketBase from 'pocketbase';

export async function findAuthRecordByEmail(pb: PocketBase, email: string) {
	return pb.collection('auth').getFirstListItem(pb.filter('email = {:email}', { email }));
}
