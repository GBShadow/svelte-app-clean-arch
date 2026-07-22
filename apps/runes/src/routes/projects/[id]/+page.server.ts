import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAdminClient } from '$lib/server/pocketbaseAdmin';
import type { ProjectRecord, SprintRecord } from '$lib/server/projectRecord';
import type { UserRecord } from '$lib/server/userRecord';
import {
	canViewProject,
	canManageProject,
	canDeleteProject,
	canCreateSprint,
	canFinalizeSprint,
	canStartSprint
} from '$lib/domain/projectAccess';
import { createSprintSchema } from '$lib/validation/projectSchemas';
import { logError } from '$lib/server/logger';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) throw redirect(303, '/login');

	const adminPb = await getAdminClient();

	let project: ProjectRecord;
	try {
		project = await adminPb.collection('projects').getOne<ProjectRecord>(params.id, {
			expand: 'created_by,responsaveis,participants'
		});
	} catch {
		throw error(404, 'Projeto não encontrado');
	}

	if (!canViewProject(locals.user, project)) {
		throw error(403, 'Acesso negado');
	}

	const sprints = await adminPb.collection('sprints').getFullList<SprintRecord>({
		filter: adminPb.filter('project = {:id}', { id: params.id }),
		sort: '-created'
	});

	const users = await adminPb.collection('user').getFullList<UserRecord>({
		sort: 'name'
	});

	const canManage = canManageProject(locals.user, project);
	const canDelete = canDeleteProject(locals.user, project);

	return { project, sprints, users, canManage, canDelete };
};

export const actions: Actions = {
	createSprint: async ({ params, request, locals }) => {
		if (!locals.user) return fail(401);

		const adminPb = await getAdminClient();
		let project: ProjectRecord;
		try {
			project = await adminPb.collection('projects').getOne<ProjectRecord>(params.id);
		} catch {
			return fail(404);
		}

		if (!canCreateSprint(locals.user, project)) return fail(403);

		const formData = await request.formData();
		const validation = createSprintSchema.safeParse({
			title: formData.get('title'),
			startDate: formData.get('startDate'),
			endDate: formData.get('endDate')
		});

		if (!validation.success) {
			return fail(400, { errors: validation.error.flatten().fieldErrors });
		}

		try {
			await adminPb.collection('sprints').create({
				title: validation.data.title,
				project: params.id,
				startDate: validation.data.startDate,
				endDate: validation.data.endDate,
				status: 'planned'
			});
		} catch (err) {
			logError('createSprint', err);
			return fail(500, { errors: { general: 'Erro ao criar sprint.' } });
		}

		return { success: true };
	},

	startSprint: async ({ params, request, locals }) => {
		if (!locals.user) return fail(401);

		const adminPb = await getAdminClient();
		let project: ProjectRecord;
		try {
			project = await adminPb.collection('projects').getOne<ProjectRecord>(params.id);
		} catch {
			return fail(404);
		}

		if (!canStartSprint(locals.user, project)) return fail(403);

		const formData = await request.formData();
		const sprintId = formData.get('sprintId') as string;

		try {
			await adminPb.collection('sprints').update(sprintId, {
				status: 'active'
			});
		} catch (err) {
			logError('startSprint', err);
			return fail(500, { errors: { general: 'Erro ao iniciar sprint.' } });
		}

		return { success: true };
	},

	finalizeSprint: async ({ params, request, locals }) => {
		if (!locals.user) return fail(401);

		const adminPb = await getAdminClient();
		let project: ProjectRecord;
		try {
			project = await adminPb.collection('projects').getOne<ProjectRecord>(params.id);
		} catch {
			return fail(404);
		}

		if (!canFinalizeSprint(locals.user, project)) return fail(403);

		const formData = await request.formData();
		const sprintId = formData.get('sprintId') as string;

		try {
			await adminPb.collection('sprints').update(sprintId, {
				status: 'finished'
			});

			// Auto-cria próxima sprint como planned
			const finishedSprint = await adminPb.collection('sprints').getOne<SprintRecord>(sprintId);
			const nextStart = new Date(finishedSprint.endDate);
			nextStart.setDate(nextStart.getDate() + 1);
			const nextEnd = new Date(nextStart);
			nextEnd.setDate(nextEnd.getDate() + 14);

			const sprintNum = parseInt(finishedSprint.title.replace(/\D/g, ''), 10) || 1;

			await adminPb.collection('sprints').create({
				title: `Sprint ${sprintNum + 1}`,
				project: params.id,
				startDate: nextStart.toISOString().slice(0, 10),
				endDate: nextEnd.toISOString().slice(0, 10),
				status: 'planned'
			});
		} catch (err) {
			logError('finalizeSprint', err);
			return fail(500, { errors: { general: 'Erro ao finalizar sprint.' } });
		}

		return { success: true };
	},

	addParticipant: async ({ params, request, locals }) => {
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
		const userId = formData.get('userId') as string;
		const role = formData.get('role') as string;

		if (!userId) return fail(400, { errors: { general: 'Usuário não informado.' } });

		const participants = [...(project.participants || [])];
		if (!participants.includes(userId)) {
			participants.push(userId);
		}

		const responsaveis = [...(project.responsaveis || [])];
		if (role === 'responsavel' && !responsaveis.includes(userId)) {
			responsaveis.push(userId);
		}

		try {
			await adminPb.collection('projects').update(params.id, {
				participants,
				responsaveis
			});
		} catch (err) {
			logError('addParticipant', err);
			return fail(500, { errors: { general: 'Erro ao adicionar participante.' } });
		}

		return { success: true };
	},

	removeParticipant: async ({ params, request, locals }) => {
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
		const userId = formData.get('userId') as string;

		if (!userId) return fail(400, { errors: { general: 'Usuário não informado.' } });

		try {
			await adminPb.collection('projects').update(params.id, {
				participants: (project.participants || []).filter((id) => id !== userId),
				responsaveis: (project.responsaveis || []).filter((id) => id !== userId)
			});
		} catch (err) {
			logError('removeParticipant', err);
			return fail(500, { errors: { general: 'Erro ao remover participante.' } });
		}

		return { success: true };
	},

	deleteProject: async ({ params, locals }) => {
		if (!locals.user) return fail(401);

		const adminPb = await getAdminClient();
		let project: ProjectRecord;
		try {
			project = await adminPb.collection('projects').getOne<ProjectRecord>(params.id);
		} catch {
			return fail(404);
		}

		if (!canDeleteProject(locals.user, project)) return fail(403);

		try {
			await adminPb.collection('projects').delete(params.id);
		} catch (err) {
			logError('deleteProject', err);
			return fail(500, { errors: { general: 'Erro ao excluir projeto.' } });
		}

		throw redirect(303, '/projects');
	}
};
