import { fail, redirect } from '@sveltejs/kit';
import { ClientResponseError } from 'pocketbase';
import type { Actions } from './$types';
import { createListSchema } from '$lib/validation/todoSchemas';
import { fieldErrorsFrom } from '$lib/validation/formErrors';
import type { TodoListRecord } from '$lib/server/todoRecord';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = createListSchema.safeParse({ title: formData.get('title') });

		if (!parsed.success) {
			return fail(400, { errors: fieldErrorsFrom(parsed.error) });
		}

		const ownerId = locals.pb.authStore.record?.id ?? '';

		let list: TodoListRecord;
		try {
			list = await locals.pb.collection('todo_lists').create<TodoListRecord>({
				title: parsed.data.title,
				owner: ownerId,
				public: false
			});
		} catch (err) {
			if (err instanceof ClientResponseError) {
				const errors: Record<string, string> = { general: 'Não foi possível criar a lista.' };
				return fail(400, { errors });
			}
			throw err;
		}

		throw redirect(303, `/todos/${list.id}`);
	}
};
