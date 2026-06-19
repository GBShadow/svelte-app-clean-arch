import { SEED_TODOS, createId } from 'todo-domain';
import type { TodoItemDTO } from 'todo-domain';

let todos: TodoItemDTO[] = structuredClone(SEED_TODOS);

export function getTodos(): TodoItemDTO[] {
	return structuredClone(todos);
}

export function addTodo(item: TodoItemDTO): void {
	todos.push(structuredClone(item));
}

export function updateTodo(id: string, done: boolean): void {
	const todo = todos.find((t) => t.id === id);
	if (todo) {
		todo.done = done;
	}
}

export function removeTodo(id: string): void {
	const index = todos.findIndex((t) => t.id === id);
	if (index >= 0) {
		todos.splice(index, 1);
	}
}

export function resetStore(seed: TodoItemDTO[] = structuredClone(SEED_TODOS)): void {
	todos = structuredClone(seed);
}

export function createTodo(description: string): TodoItemDTO {
	return {
		id: createId(),
		description,
		done: false
	};
}
