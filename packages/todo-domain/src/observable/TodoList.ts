import Item from './Item';
import Observable from './Observable';
import type { TodoItemDTO } from '../types';

export default class TodoList extends Observable {
	items: Item[];

	constructor(items?: TodoItemDTO[]) {
		super();
		this.items = [];
		if (items) {
			for (const item of items) {
				this.items.push(new Item(item.id, item.description, item.done));
			}
		}
	}

	static fromDTO(dtos: TodoItemDTO[]): TodoList {
		return new TodoList(dtos);
	}

	toDTO(): TodoItemDTO[] {
		return this.items.map((item) => item.toDTO());
	}

	async addItem(description: string) {
		if (!description) return;
		if (this.items.some((item) => item.description === description)) return;
		if (this.items.filter((item) => !item.done).length > 4) return;
		const item = new Item(null, description);
		this.items.push(item);
		this.notify('addItem', item);
	}

	async removeItem(item: Item) {
		this.items.splice(this.items.indexOf(item), 1);
		this.notify('removeItem', item);
	}

	async toggleDone(item: Item) {
		item.done = !item.done;
		this.notify('toggleDone', item);
	}

	getItem(description: string) {
		return this.items.find((item) => item.description === description);
	}

	getCompleted() {
		const total = this.items.length;
		if (total === 0) return 0;
		const done = this.items.filter((item) => item.done).length;
		return Math.round((done / total) * 100);
	}
}
