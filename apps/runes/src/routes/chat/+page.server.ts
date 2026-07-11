import type { PageServerLoad } from './$types';
import type { ChatMessageRecord, ChatRoomRecord } from '$lib/server/chatRecord';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.pb.authStore.record?.id ?? '';

	const rooms = await locals.pb.collection('chat_rooms').getFullList<ChatRoomRecord>({
		filter: locals.pb.filter('participants.id ?= {:userId}', { userId }),
		expand: 'participants'
	});

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
