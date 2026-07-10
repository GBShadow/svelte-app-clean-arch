import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { fieldErrorsFrom } from './formErrors';

const testSchema = z.object({
	name: z.string().min(1, { error: 'Nome obrigatório.' }),
	email: z.email({ error: 'E-mail inválido.' })
});

describe('fieldErrorsFrom', () => {
	test('mapeia erros de campo para record', () => {
		const result = testSchema.safeParse({ name: '', email: 'invalido' });
		expect(result.success).toBe(false);
		if (result.success) return;

		const errors = fieldErrorsFrom(result.error);
		expect(errors.name).toBe('Nome obrigatório.');
		expect(errors.email).toBe('E-mail inválido.');
	});

	test('retorna primeiro erro de cada campo', () => {
		const schema = z.object({
			name: z
				.string()
				.min(1, { error: 'Nome obrigatório.' })
				.max(5, { error: 'Nome muito longo.' })
		});
		const result = schema.safeParse({ name: '' });
		expect(result.success).toBe(false);
		if (result.success) return;

		const errors = fieldErrorsFrom(result.error);
		expect(errors.name).toBe('Nome obrigatório.');
		expect(Object.keys(errors)).toHaveLength(1);
	});

	test('usa "general" como chave para campo vazio no path', () => {
		const schema = z
			.object({
				password: z.string(),
				confirm: z.string()
			})
			.refine((d) => d.password === d.confirm, {
				error: 'Senhas não conferem.',
				path: ['confirm']
			});
		const result = schema.safeParse({ password: '123', confirm: '456' });
		expect(result.success).toBe(false);
		if (result.success) return;

		const errors = fieldErrorsFrom(result.error);
		expect(errors.confirm).toBe('Senhas não conferem.');
	});

	test('retorna record vazio se não houver issues', () => {
		const error = new z.ZodError([]);
		const errors = fieldErrorsFrom(error);
		expect(errors).toEqual({});
	});
});
