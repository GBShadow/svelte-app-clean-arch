import { z } from 'zod';

export const jobTitleEnum = z.enum(['senior', 'mid', 'junior', 'intern']);

const passwordField = z.string().min(8, { error: 'A senha deve ter pelo menos 8 caracteres.' });

const passwordsMatch = (data: { password: string; confirmPassword: string }) =>
	data.password === data.confirmPassword;

export const createUserSchema = z
	.object({
		name: z.string().min(1, { error: 'Nome obrigatório.' }),
		email: z.email({ error: 'E-mail inválido.' }),
		jobTitle: jobTitleEnum,
		password: passwordField,
		confirmPassword: z.string()
	})
	.refine(passwordsMatch, { error: 'As senhas não conferem.', path: ['confirmPassword'] });

export const updateUserSchema = z.object({
	name: z.string().min(1, { error: 'Nome obrigatório.' }),
	jobTitle: jobTitleEnum
});

export const adminEmailSchema = z.email({ error: 'E-mail inválido.' });

export const resetPasswordSchema = z
	.object({
		password: passwordField,
		confirmPassword: z.string()
	})
	.refine(passwordsMatch, { error: 'As senhas não conferem.', path: ['confirmPassword'] });

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, { error: 'Senha atual obrigatória.' }),
		password: passwordField,
		confirmPassword: z.string()
	})
	.refine(passwordsMatch, { error: 'As senhas não conferem.', path: ['confirmPassword'] });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
