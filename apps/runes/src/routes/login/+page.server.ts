import { fail, redirect } from '@sveltejs/kit';
import { ClientResponseError } from 'pocketbase';
import type { Actions, PageServerLoad } from './$types';
import { loginSchema } from '$lib/validation/authSchemas';

const INVALID_CREDENTIALS_ERROR = 'E-mail ou senha inválidos.';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, '/');
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = loginSchema.safeParse({
			email: formData.get('email'),
			password: formData.get('password')
		});

		if (!parsed.success) {
			return fail(400, { error: INVALID_CREDENTIALS_ERROR });
		}

		try {
			await locals.pb
				.collection('auth')
				.authWithPassword(parsed.data.email, parsed.data.password);
		} catch (error) {
			if (error instanceof ClientResponseError) {
				return fail(400, { error: INVALID_CREDENTIALS_ERROR });
			}
			throw error;
		}

		throw redirect(303, '/');
	}
};
