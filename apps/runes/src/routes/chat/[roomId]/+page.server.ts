import { error, fail, redirect } from '@sveltejs/kit';
import type PocketBase from 'pocketbase';
import type { Actions, PageServerLoad } from './$types';
import type { ChatMessageRecord, ChatRoomRecord } from '$lib/server/chatRecord';
import { isCreator, isParticipant, nextCreatorAfter } from '$lib/domain/chatRoomAccess';
import { findAuthRecordByEmail } from '$lib/server/authLookup';
import { fetchAuthParticipants } from '$lib/server/authExpand';
import { sendMessageSchema } from '$lib/validation/chatSchemas';
import { fieldErrorsFrom } from '$lib/validation/formErrors';
import { getAdminClient } from '$lib/server/pocketbaseAdmin';

const REALTIME_TOKEN_TTL_SECONDS = 600;

const FORBIDDEN_ERROR = 'Você não tem permissão para esta ação.';
const MESSAGES_PAGE_SIZE = 50;

async function getRoom(pb: PocketBase, id: string): Promise<ChatRoomRecord> {
	let room: ChatRoomRecord;
	try {
		room = await pb.collection('chat_rooms').getOne<ChatRoomRecord>(id);
	} catch {
		throw error(404, 'Sala não encontrada.');
	}

	const participants = await fetchAuthParticipants(room.participants);
	room.expand = { participants };
	return room;
}

function requireParticipant(room: ChatRoomRecord, userId: string) {
	if (!isParticipant({ createdBy: room.created_by, participantIds: room.participants }, userId)) {
		const errors: Record<string, string> = { general: FORBIDDEN_ERROR };
		return fail(403, { errors });
	}
	return null;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const userId = locals.pb.authStore.record?.id ?? '';
	const room = await getRoom(locals.pb, params.roomId);

	if (!isParticipant({ createdBy: room.created_by, participantIds: room.participants }, userId)) {
		throw error(403, 'Você não tem acesso a esta sala.');
	}

	const messagesPage = await locals.pb
		.collection('chat_messages')
		.getList<ChatMessageRecord>(1, MESSAGES_PAGE_SIZE, {
			filter: locals.pb.filter('room = {:roomId}', { roomId: room.id }),
			sort: '-created'
		});
	const messages = messagesPage.items.slice().reverse();

	const admin = await getAdminClient();
	const impersonated = await admin.collection('auth').impersonate(userId, REALTIME_TOKEN_TTL_SECONDS);

	return {
		room,
		messages,
		userId,
		pbToken: impersonated.authStore.token,
		pbRecord: impersonated.authStore.record
	};
};

export const actions: Actions = {
	sendMessage: async ({ request, params, locals }) => {
		const userId = locals.pb.authStore.record?.id ?? '';
		const room = await getRoom(locals.pb, params.roomId);
		const denied = requireParticipant(room, userId);
		if (denied) return denied;

		const formData = await request.formData();
		const parsed = sendMessageSchema.safeParse({ text: formData.get('text') });
		if (!parsed.success) {
			return fail(400, { errors: fieldErrorsFrom(parsed.error) });
		}

		await locals.pb.collection('chat_messages').create({
			room: room.id,
			sender: userId,
			text: parsed.data.text
		});

		return { success: true };
	},

	leaveRoom: async ({ params, locals }) => {
		const userId = locals.pb.authStore.record?.id ?? '';
		const room = await getRoom(locals.pb, params.roomId);
		const denied = requireParticipant(room, userId);
		if (denied) return denied;

		const remaining = room.participants.filter((id) => id !== userId);

		if (remaining.length === 0) {
			await locals.pb.collection('chat_rooms').delete(room.id);
			throw redirect(303, '/chat');
		}

		const roomAccess = { createdBy: room.created_by, participantIds: room.participants };
		const update: { participants: string[]; created_by?: string } = { participants: remaining };
		if (isCreator(roomAccess, userId)) {
			update.created_by = nextCreatorAfter(room.participants, userId) ?? remaining[0];
		}

		// chat_rooms.updateRule agora é restrita ao criador (ver migration 0014); um
		// participante comum saindo da sala precisa do cliente superusuário para gravar.
		const admin = await getAdminClient();
		await admin.collection('chat_rooms').update(room.id, update);
		throw redirect(303, '/chat');
	},

	addParticipant: async ({ request, params, locals }) => {
		const userId = locals.pb.authStore.record?.id ?? '';
		const room = await getRoom(locals.pb, params.roomId);
		const roomAccess = { createdBy: room.created_by, participantIds: room.participants };
		if (!isCreator(roomAccess, userId)) {
			const errors: Record<string, string> = { general: FORBIDDEN_ERROR };
			return fail(403, { errors });
		}

		const formData = await request.formData();
		const email = formData.get('email');
		if (typeof email !== 'string' || !email) {
			const errors: Record<string, string> = { email: 'E-mail obrigatório.' };
			return fail(400, { errors });
		}

		let authRecord;
		try {
			authRecord = await findAuthRecordByEmail(email);
		} catch {
			const errors: Record<string, string> = { email: 'Usuário não encontrado.' };
			return fail(400, { errors });
		}

		if (room.participants.includes(authRecord.id)) {
			const errors: Record<string, string> = { email: 'Usuário já é participante.' };
			return fail(400, { errors });
		}

		await locals.pb.collection('chat_rooms').update(room.id, {
			participants: [...room.participants, authRecord.id]
		});

		return { success: true };
	},

	removeParticipant: async ({ request, params, locals }) => {
		const userId = locals.pb.authStore.record?.id ?? '';
		const room = await getRoom(locals.pb, params.roomId);
		const roomAccess = { createdBy: room.created_by, participantIds: room.participants };
		if (!isCreator(roomAccess, userId)) {
			const errors: Record<string, string> = { general: FORBIDDEN_ERROR };
			return fail(403, { errors });
		}

		const formData = await request.formData();
		const targetId = formData.get('userId');
		if (typeof targetId !== 'string' || !targetId) {
			const errors: Record<string, string> = { general: 'Usuário inválido.' };
			return fail(400, { errors });
		}

		if (targetId === userId) {
			const errors: Record<string, string> = {
				general: 'Use a opção "Sair da sala" para remover a si mesmo.'
			};
			return fail(400, { errors });
		}

		const remaining = room.participants.filter((id) => id !== targetId);
		await locals.pb.collection('chat_rooms').update(room.id, { participants: remaining });

		return { success: true };
	}
};
