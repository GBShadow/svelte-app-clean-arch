import { query, command } from '$app/server';
import * as v from 'valibot';
import { addTodo, createTodo, getTodos, removeTodo, updateTodo } from '$lib/server/todoStore';

export const getTodoList = query(async () => {
	return getTodos();
});

export const addTodoItem = command(v.object({ description: v.string() }), async ({ description }) => {
	const item = createTodo(description);
	addTodo(item);
	return item;
});

export const toggleTodoItem = command(
	v.object({ id: v.string(), done: v.boolean() }),
	async ({ id, done }) => {
		updateTodo(id, done);
	}
);

export const removeTodoItem = command(v.object({ id: v.string() }), async ({ id }) => {
	removeTodo(id);
});
