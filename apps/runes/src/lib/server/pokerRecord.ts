import type { UserRecord } from './userRecord';

export interface PokerRoomRecord {
	id: string;
	name: string;
	created_by: string;
	current_task: string | null;
	revealed: boolean;
	status: 'open' | 'finalized';
	created: string;
	updated: string;
	expand?: {
		created_by?: UserRecord;
	};
}

export interface PokerTaskRecord {
	id: string;
	room: string | null;
	title: string;
	description: string;
	final_points: number | null;
	status: 'backlog' | 'voting' | 'estimated' | 'exported';
	is_global_backlog: boolean;
	exported_card: string | null;
	created: string;
	updated: string;
}

export interface PokerParticipantRecord {
	id: string;
	room: string;
	user: string;
	role: 'admin' | 'voter' | 'spectator';
	is_online: boolean;
	has_voted: boolean;
	has_left: boolean;
	created: string;
	updated: string;
	expand?: {
		user?: UserRecord;
		room?: PokerRoomRecord;
	};
}

export interface PokerVoteRecord {
	id: string;
	room: string;
	task: string;
	user: string;
	value: string;
	created: string;
	updated: string;
}
