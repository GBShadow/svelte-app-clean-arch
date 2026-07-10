import { describe, expect, test } from 'vitest';
import TodoMemoryGateway from '../../src/gateways/TodoMemoryGateway';
import { SEED_TODOS, createId } from '../../src/types';

describe('TodoMemoryGateway', () => {
	test('getTodos retorna os seed todos por padrão', async () => {
		const gateway = new TodoMemoryGateway();
		const todos = await gateway.getTodos();
		expect(todos).toHaveLength(SEED_TODOS.length);
		expect(todos[0].description).toBe(SEED_TODOS[0].description);
	});

	test('getTodos retorna um clone (não mutável)', async () => {
		const gateway = new TodoMemoryGateway();
		const todos = await gateway.getTodos();
		todos[0] = { id: 'x', description: 'hack', done: true };
		const again = await gateway.getTodos();
		expect(again[0].description).toBe(SEED_TODOS[0].description);
	});

	test('getTodos aceita array personalizado no construtor', async () => {
		const custom = [{ id: 'c1', description: 'Custom', done: false }];
		const gateway = new TodoMemoryGateway(custom);
		const todos = await gateway.getTodos();
		expect(todos).toHaveLength(1);
		expect(todos[0].description).toBe('Custom');
	});

	test('addItem insere no final da lista', async () => {
		const gateway = new TodoMemoryGateway([]);
		await gateway.addItem({ id: 'n1', description: 'Novo', done: false });
		const todos = await gateway.getTodos();
		expect(todos).toHaveLength(1);
		expect(todos[0].description).toBe('Novo');
	});

	test('addItem adiciona múltiplos itens', async () => {
		const gateway = new TodoMemoryGateway([]);
		await gateway.addItem({ id: 'a', description: 'A', done: false });
		await gateway.addItem({ id: 'b', description: 'B', done: false });
		const todos = await gateway.getTodos();
		expect(todos).toHaveLength(2);
	});

	test('updateItem altera done do item existente', async () => {
		const gateway = new TodoMemoryGateway([
			{ id: 'u1', description: 'Atualizar', done: false }
		]);
		await gateway.updateItem({ id: 'u1', description: 'Atualizar', done: true });
		const todos = await gateway.getTodos();
		expect(todos[0].done).toBe(true);
	});

	test('updateItem não quebra se item não existir', async () => {
		const gateway = new TodoMemoryGateway([]);
		await expect(
			gateway.updateItem({ id: 'inexistente', description: 'x', done: true })
		).resolves.toBeUndefined();
	});

	test('removeItem remove item pelo id', async () => {
		const gateway = new TodoMemoryGateway([
			{ id: 'r1', description: 'Remover', done: false },
			{ id: 'r2', description: 'Manter', done: false }
		]);
		await gateway.removeItem('r1');
		const todos = await gateway.getTodos();
		expect(todos).toHaveLength(1);
		expect(todos[0].id).toBe('r2');
	});

	test('removeItem não quebra se item não existir', async () => {
		const gateway = new TodoMemoryGateway([]);
		await expect(gateway.removeItem('inexistente')).resolves.toBeUndefined();
	});

	test('ciclo completo CRUD', async () => {
		const gateway = new TodoMemoryGateway([]);
		const item = { id: createId(), description: 'CRUD', done: false };

		await gateway.addItem(item);
		expect(await gateway.getTodos()).toHaveLength(1);

		item.done = true;
		await gateway.updateItem(item);
		const afterUpdate = await gateway.getTodos();
		expect(afterUpdate[0].done).toBe(true);

		await gateway.removeItem(item.id);
		expect(await gateway.getTodos()).toHaveLength(0);
	});
});
