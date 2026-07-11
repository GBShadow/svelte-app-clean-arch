import PocketBase, { type RecordModel } from 'pocketbase';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

export function createBrowserClient(token: string, record: RecordModel | null): PocketBase {
	const pb = new PocketBase(PUBLIC_POCKETBASE_URL);
	pb.authStore.save(token, record);
	return pb;
}
