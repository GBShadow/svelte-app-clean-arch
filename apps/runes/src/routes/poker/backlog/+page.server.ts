import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAdminClient } from '$lib/server/pocketbaseAdmin';
import { createGlobalTaskSchema, editGlobalTaskSchema } from '$lib/validation/pokerSchemas';
import { fieldErrorsFrom } from '$lib/validation/formErrors';
import { canEditGlobalTask, canDeleteGlobalTask } from '$lib/domain/planningPokerAccess';
import sanitizeHtml from 'sanitize-html';
import { TASK_LIST_SANITIZE_ATTRIBUTES, TASK_LIST_SANITIZE_TAGS } from '$lib/server/richTextSanitize';
import type { PokerTaskRecord } from '$lib/server/pokerRecord';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	try {
		// Carrega tarefas globais ainda não vinculadas (room é nulo ou vazio)
		const adminPb = await getAdminClient();
		const tasks = await adminPb.collection('poker_tasks').getFullList<PokerTaskRecord>({
			filter: 'is_global_backlog = true && room = null',
			sort: 'created'
		});

		return {
			tasks,
			isAdmin: locals.user.isAdmin === true,
			pbToken: locals.pb.authStore.token,
			pbRecord: locals.pb.authStore.record
		};
	} catch (err) {
		console.error('Erro ao carregar backlog global:', err);
		return {
			tasks: [],
			isAdmin: locals.user?.isAdmin === true,
			pbToken: locals.pb.authStore.token,
			pbRecord: locals.pb.authStore.record
		};
	}
};

export const actions: Actions = {
	createGlobalTask: async ({ request, locals }) => {
		if (!locals.user || !locals.user.isAdmin) {
			return fail(403, { errors: { general: 'Apenas administradores podem criar tarefas no backlog global.' } });
		}

		const formData = await request.formData();
		const validation = createGlobalTaskSchema.safeParse({
			title: formData.get('title'),
			description: formData.get('description')
		});

		if (!validation.success) {
			return fail(400, { errors: fieldErrorsFrom(validation.error) });
		}

		const adminPb = await getAdminClient();

		try {
			// Sanitiza HTML
			const cleanDescription = sanitizeHtml(validation.data.description, {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'span', 'img', ...TASK_LIST_SANITIZE_TAGS]),
				allowedAttributes: {
					...sanitizeHtml.defaults.allowedAttributes,
					...TASK_LIST_SANITIZE_ATTRIBUTES,
					'*': ['class', 'style']
				}
			});

			await adminPb.collection('poker_tasks').create({
				title: validation.data.title,
				description: cleanDescription,
				status: 'backlog',
				is_global_backlog: true,
				room: null
			});
		} catch (err) {
			console.error('Erro ao criar tarefa global:', err);
			return fail(500, { errors: { general: 'Não foi possível criar a tarefa.' } });
		}

		return { success: true };
	},

	editGlobalTask: async ({ request, locals }) => {
		if (!locals.user || !locals.user.isAdmin) {
			return fail(403, { errors: { general: 'Apenas administradores podem editar tarefas no backlog global.' } });
		}

		const formData = await request.formData();
		const validation = editGlobalTaskSchema.safeParse({
			taskId: formData.get('taskId'),
			title: formData.get('title'),
			description: formData.get('description')
		});

		if (!validation.success) {
			return fail(400, { errors: fieldErrorsFrom(validation.error) });
		}

		const adminPb = await getAdminClient();

		try {
			const task = await adminPb.collection('poker_tasks').getOne<PokerTaskRecord>(validation.data.taskId);

			if (!canEditGlobalTask({ isAdmin: locals.user.isAdmin }, task)) {
				return fail(403, { errors: { general: 'Não é possível editar uma tarefa vinculada a uma sala.' } });
			}

			// Sanitiza HTML
			const cleanDescription = sanitizeHtml(validation.data.description, {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'span', 'img', ...TASK_LIST_SANITIZE_TAGS]),
				allowedAttributes: {
					...sanitizeHtml.defaults.allowedAttributes,
					...TASK_LIST_SANITIZE_ATTRIBUTES,
					'*': ['class', 'style']
				}
			});

			await adminPb.collection('poker_tasks').update(validation.data.taskId, {
				title: validation.data.title,
				description: cleanDescription
			});
		} catch (err) {
			console.error('Erro ao editar tarefa global:', err);
			return fail(500, { errors: { general: 'Não foi possível salvar a tarefa.' } });
		}

		return { success: true };
	},

	deleteGlobalTask: async ({ request, locals }) => {
		if (!locals.user || !locals.user.isAdmin) {
			return fail(403, { errors: { general: 'Apenas administradores podem excluir tarefas no backlog global.' } });
		}

		const formData = await request.formData();
		const taskId = formData.get('taskId') as string;

		if (!taskId) {
			return fail(400, { errors: { general: 'ID da tarefa obrigatório.' } });
		}

		const adminPb = await getAdminClient();

		try {
			const task = await adminPb.collection('poker_tasks').getOne<PokerTaskRecord>(taskId);

			if (!canDeleteGlobalTask({ isAdmin: locals.user.isAdmin }, task)) {
				return fail(403, { errors: { general: 'Não é possível excluir uma tarefa vinculada a uma sala.' } });
			}

			await adminPb.collection('poker_tasks').delete(taskId);
		} catch (err) {
			console.error('Erro ao excluir tarefa global:', err);
			return fail(500, { errors: { general: 'Não foi possível excluir a tarefa.' } });
		}

		return { success: true };
	}
};
