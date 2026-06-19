import type { TodoItemDTO } from '../types';

export interface TodoGateway {
	getTodos(): Promise<TodoItemDTO[]>;
	addItem(item: TodoItemDTO): Promise<void>;
	updateItem(item: TodoItemDTO): Promise<void>;
	removeItem(id: string): Promise<void>;
}
