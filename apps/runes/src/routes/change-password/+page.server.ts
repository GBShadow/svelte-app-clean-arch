import { fail, redirect } from '@sveltejs/kit';
import { ClientResponseError } from 'pocketbase';
import type { Actions, PageServerLoad } from './$types';
import { changePasswordSchema, fieldErrorsFrom } from '$lib/validation/userSchemas';

export const load: PageServerLoad = async ({ locals }) => {
	return { user: locals.user };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = changePasswordSchema.safeParse({
			currentPassword: formData.get('currentPassword'),
			password: formData.get('password'),
			confirmPassword: formData.get('confirmPassword')
		});

		if (!parsed.success) {
			return fail(400, { errors: fieldErrorsFrom(parsed.error) });
		}

		const authId = locals.pb.authStore.record?.id;
		if (!authId) {
			throw redirect(303, '/login');
		}

		try {
			await locals.pb.collection('auth').update(authId, {
				oldPassword: parsed.data.currentPassword,
				password: parsed.data.password,
				passwordConfirm: parsed.data.confirmPassword,
				mustChangePassword: false,
				passwordSetAt: new Date().toISOString()
			});
		} catch (err) {
			if (err instanceof ClientResponseError) {
				const errors: Record<string, string> = { currentPassword: 'Senha atual incorreta.' };
				return fail(400, { errors });
			}
			throw err;
		}

		throw redirect(303, '/');
	}
};
