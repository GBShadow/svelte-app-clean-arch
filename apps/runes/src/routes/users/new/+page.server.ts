import { fail, redirect } from '@sveltejs/kit';
import { ClientResponseError } from 'pocketbase';
import type { Actions, PageServerLoad } from './$types';
import { createUserSchema } from '$lib/validation/userSchemas';
import { fieldErrorsFrom } from '$lib/validation/formErrors';

const GENERIC_CREATE_ERROR =
	'Não foi possível criar o usuário. Verifique se o e-mail já está em uso.';

function formValue(formData: FormData, key: string): string {
	const value = formData.get(key);
	return typeof value === 'string' ? value : '';
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user?.isAdmin) {
		throw redirect(303, '/');
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user?.isAdmin) {
			throw redirect(303, '/');
		}

		const formData = await request.formData();
		const raw = {
			name: formValue(formData, 'name'),
			email: formValue(formData, 'email'),
			jobTitle: formValue(formData, 'jobTitle'),
			password: formValue(formData, 'password'),
			confirmPassword: formValue(formData, 'confirmPassword')
		};

		const parsed = createUserSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, { errors: fieldErrorsFrom(parsed.error), values: raw });
		}

		const { name, email, jobTitle, password } = parsed.data;

		let createdAuthId: string | undefined;
		try {
			const authRecord = await locals.pb.collection('auth').create({
				email,
				emailVisibility: true,
				password,
				passwordConfirm: password,
				name,
				isAdmin: false,
				mustChangePassword: false,
				passwordSetAt: new Date().toISOString()
			});
			createdAuthId = authRecord.id;

			await locals.pb.collection('user').create({ name, email, jobTitle });
		} catch (error) {
			if (createdAuthId) {
				await locals.pb
					.collection('auth')
					.delete(createdAuthId)
					.catch(() => {});
			}

			if (error instanceof ClientResponseError) {
				const errors: Record<string, string> = { general: GENERIC_CREATE_ERROR };
				return fail(400, { errors, values: raw });
			}
			throw error;
		}

		throw redirect(303, '/users');
	}
};
