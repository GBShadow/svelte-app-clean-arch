import type { CategoryRecord } from './categoryRecord';
import type { UserRecord } from './userRecord';
import type { ProjectRecord, SprintRecord } from './projectRecord';

export type RetroStatus = 'open' | 'finalized';

export type RetroRecord = {
	id: string;
	project: string;
	sprint: string;
	status: RetroStatus;
	created_by: string;
	finalized_at: string | null;
	finalized_by: string | null;
	created: string;
	updated: string;
	expand?: {
		project?: ProjectRecord;
		sprint?: SprintRecord;
		created_by?: UserRecord;
		finalized_by?: UserRecord;
	};
};

export type RetroParticipantRecord = {
	id: string;
	retro: string;
	user: string;
	created: string;
	updated: string;
	expand?: {
		user?: UserRecord;
	};
};

export type RetroColumnRecord = {
	id: string;
	retro: string;
	name: string;
	position: number;
	is_default: boolean;
	created: string;
	updated: string;
};

export type RetroCardRecord = {
	id: string;
	retro: string;
	column: string;
	content: string;
	position: number;
	edit_token_hash: string | null;
	category?: string | null;
	created: string;
	updated: string;
	expand?: {
		column?: RetroColumnRecord;
		category?: CategoryRecord;
	};
};
