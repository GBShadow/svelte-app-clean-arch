import { z } from 'zod';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const createRoomSchema = z.object({
	participantIds: z
		.array(z.string().min(1))
		.min(1, { error: 'Escolha pelo menos um participante.' }),
	name: z.string().optional()
});

export const sendMessageSchema = z.object({
	text: z
		.string()
		.min(1, { error: 'Mensagem obrigatória.' })
		.max(2000, { error: 'Mensagem muito longa (máx. 2000 caracteres).' })
});

export const avatarSchema = z
	.instanceof(File, { error: 'Selecione uma imagem.' })
	.refine((file) => file.size > 0, { error: 'Selecione uma imagem.' })
	.refine((file) => file.size <= MAX_AVATAR_SIZE, { error: 'A imagem deve ter no máximo 2MB.' })
	.refine((file) => ALLOWED_AVATAR_TYPES.includes(file.type), {
		error: 'Formato inválido. Use JPG, PNG ou WEBP.'
	});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
