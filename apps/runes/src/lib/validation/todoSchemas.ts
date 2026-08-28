import { z } from 'zod';

export const createListSchema = z.object({
	title: z.string().min(1, { error: 'Título obrigatório.' })
});

export const addItemSchema = z.object({
	description: z.string().min(1, { error: 'Descrição obrigatória.' }),
	category: z.string().nullable().optional()
});

export type CreateListInput = z.infer<typeof createListSchema>;
export type AddItemInput = z.infer<typeof addItemSchema>;
