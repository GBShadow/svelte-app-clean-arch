import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAdminClient } from '$lib/server/pocketbaseAdmin';
import type { ProjectRecord } from '$lib/server/projectRecord';
import { canViewProject } from '$lib/domain/projectAccess';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');

	const adminPb = await getAdminClient();
	const allProjects = await adminPb.collection('projects').getFullList<ProjectRecord>({
		sort: '-created',
		expand: 'created_by,responsaveis,participants'
	});

	const projects = allProjects.filter((p) => canViewProject(locals.user, p));

	return { projects };
};
