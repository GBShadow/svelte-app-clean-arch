import { describe, expect, test } from 'vitest';
import {
	adminEmailSchema,
	changePasswordSchema,
	createUserSchema,
	resetPasswordSchema,
	updateUserSchema
} from './userSchemas';
import { fieldErrorsFrom } from './formErrors';

describe('createUserSchema', () => {
	test('aceita dados válidos', () => {
		const result = createUserSchema.safeParse({
			name: 'Ana',
			email: 'ana@example.com',
			jobTitle: 'senior',
			password: '12345678',
			confirmPassword: '12345678'
		});
		expect(result.success).toBe(true);
	});

	test('rejeita senha curta', () => {
		const result = createUserSchema.safeParse({
			name: 'Ana',
			email: 'ana@example.com',
			jobTitle: 'senior',
			password: '123',
			confirmPassword: '123'
		});
		expect(result.success).toBe(false);
	});

	test('rejeita senhas que não conferem', () => {
		const result = createUserSchema.safeParse({
			name: 'Ana',
			email: 'ana@example.com',
			jobTitle: 'senior',
			password: '12345678',
			confirmPassword: '87654321'
		});
		expect(result.success).toBe(false);
	});

	test('rejeita jobTitle fora do enum', () => {
		const result = createUserSchema.safeParse({
			name: 'Ana',
			email: 'ana@example.com',
			jobTitle: 'ceo',
			password: '12345678',
			confirmPassword: '12345678'
		});
		expect(result.success).toBe(false);
	});
});

describe('updateUserSchema', () => {
	test('aceita name e jobTitle, sem email', () => {
		const result = updateUserSchema.safeParse({ name: 'Ana', jobTitle: 'mid' });
		expect(result.success).toBe(true);
	});

	test('rejeita nome vazio', () => {
		const result = updateUserSchema.safeParse({ name: '', jobTitle: 'mid' });
		expect(result.success).toBe(false);
	});
});

describe('adminEmailSchema', () => {
	test('aceita e-mail válido', () => {
		expect(adminEmailSchema.safeParse('novo@example.com').success).toBe(true);
	});

	test('rejeita e-mail inválido', () => {
		expect(adminEmailSchema.safeParse('não-é-email').success).toBe(false);
	});
});

describe('resetPasswordSchema', () => {
	test('aceita senhas iguais e longas o suficiente', () => {
		const result = resetPasswordSchema.safeParse({
			password: '12345678',
			confirmPassword: '12345678'
		});
		expect(result.success).toBe(true);
	});

	test('rejeita senhas diferentes', () => {
		const result = resetPasswordSchema.safeParse({
			password: '12345678',
			confirmPassword: '87654321'
		});
		expect(result.success).toBe(false);
	});
});

describe('changePasswordSchema', () => {
	test('exige senha atual', () => {
		const result = changePasswordSchema.safeParse({
			currentPassword: '',
			password: '12345678',
			confirmPassword: '12345678'
		});
		expect(result.success).toBe(false);
	});

	test('aceita quando tudo está correto', () => {
		const result = changePasswordSchema.safeParse({
			currentPassword: 'senha-atual',
			password: '12345678',
			confirmPassword: '12345678'
		});
		expect(result.success).toBe(true);
	});
});

describe('fieldErrorsFrom', () => {
	test('mapeia o primeiro erro de cada campo pelo path', () => {
		const result = createUserSchema.safeParse({
			name: '',
			email: 'inválido',
			jobTitle: 'senior',
			password: '123',
			confirmPassword: '456'
		});
		expect(result.success).toBe(false);
		if (result.success) return;

		const errors = fieldErrorsFrom(result.error);
		expect(errors.name).toBeDefined();
		expect(errors.email).toBeDefined();
		expect(errors.password).toBeDefined();
	});
});
