import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAdminClient } from '$lib/server/pocketbaseAdmin';
import type { ProjectRecord } from '$lib/server/projectRecord';
import { canManageProject } from '$lib/domain/projectAccess';
import { createProjectSchema } from '$lib/validation/projectSchemas';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) throw redirect(303, '/login');

	const adminPb = await getAdminClient();
	let project: ProjectRecord;
	try {
		project = await adminPb.collection('projects').getOne<ProjectRecord>(params.id);
	} catch {
		throw error(404, 'Projeto não encontrado');
	}

	if (!canManageProject(locals.user, project)) {
		throw error(403, 'Acesso negado');
	}

	return { project };
};

export const actions: Actions = {
	default: async ({ params, request, locals }) => {
		if (!locals.user) return fail(401);

		const adminPb = await getAdminClient();
		let project: ProjectRecord;
		try {
			project = await adminPb.collection('projects').getOne<ProjectRecord>(params.id);
		} catch {
			return fail(404);
		}

		if (!canManageProject(locals.user, project)) return fail(403);

		const formData = await request.formData();
		const title = formData.get('title') as string;
		const description = formData.get('description') as string;

		const validation = createProjectSchema.safeParse({ title, description });
		if (!validation.success) {
			return fail(400, { errors: validation.error.flatten().fieldErrors });
		}

		try {
			await adminPb.collection('projects').update(params.id, {
				title: validation.data.title,
				description: validation.data.description
			});
		} catch (err) {
			console.error('Erro ao atualizar projeto:', err);
			return fail(500, { errors: { general: 'Erro ao atualizar projeto.' } });
		}

		throw redirect(303, `/projects/${params.id}`);
	}
};
