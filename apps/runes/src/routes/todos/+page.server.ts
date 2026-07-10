import type { PageServerLoad } from './$types';
import type { TodoListRecord } from '$lib/server/todoRecord';

export const load: PageServerLoad = async ({ locals }) => {
	const ownerId = locals.pb.authStore.record?.id ?? '';

	const lists = await locals.pb.collection('todo_lists').getFullList<TodoListRecord>({
		filter: locals.pb.filter('owner = {:owner}', { owner: ownerId }),
		sort: '-created'
	});

	return { lists };
};
