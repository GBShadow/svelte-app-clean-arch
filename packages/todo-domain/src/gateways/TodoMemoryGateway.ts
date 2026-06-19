import { SEED_TODOS } from '../types';
import type { TodoItemDTO } from '../types';
import type { TodoGateway } from './TodoGateway';

export default class TodoMemoryGateway implements TodoGateway {
	private todos: TodoItemDTO[];

	constructor(todos: TodoItemDTO[] = structuredClone(SEED_TODOS)) {
		this.todos = todos;
	}

	async getTodos(): Promise<TodoItemDTO[]> {
		return structuredClone(this.todos);
	}

	async addItem(item: TodoItemDTO): Promise<void> {
		this.todos.push(structuredClone(item));
	}

	async updateItem(item: TodoItemDTO): Promise<void> {
		const todo = this.todos.find((t) => t.id === item.id);
		if (todo) {
			todo.done = item.done;
		}
	}

	async removeItem(id: string): Promise<void> {
		const index = this.todos.findIndex((t) => t.id === id);
		if (index >= 0) {
			this.todos.splice(index, 1);
		}
	}
}
