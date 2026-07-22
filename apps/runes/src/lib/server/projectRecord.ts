import type { UserRecord } from './userRecord';

export type ProjectRecord = {
	id: string;
	title: string;
	description: string;
	image: string;
	created_by: string;
	responsaveis: string[];
	participants: string[];
	created: string;
	updated: string;
	expand?: {
		created_by?: UserRecord;
		responsaveis?: UserRecord[];
		participants?: UserRecord[];
	};
};

export type SprintRecord = {
	id: string;
	title: string;
	project: string;
	startDate: string;
	endDate: string;
	status: 'planned' | 'active' | 'finished';
	created: string;
	updated: string;
};
