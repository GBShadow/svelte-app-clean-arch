import { TodoList } from './TodoList.svelte';
import { Item } from './Item.svelte';
import type { TodoGateway } from 'todo-domain';

export class TodoListService {
	#list = $state(new TodoList());

	get list() {
		return this.#list;
	}

	constructor(private gateway: TodoGateway) {}

	async load() {
		this.#list = TodoList.fromDTO(await this.gateway.getTodos());
	}

	async addItem(description: string) {
		this.#list.addItem(description);
		const item = this.#list.getItem(description);
		if (item) await this.gateway.addItem(item.toDTO());
	}

	async removeItem(item: Item) {
		await this.gateway.removeItem(item.id);
		this.#list.removeItem(item);
	}

	async toggleDone(item: Item) {
		this.#list.toggleDone(item);
		await this.gateway.updateItem(item.toDTO());
	}
}
