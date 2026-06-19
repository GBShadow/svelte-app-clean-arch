import { createId, type TodoItemDTO } from 'todo-domain';

export class Item {
	id = $state<string>('');
	description = $state<string>('');
	done = $state<boolean>(false);

	constructor(id: string | null, description: string, done = false) {
		this.id = id ?? createId();
		this.description = description;
		this.done = done;
	}

	toDTO(): TodoItemDTO {
		return {
			id: this.id,
			description: this.description,
			done: this.done
		};
	}
}
