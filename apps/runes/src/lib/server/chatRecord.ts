export type AuthParticipant = {
	id: string;
	name: string;
	avatar: string;
};

export type ChatRoomRecord = {
	id: string;
	name: string;
	created_by: string;
	participants: string[];
	created: string;
	updated: string;
	expand?: {
		participants?: AuthParticipant[];
	};
};

export type ChatMessageRecord = {
	id: string;
	room: string;
	sender: string;
	text: string;
	created: string;
	updated: string;
	expand?: {
		sender?: AuthParticipant;
	};
};
