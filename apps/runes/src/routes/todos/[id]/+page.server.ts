import { error, fail, redirect } from '@sveltejs/kit';
import { ClientResponseError } from 'pocketbase';
import type PocketBase from 'pocketbase';
import type { Actions, PageServerLoad } from './$types';
import type { TodoItemRecord, TodoListRecord } from '$lib/server/todoRecord';
import { canView, canWrite } from '$lib/domain/todoListAccess';
import { addItemSchema, createListSchema } from '$lib/validation/todoSchemas';
import { fieldErrorsFrom } from '$lib/validation/formErrors';

const FORBIDDEN_ERROR = 'Você não tem permissão para esta ação.';

async function getList(pb: PocketBase, id: string): Promise<TodoListRecord> {
	try {
		return await pb.collection('todo_lists').getOne<TodoListRecord>(id);
	} catch {
		throw error(404, 'Lista não encontrada.');
	}
}

function requireOwner(list: TodoListRecord, userId: string) {
	if (!canWrite({ ownerId: list.owner, public: list.public }, userId)) {
		return fail(403, { errors: { general: FORBIDDEN_ERROR } });
	}
	return null;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const userId = locals.pb.authStore.record?.id ?? '';
	const list = await getList(locals.pb, params.id);

	if (!canView({ ownerId: list.owner, public: list.public }, userId)) {
		throw error(403, 'Você não tem acesso a esta lista.');
	}

	const items = await locals.pb.collection('todo_items').getFullList<TodoItemRecord>({
		filter: locals.pb.filter('list = {:list}', { list: params.id }),
		sort: 'created'
	});

	return {
		list,
		items,
		isOwner: canWrite({ ownerId: list.owner, public: list.public }, userId)
	};
};

export const actions: Actions = {
	updateTitle: async ({ request, params, locals }) => {
		const userId = locals.pb.authStore.record?.id ?? '';
		const list = await getList(locals.pb, params.id);
		const denied = requireOwner(list, userId);
		if (denied) return denied;

		const formData = await request.formData();
		const parsed = createListSchema.safeParse({ title: formData.get('title') });
		if (!parsed.success) {
			return fail(400, { errors: fieldErrorsFrom(parsed.error) });
		}

		try {
			await locals.pb.collection('todo_lists').update(params.id, { title: parsed.data.title });
		} catch (err) {
			if (err instanceof ClientResponseError) {
				const errors: Record<string, string> = { general: 'Não foi possível salvar o título.' };
				return fail(400, { errors });
			}
			throw err;
		}

		return { success: true };
	},

	togglePublic: async ({ params, locals }) => {
		const userId = locals.pb.authStore.record?.id ?? '';
		const list = await getList(locals.pb, params.id);
		const denied = requireOwner(list, userId);
		if (denied) return denied;

		await locals.pb.collection('todo_lists').update(params.id, { public: !list.public });

		return { success: true };
	},

	delete: async ({ params, locals }) => {
		const userId = locals.pb.authStore.record?.id ?? '';
		const list = await getList(locals.pb, params.id);
		const denied = requireOwner(list, userId);
		if (denied) return denied;

		await locals.pb.collection('todo_lists').delete(params.id);

		throw redirect(303, '/todos');
	},

	addItem: async ({ request, params, locals }) => {
		const userId = locals.pb.authStore.record?.id ?? '';
		const list = await getList(locals.pb, params.id);
		const denied = requireOwner(list, userId);
		if (denied) return denied;

		const formData = await request.formData();
		const parsed = addItemSchema.safeParse({ description: formData.get('description') });
		if (!parsed.success) {
			return fail(400, { errors: fieldErrorsFrom(parsed.error) });
		}

		await locals.pb.collection('todo_items').create({
			list: params.id,
			description: parsed.data.description,
			done: false
		});

		return { success: true };
	},

	toggleItem: async ({ request, params, locals }) => {
		const userId = locals.pb.authStore.record?.id ?? '';
		const list = await getList(locals.pb, params.id);
		const denied = requireOwner(list, userId);
		if (denied) return denied;

		const formData = await request.formData();
		const itemId = formData.get('itemId');
		if (typeof itemId !== 'string' || !itemId) {
			const errors: Record<string, string> = { general: 'Item inválido.' };
			return fail(400, { errors });
		}

		const item = await locals.pb.collection('todo_items').getOne<TodoItemRecord>(itemId);
		if (item.list !== params.id) {
			const errors: Record<string, string> = { general: FORBIDDEN_ERROR };
			return fail(403, { errors });
		}
		await locals.pb.collection('todo_items').update(itemId, { done: !item.done });

		return { success: true };
	},

	removeItem: async ({ request, params, locals }) => {
		const userId = locals.pb.authStore.record?.id ?? '';
		const list = await getList(locals.pb, params.id);
		const denied = requireOwner(list, userId);
		if (denied) return denied;

		const formData = await request.formData();
		const itemId = formData.get('itemId');
		if (typeof itemId !== 'string' || !itemId) {
			const errors: Record<string, string> = { general: 'Item inválido.' };
			return fail(400, { errors });
		}

		const item = await locals.pb.collection('todo_items').getOne<TodoItemRecord>(itemId);
		if (item.list !== params.id) {
			const errors: Record<string, string> = { general: FORBIDDEN_ERROR };
			return fail(403, { errors });
		}

		await locals.pb.collection('todo_items').delete(itemId);

		return { success: true };
	}
};
