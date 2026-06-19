import type { RequestHandler } from './$types';
import { removeTodo, updateTodo } from '$lib/server/todoStore';
import type { TodoItemDTO } from 'todo-domain';

export const PUT: RequestHandler = async ({ params, request }) => {
	const item = (await request.json()) as TodoItemDTO;
	updateTodo(params.id, item.done);
	return new Response(null, { status: 204 });
};

export const DELETE: RequestHandler = async ({ params }) => {
	removeTodo(params.id);
	return new Response(null, { status: 204 });
};
