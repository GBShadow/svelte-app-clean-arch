import { z } from 'zod';

export const loginSchema = z.object({
	email: z.email({ error: 'E-mail inválido.' }),
	password: z.string().min(1, { error: 'Senha obrigatória.' })
});

export type LoginInput = z.infer<typeof loginSchema>;
