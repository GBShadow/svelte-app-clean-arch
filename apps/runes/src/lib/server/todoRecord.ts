import type { CategoryRecord } from './categoryRecord';

export type TodoListRecord = {
	id: string;
	title: string;
	owner: string;
	public: boolean;
};

export type TodoItemRecord = {
	id: string;
	list: string;
	description: string;
	done: boolean;
	category?: string | null;
	expand?: {
		category?: CategoryRecord;
	};
};
