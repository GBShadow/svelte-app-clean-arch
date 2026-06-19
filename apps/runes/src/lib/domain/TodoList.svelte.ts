import { Item } from './Item.svelte';
import type { TodoItemDTO } from 'todo-domain';

export class TodoList {
	items = $state<Item[]>([]);

	completedPercent = $derived.by(() => {
		const total = this.items.length;
		if (total === 0) return 0;
		const done = this.items.filter((item) => item.done).length;
		return Math.round((done / total) * 100);
	});

	constructor(items?: TodoItemDTO[]) {
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

	addItem(description: string) {
		if (!description) return;
		if (this.items.some((item) => item.description === description)) return;
		if (this.items.filter((item) => !item.done).length > 4) return;
		const item = new Item(null, description);
		this.items.push(item);
	}

	removeItem(item: Item) {
		this.items.splice(this.items.indexOf(item), 1);
	}

	toggleDone(item: Item) {
		item.done = !item.done;
	}

	getItem(description: string) {
		return this.items.find((item) => item.description === description);
	}
}
