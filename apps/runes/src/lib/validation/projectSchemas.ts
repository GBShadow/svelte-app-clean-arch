import { z } from 'zod';

export const createProjectSchema = z.object({
	title: z
		.string()
		.min(1, { message: 'Título obrigatório.' })
		.max(200, { message: 'Título muito longo (máx. 200 caracteres).' }),
	description: z
		.string()
		.min(1, { message: 'Descrição obrigatória.' })
		.max(5000, { message: 'Descrição muito longa (máx. 5000 caracteres).' }),
	responsaveisIds: z.array(z.string()).optional().default([]),
	participantIds: z.array(z.string()).optional().default([])
});

export const updateProjectSchema = z.object({
	title: z
		.string()
		.min(1, { message: 'Título obrigatório.' })
		.max(200, { message: 'Título muito longo (máx. 200 caracteres).' })
		.optional(),
	description: z
		.string()
		.min(1, { message: 'Descrição obrigatória.' })
		.max(5000, { message: 'Descrição muito longa (máx. 5000 caracteres).' })
		.optional()
});

export const createSprintSchema = z.object({
	title: z
		.string()
		.min(1, { message: 'Título da sprint obrigatório.' })
		.max(200, { message: 'Título muito longo (máx. 200 caracteres).' }),
	startDate: z.string().min(1, { message: 'Data de início obrigatória.' }),
	endDate: z.string().min(1, { message: 'Data de fim obrigatória.' })
});

export const addParticipantSchema = z.object({
	userId: z.string().min(1)
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateSprintInput = z.infer<typeof createSprintSchema>;
