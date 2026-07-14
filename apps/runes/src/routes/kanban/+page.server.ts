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
import { recordCardChanges, recordCardHistory } from '$lib/server/kanbanHistory';
import type {
	KanbanColumnRecord,
	KanbanCardRecord,
	KanbanCardCommentRecord
} from '$lib/server/kanbanRecord';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const adminPb = await getAdminClient();

	// Busca as colunas ordenadas por posição
	const columns = (await adminPb.collection('kanban_columns').getFullList({
		sort: 'position'
	})) as KanbanColumnRecord[];

	// Busca os cards com assignees expandidos
	const cards = (await adminPb.collection('kanban_cards').getFullList({
		sort: 'position',
		expand: 'assignees,created_by,column'
	})) as KanbanCardRecord[];

	// Busca a lista de usuários para atribuição de responsáveis
	const users = await adminPb.collection('user').getFullList({
		sort: 'name'
	});

	// Busca os comentários expandindo autor
	const comments = (await adminPb.collection('kanban_card_comments').getFullList({
		sort: 'created',
		expand: 'user'
	})) as KanbanCardCommentRecord[];

	// Busca o histórico do Kanban ordenado por data descendente
	const history = await adminPb.collection('kanban_card_history').getFullList({
		sort: '-created',
		expand: 'user'
	});

	return {
		columns,
		cards,
		users,
		comments,
		history,
		token: locals.pb.authStore.token
	};
};

export const actions: Actions = {
	createColumn: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		if (!canManageColumns(locals.user)) return fail(403);

		const formData = await request.formData();
		const name = formData.get('name') as string;

		const validation = createColumnSchema.safeParse({ name });
		if (!validation.success) {
			return fail(400, { errors: validation.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();

		// Busca as colunas existentes para posicionar a nova antes da coluna "done" (Feito)
		const columns = (await adminPb.collection('kanban_columns').getFullList({
			sort: 'position'
		})) as KanbanColumnRecord[];

		const doneCol = columns.find((c) => c.type === 'done');
		const targetPosition = doneCol ? doneCol.position : columns.length;

		// Cria a nova coluna customizada
		await adminPb.collection('kanban_columns').create({
			name: validation.data.name,
			position: targetPosition,
			type: 'custom'
		});

		// Se existia uma coluna "done", desloca ela para a direita
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

		const validation = createColumnSchema.safeParse({ name });
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
			return fail(403); // Colunas padrão não podem ser renomeadas
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
		const columns = (await adminPb.collection('kanban_columns').getFullList({
			sort: 'position'
		})) as KanbanColumnRecord[];

		const col = columns.find((c) => c.id === columnId);
		if (!col) return fail(404);

		if (col.type !== 'custom') {
			return fail(403); // Colunas padrão não podem ser movidas
		}

		// Filtra as colunas que podem se mover (tipo "custom")
		const moveableColumns = columns.filter((c) => c.type === 'custom');
		
		// newPosition vem do client. Vamos mapear para o index do array de moveableColumns
		// Lembrando que Aguardando (backlog) está na pos 0, e Feito (done) está no final.
		// As custom columns ocupam posições 1 até N.
		const targetIndex = Math.max(0, Math.min(newPosition - 1, moveableColumns.length - 1));

		const reordered = reorderPositions(moveableColumns, columnId, targetIndex);

		// Atualiza as posições no banco deslocando por +1
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

		if (!canDeleteColumn(locals.user, col)) {
			return fail(403);
		}

		// Busca a coluna "Aguardando" para onde os cards órfãos serão jogados
		const columns = (await adminPb.collection('kanban_columns').getFullList({
			sort: 'position'
		})) as KanbanColumnRecord[];

		const backlogCol = columns.find((c) => c.type === 'backlog');
		if (!backlogCol) {
			return fail(500); // Backlog sumiu?
		}

		// Busca todos os cards da coluna que será deletada
		const cardsInCol = (await adminPb.collection('kanban_cards').getFullList({
			filter: `column = "${columnId}"`,
			sort: 'position'
		})) as KanbanCardRecord[];

		// Busca os cards do backlog para saber a partir de qual posição enfiar os órfãos
		const backlogCards = (await adminPb.collection('kanban_cards').getFullList({
			filter: `column = "${backlogCol.id}"`,
			sort: 'position'
		})) as KanbanCardRecord[];

		// Move os cards órfãos para o backlog
		let startPos = backlogCards.length;
		for (const card of cardsInCol) {
			const oldCard = { ...card };
			await adminPb.collection('kanban_cards').update(card.id, {
				column: backlogCol.id,
				position: startPos
			});
			// Registra a mudança de coluna e de posição no histórico
			await recordCardChanges(card.id, locals.user.id, oldCard, {
				column: backlogCol.id,
				position: startPos
			});
			startPos++;
		}

		// Deleta a coluna
		await adminPb.collection('kanban_columns').delete(columnId);

		// Recalcula a posição das demais colunas customizadas
		const remainingMoveable = columns
			.filter((c) => c.id !== columnId && c.type === 'custom');
		
		const reorderedColumns = recalculatePositions(remainingMoveable);
		for (const column of reorderedColumns) {
			await adminPb.collection('kanban_columns').update(column.id, {
				position: column.position + 1
			});
		}

		// Ajusta a posição da coluna "done" (Feito)
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
		if (!canCreateCard(locals.user.id)) return fail(403);

		const formData = await request.formData();
		const title = formData.get('title') as string;
		const description = formData.get('description') as string;
		const columnId = formData.get('columnId') as string;
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
			assigneeIds,
			tags,
			dueDate: dueDate || null,
			points: isNaN(points as number) ? null : points
		});

		if (!validation.success) {
			return fail(400, { errors: validation.error.flatten().fieldErrors });
		}

		const adminPb = await getAdminClient();

		// Conta quantos cards já existem na coluna alvo para posicionar o novo no final
		const existingCards = await adminPb.collection('kanban_cards').getFullList({
			filter: `column = "${validation.data.columnId}"`
		});

		const newCard = await adminPb.collection('kanban_cards').create({
			title: validation.data.title,
			description: validation.data.description,
			column: validation.data.columnId,
			created_by: locals.user.id,
			assignees: validation.data.assigneeIds,
			position: existingCards.length,
			points: validation.data.points,
			tags: validation.data.tags,
			dueDate: validation.data.dueDate || null
		});

		// Registra no histórico que o card foi criado
		await recordCardHistory(newCard.id, locals.user.id, 'created');

		return { success: true };
	},

	updateCard: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		if (!canUpdateCard(locals.user.id)) return fail(403);

		const formData = await request.formData();
		const cardId = formData.get('cardId') as string;
		const title = formData.get('title') as string;
		const description = formData.get('description') as string;
		const assigneeIds = formData.getAll('assigneeIds[]') as string[];
		const tagsString = formData.get('tags') as string;
		const dueDate = formData.get('dueDate') as string;
		const pointsRaw = formData.get('points');

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
			points: isNaN(points as number) ? null : points
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

		const updateData: Record<string, any> = {};
		if (validation.data.title !== undefined) updateData.title = validation.data.title;
		if (validation.data.description !== undefined) updateData.description = validation.data.description;
		if (validation.data.assigneeIds !== undefined) updateData.assignees = validation.data.assigneeIds;
		if (validation.data.tags !== undefined) updateData.tags = validation.data.tags;
		if (validation.data.dueDate !== undefined) updateData.dueDate = validation.data.dueDate;
		if (validation.data.points !== undefined) updateData.points = validation.data.points;

		await adminPb.collection('kanban_cards').update(validation.data.cardId, updateData);

		// Registra as alterações no histórico
		await recordCardChanges(validation.data.cardId, locals.user.id, oldCard, updateData);

		return { success: true };
	},

	moveCard: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		if (!canUpdateCard(locals.user.id)) return fail(403);

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

		const oldColumnId = card.column;
		const targetColumnId = validation.data.columnId;
		const targetPosition = validation.data.position;

		if (oldColumnId === targetColumnId) {
			// Movimentação interna na mesma coluna
			const oldCard = { ...card };
			const cardsInCol = (await adminPb.collection('kanban_cards').getFullList({
				filter: `column = "${oldColumnId}"`,
				sort: 'position'
			})) as KanbanCardRecord[];

			const reordered = reorderPositions(cardsInCol, cardId, targetPosition);
			for (const c of reordered) {
				await adminPb.collection('kanban_cards').update(c.id, {
					position: c.position
				});
			}

			// Registra a mudança de posição se alterada
			await recordCardChanges(cardId, locals.user.id, oldCard, {
				position: targetPosition
			});
		} else {
			// Movimentação entre colunas diferentes
			const oldCard = { ...card };

			// 1. Remove da antiga coluna e reordena os restantes
			const oldColCards = (await adminPb.collection('kanban_cards').getFullList({
				filter: `column = "${oldColumnId}"`,
				sort: 'position'
			})) as KanbanCardRecord[];

			const oldColRemaining = oldColCards.filter((c) => c.id !== cardId);
			const recalculatedOld = recalculatePositions(oldColRemaining);
			for (const c of recalculatedOld) {
				await adminPb.collection('kanban_cards').update(c.id, {
					position: c.position
				});
			}

			// 2. Insere na nova coluna e reordena todos
			const newColCards = (await adminPb.collection('kanban_cards').getFullList({
				filter: `column = "${targetColumnId}"`,
				sort: 'position'
			})) as KanbanCardRecord[];

			// Força a posição inicial do card movido antes de passar ao helper
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
					await adminPb.collection('kanban_cards').update(c.id, {
						position: c.position
					});
				}
			}

			// Registra no histórico a mudança de coluna e posição
			await recordCardChanges(cardId, locals.user.id, oldCard, {
				column: targetColumnId,
				position: targetPosition
			});
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

		if (!canDeleteCard(locals.user.id, card)) {
			return fail(403);
		}

		const columnId = card.column;

		// Deleta o card
		await adminPb.collection('kanban_cards').delete(cardId);

		// Recalcula as posições dos cards restantes na coluna
		const cardsInCol = (await adminPb.collection('kanban_cards').getFullList({
			filter: `column = "${columnId}"`,
			sort: 'position'
		})) as KanbanCardRecord[];

		const recalculated = recalculatePositions(cardsInCol);
		for (const c of recalculated) {
			await adminPb.collection('kanban_cards').update(c.id, {
				position: c.position
			});
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

		// Comentários podem ser criados via locals.pb direto pois a API Rule permite
		try {
			await locals.pb.collection('kanban_card_comments').create({
				card: validation.data.cardId,
				user: locals.user.id,
				text: validation.data.text
			});
		} catch {
			return fail(500);
		}

		return { success: true };
	},

	deleteComment: async ({ request, locals }) => {
		if (!locals.user) return fail(401);

		const formData = await request.formData();
		const commentId = formData.get('commentId') as string;

		try {
			const comment = await locals.pb.collection('kanban_card_comments').getOne(commentId);
			if (comment.user !== locals.user.id) {
				return fail(403);
			}
			await locals.pb.collection('kanban_card_comments').delete(commentId);
		} catch {
			return fail(404);
		}

		return { success: true };
	}
};
