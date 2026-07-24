import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAdminClient } from '$lib/server/pocketbaseAdmin';
import sanitizeHtml from 'sanitize-html';
import { TASK_LIST_SANITIZE_ATTRIBUTES, TASK_LIST_SANITIZE_TAGS } from '$lib/server/richTextSanitize';
import {
	canCreateCard,
	canUpdateCard,
	canDeleteCard,
	canManageColumns,
	canDeleteColumn,
	reorderPositions,
	recalculatePositions
} from '$lib/domain/kanbanAccess';
import {
	createColumnSchema,
	createCardSchema,
	updateCardSchema,
	moveCardSchema,
	addCommentSchema
} from '$lib/validation/kanbanSchemas';
import { canViewProject, canManageProject, isProjectParticipant } from '$lib/domain/projectAccess';
import { recordCardChanges, recordCardHistory } from '$lib/server/kanbanHistory';
import { buildKanbanPushPayload } from '$lib/domain/pushPayload';
import { sendSystemPush } from '$lib/server/webPush';
import {
	createKanbanNotification,
	createKanbanMovedNotification,
	createKanbanCommentedNotification,
	createKanbanDeletedNotification,
	resolveUserIdsToAuthIds
} from '$lib/server/notificationStore';
import { logError } from '$lib/server/logger';
import type {
	KanbanColumnRecord,
	KanbanCardRecord,
	KanbanCardCommentRecord
} from '$lib/server/kanbanRecord';
import type { ProjectRecord, SprintRecord } from '$lib/server/projectRecord';

export const load: PageServerLoad = async ({ locals, url, cookies }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const projectId = url.searchParams.get('project');
	if (!projectId) {
		const lastProject = cookies.get('lastKanbanProject');
		if (lastProject) {
			throw redirect(303, `/kanban?project=${lastProject}`);
		}
		const adminPb = await getAdminClient();
		const allProjects = await adminPb.collection('projects').getFullList<ProjectRecord>({
			sort: 'title',
			expand: 'participants'
		});
		const accessibleProjects = allProjects.filter((p) => canViewProject(locals.user, p));
		return {
			project: null,
			projects: accessibleProjects,
			sprints: [],
			activeSprint: null,
			plannedSprint: null,
			columns: [],
			cards: [],
			users: [],
			comments: [],
			history: [],
			token: locals.pb.authStore.token,
			canManageProject: false
		};
	}

	const adminPb = await getAdminClient();

	// Load project
	let project: ProjectRecord;
	try {
		project = await adminPb.collection('projects').getOne<ProjectRecord>(projectId, {
			expand: 'created_by,responsaveis,participants'
		});
	} catch {
		cookies.delete('lastKanbanProject', { path: '/kanban' });
		const allProjects = await adminPb.collection('projects').getFullList<ProjectRecord>({
			sort: 'title',
			expand: 'participants'
		});
		const accessibleProjects = allProjects.filter((p) => canViewProject(locals.user, p));
		return {
			project: null,
			projects: accessibleProjects,
			sprints: [],
			activeSprint: null,
			plannedSprint: null,
			columns: [],
			cards: [],
			users: [],
			comments: [],
			history: [],
			token: locals.pb.authStore.token,
			canManageProject: false
		};
	}

	if (!canViewProject(locals.user, project)) {
		cookies.delete('lastKanbanProject', { path: '/kanban' });
		const allProjects = await adminPb.collection('projects').getFullList<ProjectRecord>({
			sort: 'title',
			expand: 'participants'
		});
		const accessibleProjects = allProjects.filter((p) => canViewProject(locals.user, p));
		return {
			project: null,
			projects: accessibleProjects,
			sprints: [],
			activeSprint: null,
			plannedSprint: null,
			columns: [],
			cards: [],
			users: [],
			comments: [],
			history: [],
			token: locals.pb.authStore.token,
			canManageProject: false
		};
	}

	cookies.set('lastKanbanProject', projectId, {
		path: '/kanban',
		maxAge: 60 * 60 * 24 * 365,
		httpOnly: true,
		sameSite: 'lax',
		secure: false
	});

	// Load sprints for project
	const sprints = await adminPb.collection('sprints').getFullList<SprintRecord>({
		filter: adminPb.filter('project = {:id}', { id: projectId }),
		sort: '-created'
	});

	const activeSprint = sprints.find((s) => s.status === 'active') || null;
	const plannedSprint = sprints.find((s) => s.status === 'planned') || null;

	// Load columns for this project
	const columns = (await adminPb.collection('kanban_columns').getFullList({
		filter: adminPb.filter('project = {:projectId}', { projectId }),
		sort: 'position'
	})) as KanbanColumnRecord[];

	// Load cards: project match, and (sprint = active OR sprint = null)
	// Cards from finished sprints are hidden
	const activeSprintId = activeSprint?.id;
	let cardsFilter = adminPb.filter('project = {:projectId}', { projectId });
	if (activeSprintId) {
		cardsFilter = adminPb.filter(
			'project = {:projectId} && (sprint = {:sprintId} || sprint = null || sprint = "")',
			{ projectId, sprintId: activeSprintId }
		);
	} else {
		// No active sprint, only show cards without sprint
		cardsFilter = adminPb.filter(
			'project = {:projectId} && (sprint = null || sprint = "")',
			{ projectId }
		);
	}

	const cards = (await adminPb.collection('kanban_cards').getFullList({
		filter: cardsFilter,
		sort: 'position',
		expand: 'assignees,created_by,column'
	})) as KanbanCardRecord[];

	// Load users for assignee selection
	const users = await adminPb.collection('user').getFullList({
		sort: 'name'
	});

	// Load all comments (for all cards in this project)
	const commentCardIds = cards.map((c) => c.id);
	let comments: KanbanCardCommentRecord[] = [];
	if (commentCardIds.length > 0) {
		comments = (await adminPb.collection('kanban_card_comments').getFullList({
			filter: commentCardIds.map((id) => `card = "${id}"`).join(' || '),
			sort: 'created',
			expand: 'user'
		})) as KanbanCardCommentRecord[];
	}

	// Load history for cards in this project
	let history: any[] = [];
	if (commentCardIds.length > 0) {
		history = await adminPb.collection('kanban_card_history').getFullList({
			filter: commentCardIds.map((id) => `card = "${id}"`).join(' || '),
			sort: '-created',
			expand: 'user'
		});
	}

	// Load all projects for the project switcher
	const allProjects = await adminPb.collection('projects').getFullList<ProjectRecord>({
		sort: 'title',
		expand: 'participants'
	});
	const accessibleProjects = allProjects.filter((p) => canViewProject(locals.user, p));

	return {
		project,
		projects: accessibleProjects,
		sprints,
		activeSprint,
		plannedSprint,
		columns,
		cards,
		users,
		comments,
		history,
		token: locals.pb.authStore.token,
		canManageProject: canManageProject(locals.user, project)
	};
};

export const actions: Actions = {
	createColumn: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		if (!canManageColumns(locals.user)) return fail(403);

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const projectId = formData.get('projectId') as string;

		const validation = createColumnSchema.safeParse({ name, projectId });
		if (!validation.success) {
			return fail(400, { errors: validation.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();

		const columns = (await adminPb.collection('kanban_columns').getFullList({
			filter: adminPb.filter('project = {:projectId}', { projectId: validation.data.projectId }),
			sort: 'position'
		})) as KanbanColumnRecord[];

		const doneCol = columns.find((c) => c.type === 'done');
		const targetPosition = doneCol ? doneCol.position : columns.length;

		await adminPb.collection('kanban_columns').create({
			name: validation.data.name,
			position: targetPosition,
			type: 'custom',
			project: validation.data.projectId
		});

		if (doneCol) {
			await adminPb.collection('kanban_columns').update(doneCol.id, {
				position: targetPosition + 1
			});
		}

		return { success: true };
	},

	renameColumn: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		if (!canManageColumns(locals.user)) return fail(403);

		const formData = await request.formData();
		const columnId = formData.get('columnId') as string;
		const name = formData.get('name') as string;

		const validation = createColumnSchema.safeParse({ name, projectId: '' });
		if (!validation.success) {
			return fail(400, { errors: validation.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();
		let col: KanbanColumnRecord;
		try {
			col = (await adminPb.collection('kanban_columns').getOne(columnId)) as KanbanColumnRecord;
		} catch {
			return fail(404);
		}

		if (col.type !== 'custom') {
			return fail(403);
		}

		await adminPb.collection('kanban_columns').update(columnId, {
			name: validation.data.name
		});

		return { success: true };
	},

	moveColumn: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		if (!canManageColumns(locals.user)) return fail(403);

		const formData = await request.formData();
		const columnId = formData.get('columnId') as string;
		const newPosition = parseInt(formData.get('newPosition') as string, 10);

		if (isNaN(newPosition)) return fail(400);

		const adminPb = await getAdminClient();
		const col = await adminPb.collection('kanban_columns').getOne(columnId) as KanbanColumnRecord;
		const projectId = col.project;

		const columns = (await adminPb.collection('kanban_columns').getFullList({
			filter: adminPb.filter('project = {:projectId}', { projectId }),
			sort: 'position'
		})) as KanbanColumnRecord[];

		const target = columns.find((c) => c.id === columnId);
		if (!target) return fail(404);
		if (target.type !== 'custom') return fail(403);

		const moveableColumns = columns.filter((c) => c.type === 'custom');
		const targetIndex = Math.max(0, Math.min(newPosition - 1, moveableColumns.length - 1));

		const reordered = reorderPositions(moveableColumns, columnId, targetIndex);
		for (const column of reordered) {
			await adminPb.collection('kanban_columns').update(column.id, {
				position: column.position + 1
			});
		}

		return { success: true };
	},

	deleteColumn: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		if (!canManageColumns(locals.user)) return fail(403);

		const formData = await request.formData();
		const columnId = formData.get('columnId') as string;

		const adminPb = await getAdminClient();
		let col: KanbanColumnRecord;
		try {
			col = (await adminPb.collection('kanban_columns').getOne(columnId)) as KanbanColumnRecord;
		} catch {
			return fail(404);
		}

		if (!canDeleteColumn(locals.user, col)) return fail(403);

		const columns = (await adminPb.collection('kanban_columns').getFullList({
			filter: adminPb.filter('project = {:projectId}', { projectId: col.project }),
			sort: 'position'
		})) as KanbanColumnRecord[];

		const backlogCol = columns.find((c) => c.type === 'backlog');
		if (!backlogCol) return fail(500);

		const cardsInCol = (await adminPb.collection('kanban_cards').getFullList({
			filter: `column = "${columnId}"`,
			sort: 'position'
		})) as KanbanCardRecord[];

		const backlogCards = (await adminPb.collection('kanban_cards').getFullList({
			filter: `column = "${backlogCol.id}"`,
			sort: 'position'
		})) as KanbanCardRecord[];

		let startPos = backlogCards.length;
		for (const card of cardsInCol) {
			const oldCard = { ...card };
			await adminPb.collection('kanban_cards').update(card.id, {
				column: backlogCol.id,
				position: startPos
			});
			await recordCardChanges(card.id, locals.user.id, oldCard, {
				column: backlogCol.id,
				position: startPos
			});
			startPos++;
		}

		await adminPb.collection('kanban_columns').delete(columnId);

		const remainingMoveable = columns.filter((c) => c.id !== columnId && c.type === 'custom');
		const reorderedColumns = recalculatePositions(remainingMoveable);
		for (const column of reorderedColumns) {
			await adminPb.collection('kanban_columns').update(column.id, {
				position: column.position + 1
			});
		}

		const doneCol = columns.find((c) => c.type === 'done');
		if (doneCol) {
			await adminPb.collection('kanban_columns').update(doneCol.id, {
				position: reorderedColumns.length + 1
			});
		}

		return { success: true };
	},

	createCard: async ({ request, locals }) => {
		if (!locals.user) return fail(401);

		const formData = await request.formData();
		const title = formData.get('title') as string;
		const description = formData.get('description') as string;
		const columnId = formData.get('columnId') as string;
		const projectId = formData.get('projectId') as string;
		const sprintId = formData.get('sprintId') as string;
		const assigneeIds = formData.getAll('assigneeIds[]') as string[];
		const tagsString = formData.get('tags') as string;
		const dueDate = formData.get('dueDate') as string;
		const pointsRaw = formData.get('points');

		const tags = tagsString ? tagsString.split(',').map((t) => t.trim()).filter(Boolean) : [];
		const points = pointsRaw ? parseInt(pointsRaw as string, 10) : null;

		const validation = createCardSchema.safeParse({
			title,
			description: description
				? sanitizeHtml(description, {
						allowedTags: sanitizeHtml.defaults.allowedTags.concat(TASK_LIST_SANITIZE_TAGS),
						allowedAttributes: {
							...sanitizeHtml.defaults.allowedAttributes,
							...TASK_LIST_SANITIZE_ATTRIBUTES
						}
					})
				: '',
			columnId,
			projectId,
			sprintId: sprintId || null,
			assigneeIds,
			tags,
			dueDate: dueDate || null,
			points: isNaN(points as number) ? null : points
		});

		if (!validation.success) {
			return fail(400, { errors: validation.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();

		let createProject: ProjectRecord;
		try {
			createProject = await adminPb.collection('projects').getOne(validation.data.projectId);
		} catch {
			return fail(404);
		}
		if (!canViewProject(locals.user, createProject)) return fail(403);

		const existingCards = await adminPb.collection('kanban_cards').getFullList({
			filter: `column = "${validation.data.columnId}"`
		});

		const newCard = await adminPb.collection('kanban_cards').create({
			title: validation.data.title,
			description: validation.data.description,
			column: validation.data.columnId,
			project: validation.data.projectId,
			sprint: validation.data.sprintId || null,
			created_by: locals.user.id,
			assignees: validation.data.assigneeIds,
			position: existingCards.length,
			points: validation.data.points,
			tags: validation.data.tags,
			dueDate: validation.data.dueDate || null
		});

		await recordCardHistory(newCard.id, locals.user.id, 'created');

		const notifyAssigneeIds = validation.data.assigneeIds.filter((id) => id !== locals.user?.id);
		if (notifyAssigneeIds.length > 0) {
			const column = (await adminPb.collection('kanban_columns').getOne(validation.data.columnId)) as KanbanColumnRecord;

			createKanbanNotification(notifyAssigneeIds, newCard.title, column.name, newCard.id).catch(
				(err) => logError('kanban:createCard:notification', err)
			);

			const pushPayload = buildKanbanPushPayload({
				cardTitle: newCard.title,
				cardId: newCard.id,
				columnName: column.name,
				action: 'created'
			});
			if (pushPayload) {
				resolveUserIdsToAuthIds(notifyAssigneeIds)
					.then((authIdMap) => sendSystemPush([...authIdMap.values()], pushPayload))
					.catch((err) => logError('kanban:createCard:push', err));
			}
		}

		return { success: true };
	},

	updateCard: async ({ request, locals }) => {
		if (!locals.user) return fail(401);

		const formData = await request.formData();
		const cardId = formData.get('cardId') as string;
		const title = formData.get('title') as string;
		const description = formData.get('description') as string;
		const assigneeIds = formData.getAll('assigneeIds[]') as string[];
		const tagsString = formData.get('tags') as string;
		const dueDate = formData.get('dueDate') as string;
		const pointsRaw = formData.get('points');
		const sprintId = formData.get('sprintId') as string;

		const tags = tagsString ? tagsString.split(',').map((t) => t.trim()).filter(Boolean) : [];
		const points = pointsRaw ? parseInt(pointsRaw as string, 10) : null;

		const validation = updateCardSchema.safeParse({
			cardId,
			title,
			description: description
				? sanitizeHtml(description, {
						allowedTags: sanitizeHtml.defaults.allowedTags.concat(TASK_LIST_SANITIZE_TAGS),
						allowedAttributes: {
							...sanitizeHtml.defaults.allowedAttributes,
							...TASK_LIST_SANITIZE_ATTRIBUTES
						}
					})
				: undefined,
			assigneeIds,
			tags,
			dueDate: dueDate || null,
			points: isNaN(points as number) ? null : points,
			sprintId: sprintId || null
		});

		if (!validation.success) {
			return fail(400, { errors: validation.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();
		let oldCard: KanbanCardRecord;
		try {
			oldCard = (await adminPb.collection('kanban_cards').getOne(validation.data.cardId)) as KanbanCardRecord;
		} catch {
			return fail(404);
		}

		let updateProject: ProjectRecord;
		try {
			updateProject = await adminPb.collection('projects').getOne(oldCard.project);
		} catch {
			return fail(404);
		}
		if (!canViewProject(locals.user, updateProject)) return fail(403);

		const updateData: Record<string, any> = {};
		if (validation.data.title !== undefined) updateData.title = validation.data.title;
		if (validation.data.description !== undefined) updateData.description = validation.data.description;
		if (validation.data.assigneeIds !== undefined) updateData.assignees = validation.data.assigneeIds;
		if (validation.data.tags !== undefined) updateData.tags = validation.data.tags;
		if (validation.data.dueDate !== undefined) updateData.dueDate = validation.data.dueDate;
		if (validation.data.points !== undefined) updateData.points = validation.data.points;
		if (validation.data.sprintId !== undefined) updateData.sprint = validation.data.sprintId;

		await adminPb.collection('kanban_cards').update(validation.data.cardId, updateData);
		await recordCardChanges(validation.data.cardId, locals.user.id, oldCard, updateData);

		if (validation.data.assigneeIds !== undefined) {
			const newAssigneeIds = validation.data.assigneeIds.filter(
				(id) => !oldCard.assignees.includes(id) && id !== locals.user?.id
			);
			if (newAssigneeIds.length > 0) {
				const column = (await adminPb.collection('kanban_columns').getOne(oldCard.column)) as KanbanColumnRecord;
				const cardTitle = validation.data.title ?? oldCard.title;

				createKanbanNotification(newAssigneeIds, cardTitle, column.name, validation.data.cardId).catch(
					(err) => logError('kanban:updateCard:notification', err)
				);

				const pushPayload = buildKanbanPushPayload({
					cardTitle,
					cardId: validation.data.cardId,
					columnName: column.name,
					action: 'created'
				});
				if (pushPayload) {
					resolveUserIdsToAuthIds(newAssigneeIds)
						.then((authIdMap) => sendSystemPush([...authIdMap.values()], pushPayload))
						.catch((err) => logError('kanban:updateCard:push', err));
				}
			}
		}

		return { success: true };
	},

	moveCard: async ({ request, locals }) => {
		if (!locals.user) return fail(401);

		const formData = await request.formData();
		const cardId = formData.get('cardId') as string;
		const columnId = formData.get('columnId') as string;
		const position = parseInt(formData.get('position') as string, 10);

		const validation = moveCardSchema.safeParse({ cardId, columnId, position });
		if (!validation.success) {
			return fail(400, { errors: validation.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();
		let card: KanbanCardRecord;
		try {
			card = (await adminPb.collection('kanban_cards').getOne(validation.data.cardId)) as KanbanCardRecord;
		} catch {
			return fail(404);
		}

		let moveProject: ProjectRecord;
		try {
			moveProject = await adminPb.collection('projects').getOne(card.project);
		} catch {
			return fail(404);
		}
		if (!canViewProject(locals.user, moveProject)) return fail(403);

		const oldColumnId = card.column;
		const targetColumnId = validation.data.columnId;
		const targetPosition = validation.data.position;

		if (oldColumnId === targetColumnId) {
			const oldCard = { ...card };
			const cardsInCol = (await adminPb.collection('kanban_cards').getFullList({
				filter: `column = "${oldColumnId}"`,
				sort: 'position'
			})) as KanbanCardRecord[];

			const reordered = reorderPositions(cardsInCol, cardId, targetPosition);
			for (const c of reordered) {
				await adminPb.collection('kanban_cards').update(c.id, { position: c.position });
			}
			await recordCardChanges(cardId, locals.user.id, oldCard, { position: targetPosition });
		} else {
			const oldCard = { ...card };

			const oldColCards = (await adminPb.collection('kanban_cards').getFullList({
				filter: `column = "${oldColumnId}"`,
				sort: 'position'
			})) as KanbanCardRecord[];

			const oldColRemaining = oldColCards.filter((c) => c.id !== cardId);
			const recalculatedOld = recalculatePositions(oldColRemaining);
			for (const c of recalculatedOld) {
				await adminPb.collection('kanban_cards').update(c.id, { position: c.position });
			}

			const newColCards = (await adminPb.collection('kanban_cards').getFullList({
				filter: `column = "${targetColumnId}"`,
				sort: 'position'
			})) as KanbanCardRecord[];

			const cardToMoveWithInitialPos = { ...card, column: targetColumnId, position: targetPosition };
			const recalculatedNew = reorderPositions(
				[...newColCards, cardToMoveWithInitialPos],
				cardId,
				targetPosition
			);

			for (const c of recalculatedNew) {
				if (c.id === cardId) {
					await adminPb.collection('kanban_cards').update(c.id, {
						column: targetColumnId,
						position: c.position
					});
				} else {
					await adminPb.collection('kanban_cards').update(c.id, { position: c.position });
				}
			}

			await recordCardChanges(cardId, locals.user.id, oldCard, {
				column: targetColumnId,
				position: targetPosition
			});

			const notifyAssigneeIds = card.assignees.filter((id) => id !== locals.user?.id);
			if (notifyAssigneeIds.length > 0) {
				const newColumn = (await adminPb.collection('kanban_columns').getOne(targetColumnId)) as KanbanColumnRecord;
				const moverName = locals.user?.name ?? 'Alguém';

				createKanbanMovedNotification(
					notifyAssigneeIds, card.title, newColumn.name, card.id, moverName
				).catch((err) => logError('kanban:moveCard:notification', err));

				const pushPayload = buildKanbanPushPayload({
					cardTitle: card.title,
					cardId: card.id,
					columnName: newColumn.name,
					action: 'moved',
					movedByName: moverName
				});
				if (pushPayload) {
					resolveUserIdsToAuthIds(notifyAssigneeIds)
						.then((authIdMap) => sendSystemPush([...authIdMap.values()], pushPayload))
						.catch((err) => logError('kanban:moveCard:push', err));
				}
			}
		}

		return { success: true };
	},

	deleteCard: async ({ request, locals }) => {
		if (!locals.user) return fail(401);

		const formData = await request.formData();
		const cardId = formData.get('cardId') as string;

		const adminPb = await getAdminClient();
		let card: KanbanCardRecord;
		try {
			card = (await adminPb.collection('kanban_cards').getOne(cardId)) as KanbanCardRecord;
		} catch {
			return fail(404);
		}

		if (!canDeleteCard(locals.user.id, card)) return fail(403);

		const columnId = card.column;
		const cardTitle = card.title;
		const deleterName = locals.user.name ?? 'Alguém';

		const notifyAssigneeIds = card.assignees.filter((id) => id !== locals.user?.id);
		if (notifyAssigneeIds.length > 0) {
			createKanbanDeletedNotification(notifyAssigneeIds, cardTitle, deleterName).catch(
				(err) => logError('kanban:deleteCard:notification', err)
			);

			const pushPayload = buildKanbanPushPayload({ cardTitle, cardId, action: 'deleted' });
			if (pushPayload) {
				resolveUserIdsToAuthIds(notifyAssigneeIds)
					.then((authIdMap) => sendSystemPush([...authIdMap.values()], pushPayload))
					.catch((err) => logError('kanban:deleteCard:push', err));
			}
		}

		await adminPb.collection('kanban_cards').delete(cardId);

		const cardsInCol = (await adminPb.collection('kanban_cards').getFullList({
			filter: `column = "${columnId}"`,
			sort: 'position'
		})) as KanbanCardRecord[];

		const recalculated = recalculatePositions(cardsInCol);
		for (const c of recalculated) {
			await adminPb.collection('kanban_cards').update(c.id, { position: c.position });
		}

		return { success: true };
	},

	addComment: async ({ request, locals }) => {
		if (!locals.user) return fail(401);

		const formData = await request.formData();
		const cardId = formData.get('cardId') as string;
		const text = formData.get('text') as string;

		const validation = addCommentSchema.safeParse({ cardId, text });
		if (!validation.success) {
			return fail(400, { errors: validation.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();

		let commentCard: KanbanCardRecord;
		try {
			commentCard = (await adminPb.collection('kanban_cards').getOne(validation.data.cardId)) as KanbanCardRecord;
		} catch {
			return fail(404);
		}

		let commentProject: ProjectRecord;
		try {
			commentProject = await adminPb.collection('projects').getOne(commentCard.project);
		} catch {
			return fail(404);
		}
		if (!canViewProject(locals.user, commentProject)) return fail(403);

		try {
			await locals.pb.collection('kanban_card_comments').create({
				card: validation.data.cardId,
				user: locals.user.id,
				text: validation.data.text
			});
		} catch {
			return fail(500);
		}

		const notifyAssigneeIds = commentCard.assignees.filter((id) => id !== locals.user?.id);
		if (notifyAssigneeIds.length > 0) {
			createKanbanCommentedNotification(
				notifyAssigneeIds, commentCard.title, commentCard.id, locals.user.name ?? 'Alguém'
			).catch((err) => logError('kanban:addComment:notification', err));

			const pushPayload = buildKanbanPushPayload({
				cardTitle: commentCard.title,
				cardId: commentCard.id,
				action: 'commented',
				commenterName: locals.user.name ?? 'Alguém'
			});
			if (pushPayload) {
				resolveUserIdsToAuthIds(notifyAssigneeIds)
					.then((authIdMap) => sendSystemPush([...authIdMap.values()], pushPayload))
					.catch((err) => logError('kanban:addComment:push', err));
			}
		}

		return { success: true };
	},

	deleteComment: async ({ request, locals }) => {
		if (!locals.user) return fail(401);

		const formData = await request.formData();
		const commentId = formData.get('commentId') as string;

		try {
			const comment = await locals.pb.collection('kanban_card_comments').getOne(commentId);
			if (comment.user !== locals.user.id) return fail(403);
			await locals.pb.collection('kanban_card_comments').delete(commentId);
		} catch {
			return fail(404);
		}

		return { success: true };
	}
};
