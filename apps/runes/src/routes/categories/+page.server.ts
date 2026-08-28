import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAdminClient } from '$lib/server/pocketbaseAdmin';
import {
	createCategorySchema,
	updateCategorySchema,
	deleteCategorySchema
} from '$lib/validation/categorySchemas';
import { logError } from '$lib/server/logger';
import type { CategoryRecord } from '$lib/server/categoryRecord';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	try {
		const adminPb = await getAdminClient();
		const categories = await adminPb.collection('categories').getFullList<CategoryRecord>({
			sort: 'name'
		});

		// Contagens agregadas em lote para cada categoria
		const counts: Record<string, number> = {};
		for (const cat of categories) {
			counts[cat.id] = 0;
		}

		const [todos, cards, pokerTasks, specDocs, retroCards] = await Promise.all([
			adminPb.collection('todo_items').getFullList({ filter: 'category != ""', fields: 'category' }).catch(() => []),
			adminPb.collection('kanban_cards').getFullList({ filter: 'category != ""', fields: 'category' }).catch(() => []),
			adminPb.collection('poker_tasks').getFullList({ filter: 'category != ""', fields: 'category' }).catch(() => []),
			adminPb.collection('spec_documents').getFullList({ filter: 'category != ""', fields: 'category' }).catch(() => []),
			adminPb.collection('retro_cards').getFullList({ filter: 'category != ""', fields: 'category' }).catch(() => [])
		]);

		for (const item of [...todos, ...cards, ...pokerTasks, ...specDocs, ...retroCards]) {
			if (item.category && counts[item.category] !== undefined) {
				counts[item.category] = (counts[item.category] || 0) + 1;
			}
		}

		return {
			categories,
			counts
		};
	} catch (e: unknown) {
		logError('categories:load', e);
		return {
			categories: [],
			counts: {}
		};
	}
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { errors: { form: 'Não autenticado.' } });
		}

		const formData = await request.formData();
		const rawName = formData.get('name')?.toString() ?? '';
		const rawDescription = formData.get('description')?.toString() ?? '';

		const parsed = createCategorySchema.safeParse({
			name: rawName,
			description: rawDescription
		});

		if (!parsed.success) {
			const errors: Record<string, string> = {};
			for (const issue of parsed.error.issues) {
				const field = issue.path[0]?.toString() || 'form';
				errors[field] = issue.message;
			}
			return fail(400, { errors, values: { name: rawName, description: rawDescription } });
		}

		try {
			const adminPb = await getAdminClient();
			await adminPb.collection('categories').create({
				name: parsed.data.name,
				description: parsed.data.description || ''
			});
			return { success: true, message: 'Categoria criada com sucesso.' };
		} catch (e: unknown) {
			logError('categories:create', e);
			const msg = e instanceof Error ? e.message : 'tente novamente.';
			return fail(500, {
				errors: { form: 'Erro ao criar categoria: ' + msg }
			});
		}
	},

	update: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { errors: { form: 'Não autenticado.' } });
		}

		const formData = await request.formData();
		const rawId = formData.get('id')?.toString() ?? '';
		const rawName = formData.get('name')?.toString() ?? '';
		const rawDescription = formData.get('description')?.toString() ?? '';

		const parsed = updateCategorySchema.safeParse({
			id: rawId,
			name: rawName,
			description: rawDescription
		});

		if (!parsed.success) {
			const errors: Record<string, string> = {};
			for (const issue of parsed.error.issues) {
				const field = issue.path[0]?.toString() || 'form';
				errors[field] = issue.message;
			}
			return fail(400, { errors, values: { id: rawId, name: rawName, description: rawDescription } });
		}

		try {
			const adminPb = await getAdminClient();
			await adminPb.collection('categories').update(parsed.data.id, {
				name: parsed.data.name,
				description: parsed.data.description || ''
			});
			return { success: true, message: 'Categoria atualizada com sucesso.' };
		} catch (e: unknown) {
			logError('categories:update', e);
			const msg = e instanceof Error ? e.message : 'tente novamente.';
			return fail(500, {
				errors: { form: 'Erro ao atualizar categoria: ' + msg }
			});
		}
	},

	delete: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { errors: { form: 'Não autenticado.' } });
		}

		const formData = await request.formData();
		const rawId = formData.get('id')?.toString() ?? '';

		const parsed = deleteCategorySchema.safeParse({ id: rawId });
		if (!parsed.success) {
			return fail(400, { errors: { form: 'ID inválido.' } });
		}

		try {
			const adminPb = await getAdminClient();
			await adminPb.collection('categories').delete(parsed.data.id);
			return { success: true, message: 'Categoria excluída com sucesso.' };
		} catch (e: unknown) {
			logError('categories:delete', e);
			const msg = e instanceof Error ? e.message : 'tente novamente.';
			return fail(500, {
				errors: { form: 'Erro ao excluir categoria: ' + msg }
			});
		}
	}
};
