import type { AuthParticipant } from './chatRecord';

export type KanbanColumnRecord = {
	id: string;
	name: string;
	position: number;
	type: 'backlog' | 'done' | 'custom';
	created: string;
	updated: string;
};

export type KanbanCardRecord = {
	id: string;
	title: string;
	description: string;
	column: string;
	created_by: string;
	assignees: string[];
	position: number;
	points: number | null;
	tags: string[] | null;
	dueDate: string | null;
	created: string;
	updated: string;
	expand?: {
		column?: KanbanColumnRecord;
		created_by?: AuthParticipant;
		assignees?: AuthParticipant[];
	};
};

export type KanbanCardCommentRecord = {
	id: string;
	card: string;
	user: string;
	text: string;
	created: string;
	updated: string;
	expand?: {
		user?: AuthParticipant;
	};
};

export type KanbanCardHistoryRecord = {
	id: string;
	card: string;
	user: string;
	field: string;
	created: string;
	updated: string;
	expand?: {
		user?: AuthParticipant;
	};
};
