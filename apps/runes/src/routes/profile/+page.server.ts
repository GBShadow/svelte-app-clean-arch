import { fail } from '@sveltejs/kit';
import { ClientResponseError } from 'pocketbase';
import type { Actions, PageServerLoad } from './$types';
import { avatarSchema } from '$lib/validation/chatSchemas';

export const load: PageServerLoad = async ({ locals }) => {
	return { user: locals.user, authId: locals.pb.authStore.record?.id ?? '' };
};

export const actions: Actions = {
	uploadAvatar: async ({ request, locals }) => {
		const formData = await request.formData();
		const file = formData.get('avatar');

		const parsed = avatarSchema.safeParse(file);
		if (!parsed.success) {
			const errors: Record<string, string> = {
				avatar: parsed.error.issues[0]?.message ?? 'Imagem inválida.'
			};
			return fail(400, { errors });
		}

		const userId = locals.pb.authStore.record?.id ?? '';
		try {
			await locals.pb.collection('auth').update(userId, { avatar: parsed.data });
		} catch (err) {
			if (err instanceof ClientResponseError) {
				const errors: Record<string, string> = { general: 'Não foi possível salvar o avatar.' };
				return fail(400, { errors });
			}
			throw err;
		}

		return { success: true };
	}
};
