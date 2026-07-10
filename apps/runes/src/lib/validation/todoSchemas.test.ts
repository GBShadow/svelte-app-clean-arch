import { describe, expect, test } from 'vitest';
import { addItemSchema, createListSchema } from './todoSchemas';

describe('createListSchema', () => {
	test('aceita título não vazio', () => {
		expect(createListSchema.safeParse({ title: 'Compras' }).success).toBe(true);
	});

	test('rejeita título vazio', () => {
		expect(createListSchema.safeParse({ title: '' }).success).toBe(false);
	});
});

describe('addItemSchema', () => {
	test('aceita descrição não vazia', () => {
		expect(addItemSchema.safeParse({ description: 'Comprar leite' }).success).toBe(true);
	});

	test('rejeita descrição vazia', () => {
		expect(addItemSchema.safeParse({ description: '' }).success).toBe(false);
	});
});
