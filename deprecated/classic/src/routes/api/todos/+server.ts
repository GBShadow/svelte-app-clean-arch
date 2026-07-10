import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addTodo, createTodo, getTodos } from '$lib/server/todoStore';
import type { TodoItemDTO } from 'todo-domain';

export const GET: RequestHandler = async () => {
	return json(getTodos());
};

export const POST: RequestHandler = async ({ request }) => {
	const item = (await request.json()) as TodoItemDTO;
	if (!item.id) {
		item.id = createTodo(item.description).id;
	}
	addTodo(item);
	return new Response(null, { status: 201 });
};
