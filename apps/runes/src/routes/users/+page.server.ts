import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { UserRecord } from '$lib/server/userRecord';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user?.isAdmin) {
		throw redirect(303, '/');
	}

	const users = await locals.pb.collection('user').getFullList<UserRecord>({ sort: 'name' });

	return { users };
};
