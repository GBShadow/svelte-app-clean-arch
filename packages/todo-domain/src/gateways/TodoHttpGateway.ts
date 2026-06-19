import type { TodoItemDTO } from '../types';
import type { TodoGateway } from './TodoGateway';

export default class TodoHttpGateway implements TodoGateway {
	constructor(
		readonly fetchFn: typeof fetch,
		readonly baseUrl: string
	) {}

	async getTodos(): Promise<TodoItemDTO[]> {
		const response = await this.fetchFn(`${this.baseUrl}/api/todos`);
		if (!response.ok) throw new Error('Failed to fetch todos');
		return response.json();
	}

	async addItem(item: TodoItemDTO): Promise<void> {
		const response = await this.fetchFn(`${this.baseUrl}/api/todos`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(item)
		});
		if (!response.ok) throw new Error('Failed to add todo');
	}

	async updateItem(item: TodoItemDTO): Promise<void> {
		const response = await this.fetchFn(`${this.baseUrl}/api/todos/${item.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(item)
		});
		if (!response.ok) throw new Error('Failed to update todo');
	}

	async removeItem(id: string): Promise<void> {
		const response = await this.fetchFn(`${this.baseUrl}/api/todos/${id}`, {
			method: 'DELETE'
		});
		if (!response.ok) throw new Error('Failed to remove todo');
	}
}
