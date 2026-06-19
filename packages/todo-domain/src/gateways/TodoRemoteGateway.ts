import type { TodoItemDTO } from '../types';
import type { TodoGateway } from './TodoGateway';

export interface RemoteTodoFunctions {
	getTodoList: () => Promise<TodoItemDTO[]>;
	addTodoItem: (input: { description: string }) => Promise<TodoItemDTO>;
	toggleTodoItem: (input: { id: string; done: boolean }) => Promise<void>;
	removeTodoItem: (input: { id: string }) => Promise<void>;
}

export default class TodoRemoteGateway implements TodoGateway {
	constructor(private remote: RemoteTodoFunctions) {}

	async getTodos(): Promise<TodoItemDTO[]> {
		return this.remote.getTodoList();
	}

	async addItem(item: TodoItemDTO): Promise<void> {
		await this.remote.addTodoItem({ description: item.description });
	}

	async updateItem(item: TodoItemDTO): Promise<void> {
		await this.remote.toggleTodoItem({ id: item.id, done: item.done });
	}

	async removeItem(id: string): Promise<void> {
		await this.remote.removeTodoItem({ id });
	}
}
