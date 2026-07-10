export type ChatRoomAccessInfo = {
	createdBy: string;
	participantIds: string[];
};

export function isParticipant(room: ChatRoomAccessInfo, userId: string): boolean {
	return room.participantIds.includes(userId);
}

export function isCreator(room: ChatRoomAccessInfo, userId: string): boolean {
	return room.createdBy === userId;
}

export function nextCreatorAfter(participantIds: string[], leavingId: string): string | null {
	const remaining = participantIds.filter((id) => id !== leavingId);
	return remaining[0] ?? null;
}
