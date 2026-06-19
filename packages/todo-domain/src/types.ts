export interface TodoItemDTO {
	id: string;
	description: string;
	done: boolean;
}

export function createId(): string {
	return Math.random().toString(36).slice(2, 7);
}

export const SEED_TODOS: TodoItemDTO[] = [
	{ id: createId(), description: 'Estudar TypeScript', done: true },
	{ id: createId(), description: 'Fazer a prova online', done: false },
	{ id: createId(), description: 'Cortar a grama', done: false }
];
