import { getAdminClient } from './pocketbaseAdmin';
import type { AuthParticipant } from './chatRecord';

export async function fetchAuthParticipants(ids: string[]): Promise<AuthParticipant[]> {
	const admin = await getAdminClient();
	const uniqueIds = [...new Set(ids)];
	return Promise.all(
		uniqueIds.map((id) =>
			admin.collection('auth').getOne<AuthParticipant>(id, { fields: 'id,name,avatar' })
		)
	);
}
