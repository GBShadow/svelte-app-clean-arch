import type { PageServerLoad } from './$types';
import type { ChatMessageRecord, ChatRoomRecord } from '$lib/server/chatRecord';
import { fetchAuthParticipants } from '$lib/server/authExpand';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.pb.authStore.record?.id ?? '';

	let rooms: ChatRoomRecord[];
	try {
		rooms = await locals.pb.collection('chat_rooms').getFullList<ChatRoomRecord>({
			filter: locals.pb.filter('participants.id ?= {:userId}', { userId })
		});
	} catch (err) {
		const status = err && typeof err === 'object' && 'status' in err
			? (err as { status: number }).status
			: undefined;
		if (status === 403) {
			rooms = [];
		} else {
			throw err;
		}
	}

	const participantIds = [...new Set(rooms.flatMap((room) => room.participants))];
	const participants = await fetchAuthParticipants(participantIds);
	const participantsById = new Map(participants.map((p) => [p.id, p]));

	for (const room of rooms) {
		room.expand = {
			participants: room.participants
				.map((id) => participantsById.get(id))
				.filter((p): p is (typeof participants)[number] => p !== undefined)
		};
	}

	const roomsWithPreview = await Promise.all(
		rooms.map(async (room) => {
			const lastMessagePage = await locals.pb
				.collection('chat_messages')
				.getList<ChatMessageRecord>(1, 1, {
					filter: locals.pb.filter('room = {:roomId}', { roomId: room.id }),
					sort: '-created'
				});
			return { room, lastMessage: lastMessagePage.items[0] ?? null };
		})
	);

	roomsWithPreview.sort((a, b) => {
		const aTime = a.lastMessage?.created ?? a.room.created;
		const bTime = b.lastMessage?.created ?? b.room.created;
		return bTime.localeCompare(aTime);
	});

	return { rooms: roomsWithPreview, userId };
};
