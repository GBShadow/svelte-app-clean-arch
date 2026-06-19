import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, depends }) => {
	depends('app:todos');
	const res = await fetch('/api/todos');
	if (!res.ok) throw new Error('Failed to fetch todos');
	return { todos: await res.json() };
};
