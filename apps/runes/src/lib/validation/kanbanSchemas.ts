import { z } from 'zod';

export const createColumnSchema = z.object({
	name: z
		.string()
		.min(1, { message: 'Nome da coluna obrigatório.' })
		.max(100, { message: 'Nome da coluna muito longo (máx. 100 caracteres).' })
});

export const createCardSchema = z.object({
	title: z
		.string()
		.min(1, { message: 'Título obrigatório.' })
		.max(200, { message: 'Título muito longo (máx. 200 caracteres).' }),
	description: z.string().optional().default(''),
	columnId: z.string().min(1, { message: 'Coluna destino obrigatória.' }),
	assigneeIds: z.array(z.string()).optional().default([]),
	tags: z.array(z.string()).optional().default([]),
	dueDate: z
		.string()
		.nullable()
		.optional()
		.refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Data inválida.' }),
	points: z.coerce
		.number()
		.nullable()
		.optional()
});

export const updateCardSchema = z.object({
	cardId: z.string().min(1),
	title: z
		.string()
		.min(1, { message: 'Título obrigatório.' })
		.max(200, { message: 'Título muito longo (máx. 200 caracteres).' })
		.optional(),
	description: z.string().optional(),
	columnId: z.string().optional(),
	assigneeIds: z.array(z.string()).optional(),
	tags: z.array(z.string()).optional(),
	dueDate: z
		.string()
		.nullable()
		.optional()
		.refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Data inválida.' }),
	points: z.coerce
		.number()
		.nullable()
		.optional()
});

export const moveCardSchema = z.object({
	cardId: z.string().min(1),
	columnId: z.string().min(1),
	position: z.coerce.number().nonnegative()
});

export const addCommentSchema = z.object({
	cardId: z.string().min(1),
	text: z
		.string()
		.min(1, { message: 'Comentário obrigatório.' })
		.max(2000, { message: 'Comentário muito longo (máx. 2000 caracteres).' })
});

export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type MoveCardInput = z.infer<typeof moveCardSchema>;
export type AddCommentInput = z.infer<typeof addCommentSchema>;
