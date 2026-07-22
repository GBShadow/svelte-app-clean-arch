import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createRoomSchema } from '$lib/validation/pokerSchemas';
import { fieldErrorsFrom } from '$lib/validation/formErrors';
import { getAdminClient } from '$lib/server/pocketbaseAdmin';
import { canViewProject } from '$lib/domain/projectAccess';
import type { PokerRoomRecord, PokerParticipantRecord } from '$lib/server/pokerRecord';
import type { ProjectRecord } from '$lib/server/projectRecord';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');

	const participations = await locals.pb
		.collection('poker_participants')
		.getFullList<PokerParticipantRecord>({
			filter: locals.pb.filter('user = {:userId} && has_left = false', { userId: locals.user?.id }),
			expand: 'room,room.created_by,room.project',
			sort: '-created'
		});

	const rooms = participations
		.map((p) => p.expand?.room)
		.filter((r): r is PokerRoomRecord => !!r);

	const adminPb = await getAdminClient();

	// Load projects for the room creation selector
	const allProjects = await adminPb.collection('projects').getFullList<ProjectRecord>({
		sort: 'title'
	});
	const projects = allProjects.filter((p) => canViewProject(locals.user, p));

	let globalTasks: any[] = [];
	try {
		globalTasks = await adminPb.collection('poker_tasks').getFullList({
			filter: 'is_global_backlog = true && room = null',
			sort: 'created'
		});
	} catch (e) {
		console.error('Falha ao buscar global tasks no load:', e);
	}

	return { rooms, globalTasks, projects };
};

export const actions: Actions = {
	createRoom: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');

		const formData = await request.formData();
		const validation = createRoomSchema.safeParse({
			name: formData.get('name'),
			projectId: formData.get('projectId')
		});

		const taskIds = formData.getAll('taskIds') as string[];

		if (!validation.success) {
			return fail(400, { errors: fieldErrorsFrom(validation.error) });
		}

		const adminPb = await getAdminClient();

		let room: PokerRoomRecord;
		try {
			room = await adminPb.collection('poker_rooms').create<PokerRoomRecord>({
				name: validation.data.name,
				project: validation.data.projectId,
				created_by: locals.user.id,
				status: 'open',
				revealed: false
			});

			await adminPb.collection('poker_participants').create<PokerParticipantRecord>({
				room: room.id,
				user: locals.user.id,
				role: 'admin',
				is_online: true,
				has_voted: false,
				has_left: false
			});

			for (const taskId of taskIds) {
				const task = await adminPb.collection('poker_tasks').getOne(taskId);
				if (task.is_global_backlog && !task.room) {
					await adminPb.collection('poker_tasks').update(taskId, {
						room: room.id
					});
				}
			}
		} catch (err) {
			console.error('Falha ao criar sala de poker:', err);
			return fail(500, { errors: { general: 'Não foi possível criar a sala. Tente novamente.' } });
		}

		throw redirect(303, `/poker/${room.id}`);
	}
};
