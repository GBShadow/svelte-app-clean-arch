export type ParticipantRole = 'admin' | 'voter' | 'spectator';

/**
 * Verifica se um participante pode votar na rodada atual.
 */
export function canVote(
	role: ParticipantRole,
	revealed: boolean,
	roomStatus: 'open' | 'finalized' = 'open'
): boolean {
	return role !== 'spectator' && !revealed && roomStatus === 'open';
}

/**
 * Verifica se um participante pode revelar os votos da rodada atual.
 * - Admin/Responsável pode revelar a qualquer momento.
 * - Votante comum pode revelar somente se todos os votantes online já votaram.
 * - Espectador nunca pode revelar.
 */
export function canReveal(role: ParticipantRole, allVotersVoted: boolean): boolean {
	if (role === 'admin') return true;
	if (role === 'voter') return allVotersVoted;
	return false;
}

/**
 * Verifica se o participante tem privilégios de gerenciar a sala (Admin/Responsável).
 * Ações administrativas: mudar papéis, remover participantes, selecionar task, resetar votos, exportar.
 */
export function canManageRoom(role: ParticipantRole): boolean {
	return role === 'admin';
}

/**
 * Calcula a média aritmética dos votos numéricos.
 * Ignora valores não numéricos como "?" e "☕".
 */
export function averageOfNumericVotes(votes: Array<{ value: string }>): number {
	const numericVotes = votes
		.map((v) => parseFloat(v.value))
		.filter((val) => !isNaN(val) && isFinite(val));

	if (numericVotes.length === 0) return 0;

	const sum = numericVotes.reduce((acc, curr) => acc + curr, 0);
	return Math.round((sum / numericVotes.length) * 10) / 10;
}

/**
 * Retorna a distribuição dos votos por valor (frequência).
 */
export function calculateVoteDistribution(votes: Array<{ value: string }>): Record<string, number> {
	const distribution: Record<string, number> = {};
	for (const vote of votes) {
		const val = vote.value;
		distribution[val] = (distribution[val] || 0) + 1;
	}
	return distribution;
}

/**
 * Verifica se todos os votantes online votaram.
 * @param participants Lista de participantes atuais da sala.
 * @param votes Lista de votos coletados na rodada atual.
 */
export function checkIfAllVotersVoted(
	participants: Array<{ id: string; role: ParticipantRole; is_online: boolean; has_left: boolean; user: string }>,
	votes: Array<{ user: string }>
): boolean {
	// Filtra apenas participantes que são votantes, estão online e não saíram
	const activeVoters = participants.filter(
		(p) => p.role === 'voter' && p.is_online && !p.has_left
	);

	if (activeVoters.length === 0) return false;

	// Verifica se existe um voto para cada participante ativo
	const votedUserIds = new Set(votes.map((v) => v.user));
	return activeVoters.every((p) => votedUserIds.has(p.user || (p as any).userId || p.id));
}

/**
 * Verifica se um usuário pode criar ou editar tarefas no backlog global.
 */
export function canEditGlobalTask(user: { isAdmin: boolean }, task: { room: string | null }): boolean {
	return user.isAdmin && !task.room;
}

/**
 * Verifica se um usuário pode excluir tarefas no backlog global.
 */
export function canDeleteGlobalTask(user: { isAdmin: boolean }, task: { room: string | null }): boolean {
	return user.isAdmin && !task.room;
}

/**
 * Verifica se o participante pode vincular tarefas globais à sala.
 */
export function canLinkGlobalTasks(
	participant: { role: ParticipantRole },
	room: { status: 'open' | 'finalized' }
): boolean {
	return canManageRoom(participant.role) && room.status === 'open';
}

/**
 * Verifica se o participante pode finalizar a sala.
 */
export function canFinalizeRoom(
	participant: { role: ParticipantRole },
	room: { status: 'open' | 'finalized' }
): boolean {
	return canManageRoom(participant.role) && room.status === 'open';
}

/**
 * Verifica se o participante pode exportar tarefas da sala para o Kanban.
 */
export function canExportFromRoom(
	participant: { role: ParticipantRole },
	room: { status: 'open' | 'finalized' }
): boolean {
	return canManageRoom(participant.role) && room.status === 'finalized';
}

/**
 * Verifica se o participante pode remover uma tarefa da votação.
 */
export function canRemoveFromVoting(
	participant: { role: ParticipantRole },
	room: { status: 'open' | 'finalized' },
	task: { status: 'backlog' | 'voting' | 'estimated' | 'exported' }
): boolean {
	return canManageRoom(participant.role) && room.status === 'open' && task.status === 'voting';
}

/**
 * Verifica se o participante pode editar título e descrição de uma tarefa da sala.
 */
export function canEditTaskInRoom(
	participant: { role: ParticipantRole },
	room: { status: 'open' | 'finalized' },
	task: { status: 'backlog' | 'voting' | 'estimated' | 'exported' }
): boolean {
	return (
		canManageRoom(participant.role) &&
		room.status === 'open' &&
		(task.status === 'backlog' || task.status === 'voting')
	);
}

/**
 * Verifica se novas tarefas locais podem ser criadas na sala.
 */
export function canCreateTaskInRoom(room: { status: 'open' | 'finalized' }): boolean {
	return room.status === 'open';
}

/**
 * Verifica se o participante pode selecionar a tarefa em votação.
 */
export function canSetTask(
	participant: { role: ParticipantRole },
	room: { status: 'open' | 'finalized' }
): boolean {
	return canManageRoom(participant.role) && room.status === 'open';
}
