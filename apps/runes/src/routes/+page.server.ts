import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const ownerId = locals.pb.authStore.record?.id ?? '';

	let pendingCount = 0;

	if (ownerId) {
		try {
			const lists = await locals.pb.collection('todo_lists').getFullList({
				filter: locals.pb.filter('owner = {:owner}', { owner: ownerId }),
				fields: 'id',
				requestKey: 'home-pending-count'
			});

			if (lists.length > 0) {
				const listIds = lists.map((l: { id: string }) => l.id);
				const items = await locals.pb.collection('todo_items').getFullList({
					filter: locals.pb.filter('list IN {:ids} && done = false', { ids: listIds }),
					fields: 'id',
					requestKey: 'home-pending-count-items'
				});
				pendingCount = items.length;
			}
		} catch {
			// usuário sem listas ou erro de permissão — pendingCount fica 0
		}
	}

	return { pendingCount };
};
