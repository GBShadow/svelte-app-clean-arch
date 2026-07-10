import { fail, redirect } from '@sveltejs/kit';
import PocketBase, { ClientResponseError } from 'pocketbase';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import type { Actions, PageServerLoad } from './$types';
import { changePasswordSchema } from '$lib/validation/userSchemas';
import { fieldErrorsFrom } from '$lib/validation/formErrors';

/**
 * Confirms the current password against a throwaway client.
 *
 * PocketBase skips the `oldPassword` check when the requester matches the
 * collection's manageRule (here, isAdmin = true), so admins could otherwise
 * change their password without knowing the current one. Re-authenticating
 * enforces it for everyone.
 */
async function currentPasswordMatches(email: string, currentPassword: string): Promise<boolean> {
	const verifier = new PocketBase(PUBLIC_POCKETBASE_URL);
	try {
		await verifier.collection('auth').authWithPassword(email, currentPassword);
		return true;
	} catch {
		return false;
	}
}

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

		const authRecord = locals.pb.authStore.record;
		if (!authRecord?.id) {
			throw redirect(303, '/login');
		}

		if (!(await currentPasswordMatches(authRecord.email, parsed.data.currentPassword))) {
			return fail(400, { errors: { currentPassword: 'Senha atual incorreta.' } });
		}

		try {
			await locals.pb.collection('auth').update(authRecord.id, {
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
