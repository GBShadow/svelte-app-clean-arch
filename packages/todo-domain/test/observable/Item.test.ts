import { describe, expect, test } from 'vitest';
import Item from '../../src/observable/Item';

describe('Item', () => {
	test('cria item com id gerado quando id é null', () => {
		const item = new Item(null, 'Tarefa');
		expect(item.id).toBeTruthy();
		expect(typeof item.id).toBe('string');
		expect(item.description).toBe('Tarefa');
		expect(item.done).toBe(false);
	});

	test('usa o id fornecido quando não é null', () => {
		const item = new Item('abc-123', 'Tarefa');
		expect(item.id).toBe('abc-123');
	});

	test('aceita done como true', () => {
		const item = new Item('1', 'Tarefa', true);
		expect(item.done).toBe(true);
	});

	test('toDTO retorna objeto com os mesmos valores', () => {
		const item = new Item('id-1', 'Minha tarefa', true);
		const dto = item.toDTO();
		expect(dto).toEqual({ id: 'id-1', description: 'Minha tarefa', done: true });
	});

	test('toDTO não é a mesma referência', () => {
		const item = new Item('id-1', 'Tarefa');
		const dto = item.toDTO();
		item.description = 'Outra';
		expect(dto.description).toBe('Tarefa');
	});
});
