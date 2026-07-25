import type { UserRecord } from './userRecord';
import type { ProjectRecord } from './projectRecord';

export type SpecDocumentRecord = {
	id: string;
	project: string;
	title: string;
	body_md: string;
	created_by: string;
	is_public_link: boolean;
	created: string;
	updated: string;
	expand?: {
		project?: ProjectRecord;
		created_by?: UserRecord;
	};
};

export type SpecTagRecord = {
	id: string;
	document: string;
	tag: string;
	created: string;
	updated: string;
};

export type SpecPermissionRecord = {
	id: string;
	document: string;
	user: string;
	role: 'view' | 'edit';
	pair: string;
	created: string;
	updated: string;
	expand?: {
		user?: UserRecord;
	};
};

export type SpecDocumentWithTags = SpecDocumentRecord & {
	tags: string[];
};
