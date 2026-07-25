import { z } from 'zod';

export const createDocSchema = z.object({
	title: z
		.string()
		.min(1, { message: 'Título obrigatório.' })
		.max(200, { message: 'Título muito longo (máx. 200 caracteres).' }),
	body_md: z.string().optional().default(''),
	tags: z.array(z.string()).optional().default([])
});

export const updateDocSchema = z.object({
	title: z
		.string()
		.min(1, { message: 'Título obrigatório.' })
		.max(200, { message: 'Título muito longo (máx. 200 caracteres).' }),
	body_md: z.string().optional().default(''),
	tags: z.array(z.string()).optional().default([])
});

export const addPermissionSchema = z.object({
	userId: z.string().min(1, { message: 'Usuário obrigatório.' }),
	role: z.enum(['view', 'edit'], { message: 'Papel inválido.' })
});

export const removePermissionSchema = z.object({
	permissionId: z.string().min(1, { message: 'Permissão obrigatória.' })
});

export const createTaskFromDocSchema = z.object({
	title: z
		.string()
		.min(1, { message: 'Título obrigatório.' })
		.max(200, { message: 'Título muito longo (máx. 200 caracteres).' }),
	description: z.string().optional().default('')
});

export type CreateDocInput = z.infer<typeof createDocSchema>;
export type UpdateDocInput = z.infer<typeof updateDocSchema>;
export type AddPermissionInput = z.infer<typeof addPermissionSchema>;
export type RemovePermissionInput = z.infer<typeof removePermissionSchema>;
export type CreateTaskFromDocInput = z.infer<typeof createTaskFromDocSchema>;
