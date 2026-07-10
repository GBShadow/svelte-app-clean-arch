import { describe, expect, test } from 'vitest';
import { createId, SEED_TODOS } from '../src/types';

describe('createId', () => {
	test('retorna string não vazia', () => {
		const id = createId();
		expect(id).toBeTruthy();
		expect(typeof id).toBe('string');
		expect(id.length).toBeGreaterThan(0);
	});

	test('retorna ids diferentes em chamadas consecutivas', () => {
		const id1 = createId();
		const id2 = createId();
		expect(id1).not.toBe(id2);
	});

	test('retorna string alfanumérica', () => {
		const id = createId();
		expect(id).toMatch(/^[a-z0-9]+$/);
	});
});

describe('SEED_TODOS', () => {
	test('contém 3 itens', () => {
		expect(SEED_TODOS).toHaveLength(3);
	});

	test('cada item tem os campos obrigatórios', () => {
		for (const todo of SEED_TODOS) {
			expect(todo).toHaveProperty('id');
			expect(todo).toHaveProperty('description');
			expect(todo).toHaveProperty('done');
			expect(typeof todo.id).toBe('string');
			expect(typeof todo.description).toBe('string');
			expect(typeof todo.done).toBe('boolean');
		}
	});

	test('contém os valores esperados', () => {
		expect(SEED_TODOS[0].description).toBe('Estudar TypeScript');
		expect(SEED_TODOS[0].done).toBe(true);
		expect(SEED_TODOS[1].description).toBe('Fazer a prova online');
		expect(SEED_TODOS[1].done).toBe(false);
		expect(SEED_TODOS[2].description).toBe('Cortar a grama');
		expect(SEED_TODOS[2].done).toBe(false);
	});
});
