import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAdminClient } from '$lib/server/pocketbaseAdmin';
import sanitizeHtml from 'sanitize-html';
import { TASK_LIST_SANITIZE_ATTRIBUTES, TASK_LIST_SANITIZE_TAGS } from '$lib/server/richTextSanitize';
import {
	canViewRetro,
	canManageRetro,
	canParticipate,
	canModerate,
	isRetroFinalized,
	canManageColumns,
	reorderPositions,
	recalculatePositions
} from '$lib/domain/retroAccess';
import {
	createRetroSchema,
	createColumnSchema,
	renameColumnSchema,
	reorderColumnsSchema,
	deleteColumnSchema,
	createCardSchema,
	editCardSchema,
	deleteCardSchema,
	moveCardSchema,
	addParticipantSchema,
	removeParticipantSchema
} from '$lib/validation/retroSchemas';
import { canViewProject, canManageProject } from '$lib/domain/projectAccess';
import { generateEditToken, verifyEditToken } from '$lib/server/editToken';
import { createRetroFinalizedNotification } from '$lib/server/notificationStore';
import { logError } from '$lib/server/logger';
import type {
	RetroRecord,
	RetroColumnRecord,
	RetroCardRecord,
	RetroParticipantRecord
} from '$lib/server/retroRecord';
import type { ProjectRecord, SprintRecord } from '$lib/server/projectRecord';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(303, '/login');

	const { projectId, sprintId } = params;
	const adminPb = await getAdminClient();

	let project: ProjectRecord;
	try {
		project = await adminPb.collection('projects').getOne<ProjectRecord>(projectId, {
			expand: 'created_by,responsaveis,participants'
		});
	} catch {
		throw error(404, 'Projeto não encontrado');
	}

	if (!canViewProject(locals.user, project)) {
		throw error(404, 'Projeto não encontrado');
	}

	let sprint: SprintRecord;
	try {
		sprint = await adminPb.collection('sprints').getOne<SprintRecord>(sprintId);
	} catch {
		throw error(404, 'Sprint não encontrada');
	}

	if (sprint.project !== projectId) {
		throw error(404, 'Sprint não pertence a este projeto');
	}

	const retros = await adminPb.collection('retrospectives').getFullList({
		filter: adminPb.filter('project = {:projectId} && sprint = {:sprintId}', { projectId, sprintId })
	}) as unknown as RetroRecord[];

	const retro = retros.length > 0 ? retros[0] : null;

	let columns: RetroColumnRecord[] = [];
	let cards: RetroCardRecord[] = [];
	let participants: RetroParticipantRecord[] = [];

	if (retro) {
		columns = await adminPb.collection('retrospective_columns').getFullList({
			filter: adminPb.filter('retro = {:retroId}', { retroId: retro.id }),
			sort: 'position'
		}) as unknown as RetroColumnRecord[];

		cards = await adminPb.collection('retrospective_cards').getFullList({
			filter: adminPb.filter('retro = {:retroId}', { retroId: retro.id }),
			sort: 'position',
			expand: 'column'
		}) as unknown as RetroCardRecord[];

		// Strip edit_token_hash from all cards before sending to client
		cards = cards.map((c) => ({ ...c, edit_token_hash: null }));

		participants = await adminPb.collection('retrospective_participants').getFullList({
			filter: adminPb.filter('retro = {:retroId}', { retroId: retro.id }),
			expand: 'user'
		}) as unknown as RetroParticipantRecord[];
	}

	return {
		project,
		sprint,
		retro,
		columns,
		cards,
		participants,
		canManageRetro: canManageRetro(locals.user, project),
		canManageProject: canManageProject(locals.user, project),
		token: locals.pb.authStore.token
	};
};

export const actions: Actions = {
	createRetro: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401);

		const { projectId, sprintId } = params;
		const formData = await request.formData();
		const val = createRetroSchema.safeParse({ sprintId });

		if (!val.success) {
			return fail(400, { errors: val.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();

		let project: ProjectRecord;
		try {
			project = await adminPb.collection('projects').getOne(projectId);
		} catch {
			return fail(404);
		}

		if (!canManageRetro(locals.user, project)) return fail(403);

		const existing = await adminPb.collection('retrospectives').getFullList({
			filter: adminPb.filter('project = {:projectId} && sprint = {:sprintId}', { projectId, sprintId })
		});

		if (existing.length > 0) {
			return fail(400, { message: 'Já existe uma retrospectiva para esta sprint.' });
		}

		const retro = await adminPb.collection('retrospectives').create({
			project: projectId,
			sprint: val.data.sprintId,
			status: 'open',
			created_by: locals.user.id
		});

		const defaultColumns = [
			{ name: 'O que foi bom', position: 0, is_default: true },
			{ name: 'O que foi ruim', position: 1, is_default: true },
			{ name: 'A melhorar para a próxima sprint', position: 2, is_default: true }
		];

		for (const col of defaultColumns) {
			await adminPb.collection('retrospective_columns').create({
				retro: retro.id,
				...col
			});
		}

		// Creator is always a participant so they can create/move cards immediately
		await adminPb.collection('retrospective_participants').create({
			retro: retro.id,
			user: locals.user.id
		});

		throw redirect(303, `/projects/${projectId}/sprints/${sprintId}/retro`);
	},

	createColumn: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401);

		const { projectId, sprintId } = params;
		const formData = await request.formData();
		const name = formData.get('name') as string;

		const val = createColumnSchema.safeParse({ name });
		if (!val.success) {
			return fail(400, { errors: val.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();

		let project: ProjectRecord;
		try {
			project = await adminPb.collection('projects').getOne(projectId);
		} catch {
			return fail(404);
		}

		if (!canManageColumns(locals.user, project)) return fail(403);

		const retros = await adminPb.collection('retrospectives').getFullList({
			filter: adminPb.filter('project = {:projectId} && sprint = {:sprintId}', { projectId, sprintId })
		});

		if (retros.length === 0) return fail(404);
		const retro = retros[0] as unknown as RetroRecord;
		if (isRetroFinalized(retro)) return fail(403, { message: 'Retrospectiva já finalizada.' });

		const columns = await adminPb.collection('retrospective_columns').getFullList({
			filter: adminPb.filter('retro = {:retroId}', { retroId: retro.id }),
			sort: 'position'
		});

		await adminPb.collection('retrospective_columns').create({
			retro: retro.id,
			name: val.data.name,
			position: columns.length,
			is_default: false
		});

		return { success: true };
	},

	renameColumn: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401);

		const { projectId, sprintId } = params;
		const formData = await request.formData();
		const columnId = formData.get('columnId') as string;
		const name = formData.get('name') as string;

		const val = renameColumnSchema.safeParse({ columnId, name });
		if (!val.success) {
			return fail(400, { errors: val.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();

		let project: ProjectRecord;
		try {
			project = await adminPb.collection('projects').getOne(projectId);
		} catch {
			return fail(404);
		}

		if (!canManageColumns(locals.user, project)) return fail(403);

		const retros = await adminPb.collection('retrospectives').getFullList({
			filter: adminPb.filter('project = {:projectId} && sprint = {:sprintId}', { projectId, sprintId })
		});

		if (retros.length === 0) return fail(404);
		const retro = retros[0] as unknown as RetroRecord;
		if (isRetroFinalized(retro)) return fail(403, { message: 'Retrospectiva já finalizada.' });

		try {
			await adminPb.collection('retrospective_columns').update(val.data.columnId, {
				name: val.data.name
			});
		} catch {
			return fail(404);
		}

		return { success: true };
	},

	reorderColumns: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401);

		const { projectId, sprintId } = params;
		const formData = await request.formData();
		const orderedIdsRaw = formData.get('orderedIds') as string;
		let orderedIds: string[];
		try {
			orderedIds = JSON.parse(orderedIdsRaw);
		} catch {
			return fail(400);
		}

		const val = reorderColumnsSchema.safeParse({ orderedIds });
		if (!val.success) {
			return fail(400, { errors: val.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();

		let project: ProjectRecord;
		try {
			project = await adminPb.collection('projects').getOne(projectId);
		} catch {
			return fail(404);
		}

		if (!canManageColumns(locals.user, project)) return fail(403);

		const retros = await adminPb.collection('retrospectives').getFullList({
			filter: adminPb.filter('project = {:projectId} && sprint = {:sprintId}', { projectId, sprintId })
		});

		if (retros.length === 0) return fail(404);
		const retro = retros[0] as unknown as RetroRecord;
		if (isRetroFinalized(retro)) return fail(403, { message: 'Retrospectiva já finalizada.' });

		for (let i = 0; i < val.data.orderedIds.length; i++) {
			try {
				await adminPb.collection('retrospective_columns').update(val.data.orderedIds[i], {
					position: i
				});
			} catch {
				// Skip invalid IDs
			}
		}

		return { success: true };
	},

	deleteColumn: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401);

		const { projectId, sprintId } = params;
		const formData = await request.formData();
		const columnId = formData.get('columnId') as string;

		const val = deleteColumnSchema.safeParse({ columnId });
		if (!val.success) {
			return fail(400, { errors: val.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();

		let project: ProjectRecord;
		try {
			project = await adminPb.collection('projects').getOne(projectId);
		} catch {
			return fail(404);
		}

		if (!canManageColumns(locals.user, project)) return fail(403);

		const retros = await adminPb.collection('retrospectives').getFullList({
			filter: adminPb.filter('project = {:projectId} && sprint = {:sprintId}', { projectId, sprintId })
		});

		if (retros.length === 0) return fail(404);
		const retro = retros[0] as unknown as RetroRecord;
		if (isRetroFinalized(retro)) return fail(403, { message: 'Retrospectiva já finalizada.' });

		const cardsInCol = await adminPb.collection('retrospective_cards').getFullList({
			filter: `column = "${val.data.columnId}"`
		});

		if (cardsInCol.length > 0) {
			return fail(400, { message: 'Coluna precisa estar vazia para ser excluída.' });
		}

		try {
			await adminPb.collection('retrospective_columns').delete(val.data.columnId);
		} catch {
			return fail(404);
		}

		return { success: true };
	},

	createCard: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401);

		const { projectId, sprintId } = params;
		const formData = await request.formData();
		const columnId = formData.get('columnId') as string;
		const content = formData.get('content') as string;

		const val = createCardSchema.safeParse({
			columnId,
			content: sanitizeHtml(content, {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat(TASK_LIST_SANITIZE_TAGS),
				allowedAttributes: {
					...sanitizeHtml.defaults.allowedAttributes,
					...TASK_LIST_SANITIZE_ATTRIBUTES
				}
			})
		});

		if (!val.success) {
			return fail(400, { errors: val.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();

		let project: ProjectRecord;
		try {
			project = await adminPb.collection('projects').getOne(projectId);
		} catch {
			return fail(404);
		}

		if (!canViewProject(locals.user, project)) return fail(403);

		const retros = await adminPb.collection('retrospectives').getFullList({
			filter: adminPb.filter('project = {:projectId} && sprint = {:sprintId}', { projectId, sprintId })
		});

		if (retros.length === 0) return fail(404);
		const retro = retros[0] as unknown as RetroRecord;
		if (isRetroFinalized(retro)) return fail(403, { message: 'Retrospectiva já finalizada.' });

		const participants = await adminPb.collection('retrospective_participants').getFullList({
			filter: adminPb.filter('retro = {:retroId}', { retroId: retro.id })
		});

		const isParticipant = canParticipate(
			locals.user,
			participants as unknown as { user: string }[]
		);
		if (!isParticipant && !canManageRetro(locals.user, project)) return fail(403);

		const existingCards = await adminPb.collection('retrospective_cards').getFullList({
			filter: `column = "${val.data.columnId}"`
		});

		const { token, hash } = generateEditToken();

		const card = await adminPb.collection('retrospective_cards').create({
			retro: retro.id,
			column: val.data.columnId,
			content: val.data.content,
			position: existingCards.length,
			edit_token_hash: hash
		});

		return { cardId: card.id, editToken: token };
	},

	editCard: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401);

		const { projectId, sprintId } = params;
		const formData = await request.formData();
		const cardId = formData.get('cardId') as string;
		const content = formData.get('content') as string;
		const editToken = formData.get('editToken') as string;

		const val = editCardSchema.safeParse({
			cardId,
			content: sanitizeHtml(content, {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat(TASK_LIST_SANITIZE_TAGS),
				allowedAttributes: {
					...sanitizeHtml.defaults.allowedAttributes,
					...TASK_LIST_SANITIZE_ATTRIBUTES
				}
			}),
			editToken
		});

		if (!val.success) {
			return fail(400, { errors: val.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();

		let project: ProjectRecord;
		try {
			project = await adminPb.collection('projects').getOne(projectId);
		} catch {
			return fail(404);
		}

		if (!canViewProject(locals.user, project)) return fail(403);

		const retros = await adminPb.collection('retrospectives').getFullList({
			filter: adminPb.filter('project = {:projectId} && sprint = {:sprintId}', { projectId, sprintId })
		});

		if (retros.length === 0) return fail(404);
		const retro = retros[0] as unknown as RetroRecord;
		if (isRetroFinalized(retro)) return fail(403, { message: 'Retrospectiva já finalizada.' });

		let card: RetroCardRecord;
		try {
			card = await adminPb.collection('retrospective_cards').getOne(val.data.cardId) as RetroCardRecord;
		} catch {
			return fail(404);
		}

		if (!verifyEditToken(val.data.editToken, card.edit_token_hash)) {
			return fail(403, { message: 'Token de edição inválido.' });
		}

		await adminPb.collection('retrospective_cards').update(val.data.cardId, {
			content: val.data.content
		});

		return { success: true };
	},

	deleteCard: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401);

		const { projectId, sprintId } = params;
		const formData = await request.formData();
		const cardId = formData.get('cardId') as string;
		const editToken = formData.get('editToken') as string | null;

		const val = deleteCardSchema.safeParse({ cardId, editToken: editToken ?? undefined });
		if (!val.success) {
			return fail(400, { errors: val.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();

		let project: ProjectRecord;
		try {
			project = await adminPb.collection('projects').getOne(projectId);
		} catch {
			return fail(404);
		}

		if (!canViewProject(locals.user, project)) return fail(403);

		const retros = await adminPb.collection('retrospectives').getFullList({
			filter: adminPb.filter('project = {:projectId} && sprint = {:sprintId}', { projectId, sprintId })
		});

		if (retros.length === 0) return fail(404);
		const retro = retros[0] as unknown as RetroRecord;
		if (isRetroFinalized(retro)) return fail(403, { message: 'Retrospectiva já finalizada.' });

		let card: RetroCardRecord;
		try {
			card = await adminPb.collection('retrospective_cards').getOne(val.data.cardId) as RetroCardRecord;
		} catch {
			return fail(404);
		}

		const isModerator = canModerate(locals.user, project);
		const hasValidToken = val.data.editToken && verifyEditToken(val.data.editToken, card.edit_token_hash);

		if (!isModerator && !hasValidToken) {
			return fail(403, { message: 'Sem permissão para excluir este card.' });
		}

		const columnId = card.column;
		await adminPb.collection('retrospective_cards').delete(val.data.cardId);

		const cardsInCol = await adminPb.collection('retrospective_cards').getFullList({
			filter: `column = "${columnId}"`,
			sort: 'position'
		}) as RetroCardRecord[];

		const recalculated = recalculatePositions(cardsInCol);
		for (const c of recalculated) {
			await adminPb.collection('retrospective_cards').update(c.id, { position: c.position });
		}

		return { success: true };
	},

	moveCard: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401);

		const { projectId, sprintId } = params;
		const formData = await request.formData();
		const cardId = formData.get('cardId') as string;
		const columnId = formData.get('columnId') as string;
		const position = parseInt(formData.get('position') as string, 10);

		const val = moveCardSchema.safeParse({ cardId, columnId, position });
		if (!val.success) {
			return fail(400, { errors: val.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();

		let project: ProjectRecord;
		try {
			project = await adminPb.collection('projects').getOne(projectId);
		} catch {
			return fail(404);
		}

		if (!canViewProject(locals.user, project)) return fail(403);

		const retros = await adminPb.collection('retrospectives').getFullList({
			filter: adminPb.filter('project = {:projectId} && sprint = {:sprintId}', { projectId, sprintId })
		});

		if (retros.length === 0) return fail(404);
		const retro = retros[0] as unknown as RetroRecord;
		if (isRetroFinalized(retro)) return fail(403, { message: 'Retrospectiva já finalizada.' });

		const participants = await adminPb.collection('retrospective_participants').getFullList({
			filter: adminPb.filter('retro = {:retroId}', { retroId: retro.id })
		});

		const isParticipant = canParticipate(
			locals.user,
			participants as unknown as { user: string }[]
		);
		if (!isParticipant && !canManageRetro(locals.user, project)) return fail(403);

		let card: RetroCardRecord;
		try {
			card = await adminPb.collection('retrospective_cards').getOne(val.data.cardId) as RetroCardRecord;
		} catch {
			return fail(404);
		}

		const oldColumnId = card.column;
		const targetColumnId = val.data.columnId;
		const targetPosition = val.data.position;

		if (oldColumnId === targetColumnId) {
			const cardsInCol = await adminPb.collection('retrospective_cards').getFullList({
				filter: `column = "${oldColumnId}"`,
				sort: 'position'
			}) as RetroCardRecord[];

			const reordered = reorderPositions(cardsInCol, val.data.cardId, targetPosition);
			for (const c of reordered) {
				await adminPb.collection('retrospective_cards').update(c.id, { position: c.position });
			}
		} else {
			const oldColCards = await adminPb.collection('retrospective_cards').getFullList({
				filter: `column = "${oldColumnId}"`,
				sort: 'position'
			}) as RetroCardRecord[];

			const oldColRemaining = oldColCards.filter((c) => c.id !== val.data.cardId);
			const recalculatedOld = recalculatePositions(oldColRemaining);
			for (const c of recalculatedOld) {
				await adminPb.collection('retrospective_cards').update(c.id, { position: c.position });
			}

			const newColCards = await adminPb.collection('retrospective_cards').getFullList({
				filter: `column = "${targetColumnId}"`,
				sort: 'position'
			}) as RetroCardRecord[];

			const cardToMove = { ...card, column: targetColumnId, position: targetPosition };
			const recalculatedNew = reorderPositions(
				[...newColCards, cardToMove],
				val.data.cardId,
				targetPosition
			);

			for (const c of recalculatedNew) {
				if (c.id === val.data.cardId) {
					await adminPb.collection('retrospective_cards').update(c.id, {
						column: targetColumnId,
						position: c.position
					});
				} else {
					await adminPb.collection('retrospective_cards').update(c.id, { position: c.position });
				}
			}
		}

		return { success: true };
	},

	addParticipant: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401);

		const { projectId, sprintId } = params;
		const formData = await request.formData();
		const userId = formData.get('userId') as string;

		const val = addParticipantSchema.safeParse({ userId });
		if (!val.success) {
			return fail(400, { errors: val.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();

		let project: ProjectRecord;
		try {
			project = await adminPb.collection('projects').getOne(projectId);
		} catch {
			return fail(404);
		}

		if (!canManageRetro(locals.user, project)) return fail(403);

		const retros = await adminPb.collection('retrospectives').getFullList({
			filter: adminPb.filter('project = {:projectId} && sprint = {:sprintId}', { projectId, sprintId })
		});

		if (retros.length === 0) return fail(404);
		const retro = retros[0] as unknown as RetroRecord;

		if (isRetroFinalized(retro)) return fail(403, { message: 'Retrospectiva já finalizada.' });

		const existing = await adminPb.collection('retrospective_participants').getFullList({
			filter: adminPb.filter('retro = {:retroId} && user = {:userId}', {
				retroId: retro.id,
				userId: val.data.userId
			})
		});

		if (existing.length > 0) {
			return fail(400, { message: 'Usuário já é participante.' });
		}

		await adminPb.collection('retrospective_participants').create({
			retro: retro.id,
			user: val.data.userId
		});

		return { success: true };
	},

	removeParticipant: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401);

		const { projectId, sprintId } = params;
		const formData = await request.formData();
		const participantId = formData.get('participantId') as string;

		const val = removeParticipantSchema.safeParse({ participantId });
		if (!val.success) {
			return fail(400, { errors: val.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();

		let project: ProjectRecord;
		try {
			project = await adminPb.collection('projects').getOne(projectId);
		} catch {
			return fail(404);
		}

		if (!canManageRetro(locals.user, project)) return fail(403);

		try {
			await adminPb.collection('retrospective_participants').delete(val.data.participantId);
		} catch {
			return fail(404);
		}

		return { success: true };
	},

	finalize: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401);

		const { projectId, sprintId } = params;

		const adminPb = await getAdminClient();

		let project: ProjectRecord;
		try {
			project = await adminPb.collection('projects').getOne(projectId);
		} catch {
			return fail(404);
		}

		if (!canManageRetro(locals.user, project)) return fail(403);

		const retros = await adminPb.collection('retrospectives').getFullList({
			filter: adminPb.filter('project = {:projectId} && sprint = {:sprintId}', { projectId, sprintId })
		});

		if (retros.length === 0) return fail(404);
		const retro = retros[0] as unknown as RetroRecord;

		if (isRetroFinalized(retro)) return fail(400, { message: 'Retrospectiva já finalizada.' });

		await adminPb.collection('retrospectives').update(retro.id, {
			status: 'finalized',
			finalized_at: new Date().toISOString(),
			finalized_by: locals.user.id
		});

		const cards = await adminPb.collection('retrospective_cards').getFullList({
			filter: `retro = "${retro.id}"`
		});

		for (const card of cards) {
			await adminPb.collection('retrospective_cards').update(card.id, {
				edit_token_hash: null
			});
		}

		// Notify all participants
		const members = await adminPb.collection('retrospective_participants').getFullList({
			filter: adminPb.filter('retro = {:retroId}', { retroId: retro.id })
		}) as unknown as { user: string }[];
		const memberIds = members.map((m) => m.user);
		if (memberIds.length > 0) {
			createRetroFinalizedNotification(
				memberIds,
				project.title,
				project.title,
				projectId,
				sprintId
			).catch((err) => logError('retro:finalize:notification', err));
		}

		return { success: true };
	}
};
