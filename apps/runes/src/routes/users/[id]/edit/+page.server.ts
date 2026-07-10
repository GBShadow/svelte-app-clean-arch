import { error, fail, redirect } from '@sveltejs/kit';
import { ClientResponseError } from 'pocketbase';
import type PocketBase from 'pocketbase';
import type { Actions, PageServerLoad } from './$types';
import type { UserRecord } from '$lib/server/userRecord';
import {
	adminEmailSchema,
	fieldErrorsFrom,
	resetPasswordSchema,
	updateUserSchema
} from '$lib/validation/userSchemas';

async function findAuthRecordByUserEmail(pb: PocketBase, email: string) {
	return pb.collection('auth').getFirstListItem(pb.filter('email = {:email}', { email }));
}

function canAccess(locals: App.Locals, targetId: string): boolean {
	return Boolean(locals.user?.isAdmin) || locals.user?.id === targetId;
}

function formValue(formData: FormData, key: string): string {
	const value = formData.get(key);
	return typeof value === 'string' ? value : '';
}

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!canAccess(locals, params.id)) {
		throw redirect(303, '/');
	}

	let targetUser: UserRecord;
	try {
		targetUser = await locals.pb.collection('user').getOne<UserRecord>(params.id);
	} catch {
		throw error(404, 'Usuário não encontrado.');
	}

	return { targetUser, canEditEmail: Boolean(locals.user?.isAdmin) };
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		if (!canAccess(locals, params.id)) {
			throw redirect(303, '/');
		}

		const isAdmin = Boolean(locals.user?.isAdmin);
		const formData = await request.formData();
		const raw = { name: formValue(formData, 'name'), jobTitle: formValue(formData, 'jobTitle') };

		const parsed = updateUserSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, { errors: fieldErrorsFrom(parsed.error), values: raw, action: 'update' });
		}

		const targetUser = await locals.pb.collection('user').getOne<UserRecord>(params.id);

		let newEmail: string | undefined;
		if (isAdmin) {
			const submittedEmail = formValue(formData, 'email');
			if (submittedEmail && submittedEmail !== targetUser.email) {
				const emailParsed = adminEmailSchema.safeParse(submittedEmail);
				if (!emailParsed.success) {
					const errors: Record<string, string> = { email: 'E-mail inválido.' };
					return fail(400, { errors, values: raw, action: 'update' });
				}
				newEmail = emailParsed.data;
			}
		}

		let authRecordId: string | undefined;
		let previousAuthEmail: string | undefined;

		try {
			if (newEmail) {
				const authRecord = await findAuthRecordByUserEmail(locals.pb, targetUser.email);
				authRecordId = authRecord.id;
				previousAuthEmail = authRecord.email;
				await locals.pb.collection('auth').update(authRecordId, { email: newEmail });
			}

			await locals.pb.collection('user').update(params.id, {
				name: parsed.data.name,
				jobTitle: parsed.data.jobTitle,
				...(newEmail ? { email: newEmail } : {})
			});
		} catch (err) {
			if (authRecordId && previousAuthEmail) {
				await locals.pb
					.collection('auth')
					.update(authRecordId, { email: previousAuthEmail })
					.catch(() => {});
			}
			if (err instanceof ClientResponseError) {
				const errors: Record<string, string> = { general: 'Não foi possível salvar as alterações.' };
				return fail(400, { errors, values: raw, action: 'update' });
			}
			throw err;
		}

		throw redirect(303, isAdmin ? '/users' : '/');
	},

	resetPassword: async ({ request, params, locals }) => {
		if (!locals.user?.isAdmin) {
			throw redirect(303, '/');
		}

		const formData = await request.formData();
		const parsed = resetPasswordSchema.safeParse({
			password: formValue(formData, 'password'),
			confirmPassword: formValue(formData, 'confirmPassword')
		});
		if (!parsed.success) {
			return fail(400, { errors: fieldErrorsFrom(parsed.error), action: 'resetPassword' });
		}

		const targetUser = await locals.pb.collection('user').getOne<UserRecord>(params.id);

		try {
			const authRecord = await findAuthRecordByUserEmail(locals.pb, targetUser.email);
			await locals.pb.collection('auth').update(authRecord.id, {
				password: parsed.data.password,
				passwordConfirm: parsed.data.confirmPassword,
				mustChangePassword: true,
				passwordSetAt: new Date().toISOString()
			});
		} catch (err) {
			if (err instanceof ClientResponseError) {
				const errors: Record<string, string> = { general: 'Não foi possível resetar a senha.' };
				return fail(400, { errors, action: 'resetPassword' });
			}
			throw err;
		}

		return { success: true, action: 'resetPassword' as const };
	},

	delete: async ({ params, locals }) => {
		if (!locals.user?.isAdmin) {
			throw redirect(303, '/');
		}

		const targetUser = await locals.pb.collection('user').getOne<UserRecord>(params.id);

		try {
			const authRecord = await findAuthRecordByUserEmail(locals.pb, targetUser.email);
			await locals.pb.collection('user').delete(params.id);
			await locals.pb.collection('auth').delete(authRecord.id);
		} catch (err) {
			if (err instanceof ClientResponseError) {
				const errors: Record<string, string> = { general: 'Não foi possível excluir o usuário.' };
				return fail(400, { errors, action: 'delete' });
			}
			throw err;
		}

		throw redirect(303, '/users');
	}
};
