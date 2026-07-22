import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAdminClient } from '$lib/server/pocketbaseAdmin';
import { createProjectSchema } from '$lib/validation/projectSchemas';
import { canCreateProject } from '$lib/domain/projectAccess';
import type { UserRecord } from '$lib/server/userRecord';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	if (!canCreateProject(locals.user)) throw redirect(303, '/projects');

	const adminPb = await getAdminClient();
	const users = await adminPb.collection('user').getFullList<UserRecord>({
		sort: 'name'
	});

	return { users, userId: locals.user.id };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		if (!canCreateProject(locals.user)) return fail(403);

		const formData = await request.formData();
		const validation = createProjectSchema.safeParse({
			title: formData.get('title'),
			description: formData.get('description'),
			responsaveisIds: formData.getAll('responsaveisIds[]'),
			participantIds: formData.getAll('participantIds[]')
		});

		if (!validation.success) {
			return fail(400, { errors: validation.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();

		let project;
		try {
			project = await adminPb.collection('projects').create({
				title: validation.data.title,
				description: validation.data.description,
				created_by: locals.user.id,
				responsaveis: [locals.user.id, ...validation.data.responsaveisIds],
				participants: [locals.user.id, ...validation.data.participantIds]
			});

			// Create default columns for the project
			const columns = [
				{ name: 'Aguardando', position: 0, type: 'backlog', project: project.id },
				{ name: 'Fazendo', position: 1, type: 'custom', project: project.id },
				{ name: 'Feito', position: 2, type: 'done', project: project.id }
			];
			for (const col of columns) {
				await adminPb.collection('kanban_columns').create(col);
			}
		} catch (err) {
			console.error('Erro ao criar projeto:', err);
			return fail(500, { errors: { general: 'Erro ao criar projeto.' } });
		}

		throw redirect(303, `/projects/${project.id}`);
	}
};
