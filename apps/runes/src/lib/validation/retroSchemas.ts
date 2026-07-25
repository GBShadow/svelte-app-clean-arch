import { z } from 'zod';

export const createRetroSchema = z.object({
	sprintId: z.string().min(1, { message: 'Sprint obrigatória.' })
});

export const createColumnSchema = z.object({
	name: z
		.string()
		.min(1, { message: 'Nome da coluna obrigatório.' })
		.max(100, { message: 'Nome da coluna muito longo (máx. 100 caracteres).' })
});

export const renameColumnSchema = z.object({
	columnId: z.string().min(1),
	name: z
		.string()
		.min(1, { message: 'Nome da coluna obrigatório.' })
		.max(100, { message: 'Nome da coluna muito longo (máx. 100 caracteres).' })
});

export const reorderColumnsSchema = z.object({
	orderedIds: z.array(z.string()).min(1)
});

export const deleteColumnSchema = z.object({
	columnId: z.string().min(1)
});

export const createCardSchema = z.object({
	columnId: z.string().min(1, { message: 'Coluna destino obrigatória.' }),
	content: z
		.string()
		.min(1, { message: 'Conteúdo do card obrigatório.' })
		.max(10000, { message: 'Conteúdo muito longo (máx. 10000 caracteres).' })
});

export const editCardSchema = z.object({
	cardId: z.string().min(1),
	content: z
		.string()
		.min(1, { message: 'Conteúdo do card obrigatório.' })
		.max(10000, { message: 'Conteúdo muito longo (máx. 10000 caracteres).' }),
	editToken: z.string().min(1)
});

export const deleteCardSchema = z.object({
	cardId: z.string().min(1),
	editToken: z.string().optional()
});

export const moveCardSchema = z.object({
	cardId: z.string().min(1),
	columnId: z.string().min(1),
	position: z.coerce.number().nonnegative()
});

export const addParticipantSchema = z.object({
	userId: z.string().min(1)
});

export const removeParticipantSchema = z.object({
	participantId: z.string().min(1)
});

export type CreateRetroInput = z.infer<typeof createRetroSchema>;
export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type RenameColumnInput = z.infer<typeof renameColumnSchema>;
export type ReorderColumnsInput = z.infer<typeof reorderColumnsSchema>;
export type DeleteColumnInput = z.infer<typeof deleteColumnSchema>;
export type CreateCardInput = z.infer<typeof createCardSchema>;
export type EditCardInput = z.infer<typeof editCardSchema>;
export type DeleteCardInput = z.infer<typeof deleteCardSchema>;
export type MoveCardInput = z.infer<typeof moveCardSchema>;
export type AddParticipantInput = z.infer<typeof addParticipantSchema>;
export type RemoveParticipantInput = z.infer<typeof removeParticipantSchema>;
