import { z } from 'zod';

export const createCategorySchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, { error: 'O nome da categoria é obrigatório.' })
		.max(50, { error: 'O nome da categoria deve ter no máximo 50 caracteres.' }),
	description: z
		.string()
		.trim()
		.max(250, { error: 'A descrição deve ter no máximo 250 caracteres.' })
		.optional()
		.or(z.literal(''))
});

export const updateCategorySchema = z.object({
	id: z.string().min(1, { error: 'ID da categoria é obrigatório.' }),
	name: z
		.string()
		.trim()
		.min(1, { error: 'O nome da categoria é obrigatório.' })
		.max(50, { error: 'O nome da categoria deve ter no máximo 50 caracteres.' }),
	description: z
		.string()
		.trim()
		.max(250, { error: 'A descrição deve ter no máximo 250 caracteres.' })
		.optional()
		.or(z.literal(''))
});

export const deleteCategorySchema = z.object({
	id: z.string().min(1, { error: 'ID da categoria é obrigatório.' })
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;
