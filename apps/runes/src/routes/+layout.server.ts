import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user,
		pbToken: locals.pb.authStore.token,
		pbRecord: locals.pb.authStore.record
	};
};
