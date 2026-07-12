import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAdminClient } from '$lib/server/pocketbaseAdmin';
import { voteSchema, createTaskSchema, changeRoleSchema, setFinalPointsSchema } from '$lib/validation/pokerSchemas';
import { fieldErrorsFrom } from '$lib/validation/formErrors';
import { canVote, canReveal, canManageRoom } from '$lib/domain/planningPokerAccess';
import sanitizeHtml from 'sanitize-html';
import type {
	PokerRoomRecord,
	PokerParticipantRecord,
	PokerTaskRecord,
	PokerVoteRecord
} from '$lib/server/pokerRecord';
import type { UserRecord } from '$lib/server/userRecord';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const { roomId } = params;

	try {
		// 1. Busca a sala
		const room = await locals.pb.collection('poker_rooms').getOne<PokerRoomRecord>(roomId, {
			expand: 'created_by'
		});

		// 2. Busca participantes ativos
		const participants = await locals.pb
			.collection('poker_participants')
			.getFullList<PokerParticipantRecord>({
				filter: locals.pb.filter('room = {:roomId} && has_left = false', { roomId }),
				expand: 'user'
			});

		// 3. Auto-join caso o usuário não esteja na sala
		const currentUserId = locals.user.id;
		let myParticipation = participants.find((p) => p.user === currentUserId);

		if (!myParticipation) {
			// Não é participante, cria um (usa o cliente admin pois createRule permite apenas voter e offline inicialmente)
			const adminPb = await getAdminClient();
			myParticipation = await adminPb.collection('poker_participants').create<PokerParticipantRecord>({
				room: roomId,
				user: currentUserId,
				role: 'voter',
				is_online: true,
				has_voted: false,
				has_left: false
			});
			// Faz re-load dos participantes para incluir o novo com o expand correto
			const freshParticipants = await locals.pb
				.collection('poker_participants')
				.getFullList<PokerParticipantRecord>({
					filter: locals.pb.filter('room = {:roomId} && has_left = false', { roomId }),
					expand: 'user'
				});
			participants.splice(0, participants.length, ...freshParticipants);
		} else if (myParticipation.has_left) {
			// Reativa a participação
			const adminPb = await getAdminClient();
			myParticipation = await adminPb
				.collection('poker_participants')
				.update<PokerParticipantRecord>(myParticipation.id, {
					has_left: false,
					is_online: true
				});
			const freshParticipants = await locals.pb
				.collection('poker_participants')
				.getFullList<PokerParticipantRecord>({
					filter: locals.pb.filter('room = {:roomId} && has_left = false', { roomId }),
					expand: 'user'
				});
			participants.splice(0, participants.length, ...freshParticipants);
		}

		// 4. Busca tasks da sala
		const tasks = await locals.pb.collection('poker_tasks').getFullList<PokerTaskRecord>({
			filter: locals.pb.filter('room = {:roomId}', { roomId }),
			sort: 'created'
		});

		// 5. Busca os votos da rodada atual
		const votes = await locals.pb.collection('poker_votes').getFullList<PokerVoteRecord>({
			filter: locals.pb.filter('room = {:roomId} && task = {:taskId}', {
				roomId,
				taskId: room.current_task || ''
			})
		});

		// 6. Busca todos os usuários cadastrados (para listagem e convite)
		const users = await locals.pb.collection('user').getFullList<UserRecord>({
			sort: 'name'
		});

		return {
			room,
			participants,
			tasks,
			votes,
			users,
			pbToken: locals.pb.authStore.token,
			pbRecord: locals.pb.authStore.record
		};
	} catch (err) {
		console.error('Falha ao carregar sala de poker:', err);
		throw redirect(303, '/poker');
	}
};

export const actions: Actions = {
	vote: async ({ params, request, locals }) => {
		const { roomId } = params;
		const formData = await request.formData();
		const validation = voteSchema.safeParse({ value: formData.get('value') });

		if (!validation.success) {
			return fail(400, { errors: fieldErrorsFrom(validation.error) });
		}

		const adminPb = await getAdminClient();

		try {
			// Verifica se é participante e sua role
			const participant = await adminPb
				.collection('poker_participants')
				.getFirstListItem<PokerParticipantRecord>(
					adminPb.filter('room = {:roomId} && user = {:userId} && has_left = false', {
						roomId,
						userId: locals.user?.id
					})
				);

			const room = await adminPb.collection('poker_rooms').getOne<PokerRoomRecord>(roomId);

			if (!canVote(participant.role, room.revealed)) {
				return fail(403, { errors: { general: 'Você não pode votar nesta rodada.' } });
			}

			if (!room.current_task) {
				return fail(400, { errors: { general: 'Nenhuma task selecionada para votação.' } });
			}

			// Salva ou atualiza o voto
			let existingVote: PokerVoteRecord | null = null;
			try {
				existingVote = await adminPb
					.collection('poker_votes')
					.getFirstListItem<PokerVoteRecord>(
						adminPb.filter('room = {:roomId} && task = {:taskId} && user = {:userId}', {
							roomId,
							taskId: room.current_task,
							userId: locals.user?.id
						})
					);
			} catch {}

			if (existingVote) {
				await adminPb.collection('poker_votes').update(existingVote.id, {
					value: validation.data.value
				});
			} else {
				await adminPb.collection('poker_votes').create({
					room: roomId,
					task: room.current_task,
					user: locals.user?.id,
					value: validation.data.value
				});
			}

			// Marca que o participante votou
			await adminPb.collection('poker_participants').update(participant.id, {
				has_voted: true
			});
		} catch (err) {
			console.error('Erro ao votar:', err);
			return fail(500, { errors: { general: 'Não foi possível registrar o voto.' } });
		}

		return { success: true };
	},

	reveal: async ({ params, locals }) => {
		const { roomId } = params;
		const adminPb = await getAdminClient();

		try {
			const participant = await adminPb
				.collection('poker_participants')
				.getFirstListItem<PokerParticipantRecord>(
					adminPb.filter('room = {:roomId} && user = {:userId} && has_left = false', {
						roomId,
						userId: locals.user?.id
					})
				);

			const room = await adminPb.collection('poker_rooms').getOne<PokerRoomRecord>(roomId);

			// Verifica se todos votaram
			const votes = await adminPb.collection('poker_votes').getFullList<PokerVoteRecord>({
				filter: adminPb.filter('room = {:roomId} && task = {:taskId}', {
					roomId,
					taskId: room.current_task || ''
				})
			});
			const participants = await adminPb
				.collection('poker_participants')
				.getFullList<PokerParticipantRecord>({
					filter: adminPb.filter('room = {:roomId} && has_left = false', { roomId })
				});

			const activeVoters = participants.filter((p) => p.role === 'voter' && p.is_online);
			const votedUserIds = new Set(votes.map((v) => v.user));
			const allVoted = activeVoters.every((p) => votedUserIds.has(p.user));

			if (!canReveal(participant.role, allVoted)) {
				return fail(403, { errors: { general: 'Você não pode revelar os votos ainda.' } });
			}

			// Revela a sala
			await adminPb.collection('poker_rooms').update(roomId, {
				revealed: true
			});
		} catch (err) {
			console.error('Erro ao revelar votos:', err);
			return fail(500, { errors: { general: 'Não foi possível revelar os votos.' } });
		}

		return { success: true };
	},

	resetVotes: async ({ params, locals }) => {
		const { roomId } = params;
		const adminPb = await getAdminClient();

		try {
			const participant = await adminPb
				.collection('poker_participants')
				.getFirstListItem<PokerParticipantRecord>(
					adminPb.filter('room = {:roomId} && user = {:userId} && has_left = false', {
						roomId,
						userId: locals.user?.id
					})
				);

			if (!canManageRoom(participant.role)) {
				return fail(403, { errors: { general: 'Permissão negada.' } });
			}

			const room = await adminPb.collection('poker_rooms').getOne<PokerRoomRecord>(roomId);

			if (!room.current_task) {
				return fail(400, { errors: { general: 'Nenhuma task selecionada.' } });
			}

			// 1. Apaga os votos da task
			const votes = await adminPb.collection('poker_votes').getFullList<PokerVoteRecord>({
				filter: adminPb.filter('room = {:roomId} && task = {:taskId}', {
					roomId,
					taskId: room.current_task
				})
			});
			await Promise.all(votes.map((v) => adminPb.collection('poker_votes').delete(v.id)));

			// 2. Reseta a sala para não revelada
			await adminPb.collection('poker_rooms').update(roomId, {
				revealed: false
			});

			// 3. Reseta os participantes para não votados
			const participants = await adminPb
				.collection('poker_participants')
				.getFullList<PokerParticipantRecord>({
					filter: adminPb.filter('room = {:roomId} && has_left = false', { roomId })
				});
			await Promise.all(
				participants.map((p) =>
					adminPb.collection('poker_participants').update(p.id, {
						has_voted: false
					})
				)
			);
		} catch (err) {
			console.error('Erro ao resetar votos:', err);
			return fail(500, { errors: { general: 'Falha ao resetar a rodada.' } });
		}

		return { success: true };
	},

	setTask: async ({ params, request, locals }) => {
		const { roomId } = params;
		const formData = await request.formData();
		const taskId = formData.get('taskId') as string;

		const adminPb = await getAdminClient();

		try {
			const participant = await adminPb
				.collection('poker_participants')
				.getFirstListItem<PokerParticipantRecord>(
					adminPb.filter('room = {:roomId} && user = {:userId} && has_left = false', {
						roomId,
						userId: locals.user?.id
					})
				);

			if (!canManageRoom(participant.role)) {
				return fail(403, { errors: { general: 'Permissão negada.' } });
			}

			// Atualiza a task da sala
			await adminPb.collection('poker_rooms').update(roomId, {
				current_task: taskId || null,
				revealed: false
			});

			// Coloca a task com status 'voting' e as demais ativas voltam para 'backlog' (se estavam em votação)
			if (taskId) {
				const activeTasks = await adminPb.collection('poker_tasks').getFullList<PokerTaskRecord>({
					filter: adminPb.filter('room = {:roomId} && status = "voting"', { roomId })
				});
				await Promise.all(
					activeTasks.map((t) =>
						adminPb.collection('poker_tasks').update(t.id, { status: 'backlog' })
					)
				);

				await adminPb.collection('poker_tasks').update(taskId, {
					status: 'voting'
				});

				// Limpa votos antigos se houver
				const oldVotes = await adminPb.collection('poker_votes').getFullList<PokerVoteRecord>({
					filter: adminPb.filter('room = {:roomId} && task = {:taskId}', { roomId, taskId })
				});
				await Promise.all(oldVotes.map((v) => adminPb.collection('poker_votes').delete(v.id)));
			}

			// Reseta status de voto de todos os participantes
			const participants = await adminPb
				.collection('poker_participants')
				.getFullList<PokerParticipantRecord>({
					filter: adminPb.filter('room = {:roomId} && has_left = false', { roomId })
				});
			await Promise.all(
				participants.map((p) =>
					adminPb.collection('poker_participants').update(p.id, {
						has_voted: false
					})
				)
			);
		} catch (err) {
			console.error('Erro ao selecionar task:', err);
			return fail(500, { errors: { general: 'Falha ao selecionar task.' } });
		}

		return { success: true };
	},

	createTask: async ({ params, request, locals }) => {
		const { roomId } = params;
		const formData = await request.formData();
		const validation = createTaskSchema.safeParse({
			title: formData.get('title'),
			description: formData.get('description')
		});

		if (!validation.success) {
			return fail(400, { errors: fieldErrorsFrom(validation.error) });
		}

		const adminPb = await getAdminClient();

		try {
			// Qualquer participante pode criar task no backlog
			await adminPb.collection('poker_participants').getFirstListItem<PokerParticipantRecord>(
				adminPb.filter('room = {:roomId} && user = {:userId} && has_left = false', {
					roomId,
					userId: locals.user?.id
				})
			);

			// Sanitiza HTML
			const cleanDescription = sanitizeHtml(validation.data.description, {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'span', 'img']),
				allowedAttributes: {
					...sanitizeHtml.defaults.allowedAttributes,
					'*': ['class', 'style']
				}
			});

			await adminPb.collection('poker_tasks').create({
				room: roomId,
				title: validation.data.title,
				description: cleanDescription,
				status: 'backlog'
			});
		} catch (err) {
			console.error('Erro ao criar task:', err);
			return fail(500, { errors: { general: 'Não foi possível criar a task.' } });
		}

		return { success: true };
	},

	setFinalPoints: async ({ params, request, locals }) => {
		const { roomId } = params;
		const formData = await request.formData();
		const taskId = formData.get('taskId') as string;
		const pointsRaw = formData.get('points');
		const points = pointsRaw === '' || pointsRaw === null ? null : Number(pointsRaw);

		const validation = setFinalPointsSchema.safeParse({ points });
		if (!validation.success) {
			return fail(400, { errors: fieldErrorsFrom(validation.error) });
		}

		const adminPb = await getAdminClient();

		try {
			const participant = await adminPb
				.collection('poker_participants')
				.getFirstListItem<PokerParticipantRecord>(
					adminPb.filter('room = {:roomId} && user = {:userId} && has_left = false', {
						roomId,
						userId: locals.user?.id
					})
				);

			if (!canManageRoom(participant.role)) {
				return fail(403, { errors: { general: 'Permissão negada.' } });
			}

			// Atualiza os pontos da task
			await adminPb.collection('poker_tasks').update(taskId, {
				final_points: validation.data.points,
				status: validation.data.points !== null ? 'estimated' : 'backlog'
			});
		} catch (err) {
			console.error('Erro ao definir pontos finais:', err);
			return fail(500, { errors: { general: 'Não foi possível salvar os pontos.' } });
		}

		return { success: true };
	},

	changeRole: async ({ params, request, locals }) => {
		const { roomId } = params;
		const formData = await request.formData();
		const validation = changeRoleSchema.safeParse({
			participantId: formData.get('participantId'),
			role: formData.get('role')
		});

		if (!validation.success) {
			return fail(400, { errors: fieldErrorsFrom(validation.error) });
		}

		const adminPb = await getAdminClient();

		try {
			const myParticipant = await adminPb
				.collection('poker_participants')
				.getFirstListItem<PokerParticipantRecord>(
					adminPb.filter('room = {:roomId} && user = {:userId} && has_left = false', {
						roomId,
						userId: locals.user?.id
					})
				);

			if (!canManageRoom(myParticipant.role)) {
				return fail(403, { errors: { general: 'Permissão negada.' } });
			}

			// Altera papel do participante
			await adminPb.collection('poker_participants').update(validation.data.participantId, {
				role: validation.data.role
			});
		} catch (err) {
			console.error('Erro ao alterar papel:', err);
			return fail(500, { errors: { general: 'Não foi possível alterar a role.' } });
		}

		return { success: true };
	},

	removeParticipant: async ({ params, request, locals }) => {
		const { roomId } = params;
		const formData = await request.formData();
		const participantId = formData.get('participantId') as string;

		const adminPb = await getAdminClient();

		try {
			const myParticipant = await adminPb
				.collection('poker_participants')
				.getFirstListItem<PokerParticipantRecord>(
					adminPb.filter('room = {:roomId} && user = {:userId} && has_left = false', {
						roomId,
						userId: locals.user?.id
					})
				);

			if (!canManageRoom(myParticipant.role)) {
				return fail(403, { errors: { general: 'Permissão negada.' } });
			}

			// Marca que o participante saiu (RF4: não exclui o registro)
			await adminPb.collection('poker_participants').update(participantId, {
				has_left: true,
				is_online: false
			});
		} catch (err) {
			console.error('Erro ao remover participante:', err);
			return fail(500, { errors: { general: 'Não foi possível remover o participante.' } });
		}

		return { success: true };
	},

	leaveRoom: async ({ params, locals }) => {
		const { roomId } = params;
		const adminPb = await getAdminClient();

		try {
			const participant = await adminPb
				.collection('poker_participants')
				.getFirstListItem<PokerParticipantRecord>(
					adminPb.filter('room = {:roomId} && user = {:userId} && has_left = false', {
						roomId,
						userId: locals.user?.id
					})
				);

			// Se for o único admin, transfere para o próximo participante ativo ou cancela saída se for o último
			if (participant.role === 'admin') {
				const activeParticipants = await adminPb
					.collection('poker_participants')
					.getFullList<PokerParticipantRecord>({
						filter: adminPb.filter('room = {:roomId} && has_left = false', { roomId }),
						sort: 'created'
					});

				const nextActive = activeParticipants.find((p) => p.id !== participant.id);
				if (nextActive) {
					// Transfere o admin para o próximo participante mais antigo
					await adminPb.collection('poker_participants').update(nextActive.id, {
						role: 'admin'
					});
				}
			}

			// Atualiza status do próprio participante
			await adminPb.collection('poker_participants').update(participant.id, {
				has_left: true,
				is_online: false
			});
		} catch (err) {
			console.error('Erro ao sair da sala:', err);
			return fail(500, { errors: { general: 'Falha ao sair da sala.' } });
		}

		throw redirect(303, '/poker');
	},

	exportToKanban: async ({ params, request, locals }) => {
		const { roomId } = params;
		const formData = await request.formData();
		const taskIds = formData.getAll('taskIds') as string[];

		if (taskIds.length === 0) {
			return fail(400, { errors: { general: 'Selecione pelo menos uma task para exportar.' } });
		}

		const adminPb = await getAdminClient();

		try {
			// Valida permissão do usuário
			const myParticipant = await adminPb
				.collection('poker_participants')
				.getFirstListItem<PokerParticipantRecord>(
					adminPb.filter('room = {:roomId} && user = {:userId} && has_left = false', {
						roomId,
						userId: locals.user?.id
					})
				);

			if (!canManageRoom(myParticipant.role)) {
				return fail(403, { errors: { general: 'Apenas administradores podem exportar tasks.' } });
			}

			// Busca a coluna Backlog (Aguardando) do Kanban
			const columns = await adminPb.collection('kanban_columns').getFullList({
				filter: 'type = "backlog"'
			});
			const backlogColumn = columns[0];

			if (!backlogColumn) {
				return fail(500, { errors: { general: 'Coluna de Backlog não encontrada no Kanban.' } });
			}

			// Busca o número atual de cards no backlog para determinar a posição
			const existingCards = await adminPb.collection('kanban_cards').getFullList({
				filter: adminPb.filter('column = {:colId}', { colId: backlogColumn.id })
			});
			let positionCounter = existingCards.length;

			for (const taskId of taskIds) {
				const task = await adminPb.collection('poker_tasks').getOne<PokerTaskRecord>(taskId);

				// Evita duplicados ou exportar sem estimativa
				if (task.status === 'exported' || task.final_points === null) {
					continue;
				}

				// Cria o card no Kanban
				const card = await adminPb.collection('kanban_cards').create({
					title: task.title,
					description: task.description,
					column: backlogColumn.id,
					created_by: locals.user?.id,
					assignees: [],
					position: positionCounter++,
					points: task.final_points,
					tags: []
				});

				// Atualiza a task no Poker
				await adminPb.collection('poker_tasks').update(taskId, {
					status: 'exported',
					exported_card: card.id
				});
			}
		} catch (err) {
			console.error('Erro ao exportar para o Kanban:', err);
			return fail(500, { errors: { general: 'Erro ao exportar tasks.' } });
		}

		return { success: true };
	}
};
