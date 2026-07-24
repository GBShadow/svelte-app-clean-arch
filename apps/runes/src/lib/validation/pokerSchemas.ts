import { z } from 'zod';

export const POKER_CARDS = [
	'0',
	'1',
	'2',
	'3',
	'5',
	'8',
	'13',
	'21',
	'34',
	'55',
	'89',
	'?',
	'☕'
] as const;

export const createRoomSchema = z.object({
	name: z
		.string()
		.min(1, 'O nome da sala é obrigatório.')
		.max(100, 'O nome da sala deve ter no máximo 100 caracteres.'),
	projectId: z.string().min(1, 'O projeto é obrigatório.')
});

export const createTaskSchema = z.object({
	title: z
		.string()
		.min(1, 'O título da task é obrigatório.')
		.max(200, 'O título da task deve ter no máximo 200 caracteres.'),
	description: z.string().optional().default('')
});

export const voteSchema = z.object({
	value: z.enum(POKER_CARDS, {
		message: 'Escolha uma carta válida do baralho.'
	})
});

export const setFinalPointsSchema = z.object({
	points: z
		.number()
		.min(0, 'Os pontos não podem ser negativos.')
		.max(999, 'Os pontos devem ser no máximo 999.')
		.nullable()
});

export const POKER_ROLES = ['admin', 'voter', 'spectator'] as const;

export const changeRoleSchema = z.object({
	participantId: z.string().min(1, 'Participante inválido.'),
	role: z.enum(POKER_ROLES, {
		message: 'Papel inválido.'
	})
});

export const editTaskSchema = z.object({
	taskId: z.string().min(1, 'Task inválida.'),
	title: z
		.string()
		.min(1, 'O título da task é obrigatório.')
		.max(200, 'O título da task deve ter no máximo 200 caracteres.'),
	description: z.string().optional().default('')
});

export const createGlobalTaskSchema = z.object({
	title: z
		.string()
		.min(1, 'O título da task é obrigatório.')
		.max(200, 'O título da task deve ter no máximo 200 caracteres.'),
	description: z.string().optional().default('')
});

export const editGlobalTaskSchema = z.object({
	taskId: z.string().min(1, 'Task inválida.'),
	title: z
		.string()
		.min(1, 'O título da task é obrigatório.')
		.max(200, 'O título da task deve ter no máximo 200 caracteres.'),
	description: z.string().optional().default('')
});

export const linkGlobalTasksSchema = z.object({
	taskIds: z.array(z.string().min(1)).min(1, 'Selecione pelo menos uma tarefa.')
});

export const exportToKanbanSchema = z.object({
	taskIds: z
		.array(z.string().min(1, 'ID de task inválido.'))
		.min(1, 'Selecione pelo menos uma task para exportar.')
});
