import PocketBase from 'pocketbase';
import type { RequestEvent } from '@sveltejs/kit';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

export function createServerClient(event: RequestEvent): PocketBase {
	const pb = new PocketBase(PUBLIC_POCKETBASE_URL);
	pb.authStore.loadFromCookie(event.request.headers.get('cookie') ?? '');
	return pb;
}
