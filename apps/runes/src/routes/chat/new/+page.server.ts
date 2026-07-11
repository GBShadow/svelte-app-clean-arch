import { fail, redirect } from '@sveltejs/kit';
import { ClientResponseError } from 'pocketbase';
import type { Actions, PageServerLoad } from './$types';
import type { UserRecord } from '$lib/server/userRecord';
import type { ChatRoomRecord } from '$lib/server/chatRecord';
import { findAuthRecordByEmail } from '$lib/server/authLookup';
import { createRoomSchema } from '$lib/validation/chatSchemas';
import { fieldErrorsFrom } from '$lib/validation/formErrors';

export const load: PageServerLoad = async ({ locals }) => {
	const users = await locals.pb.collection('user').getFullList<UserRecord>({ sort: 'name' });
	return { users: users.filter((u) => u.email !== locals.user?.email) };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = createRoomSchema.safeParse({
			participantIds: formData.getAll('participantIds'),
			name: formData.get('name') || undefined
		});
		if (!parsed.success) {
			return fail(400, { errors: fieldErrorsFrom(parsed.error) });
		}

		const currentUserId = locals.pb.authStore.record?.id ?? '';

		let authIds: string[];
		try {
			const authRecords = await Promise.all(
				parsed.data.participantIds.map((email) => findAuthRecordByEmail(locals.pb, email))
			);
			authIds = authRecords.map((r) => r.id);
		} catch {
			const errors: Record<string, string> = {
				general: 'Não foi possível encontrar os participantes escolhidos.'
			};
			return fail(400, { errors });
		}

		let room: ChatRoomRecord;
		try {
			room = await locals.pb.collection('chat_rooms').create<ChatRoomRecord>({
				name: parsed.data.name ?? '',
				created_by: currentUserId,
				participants: [currentUserId, ...authIds]
			});
		} catch (err) {
			if (err instanceof ClientResponseError) {
				const errors: Record<string, string> = { general: 'Não foi possível criar a sala.' };
				return fail(400, { errors });
			}
			throw err;
		}

		throw redirect(303, `/chat/${room.id}`);
	}
};
