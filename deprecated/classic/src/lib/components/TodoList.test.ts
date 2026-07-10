import { describe, expect, test } from 'vitest';
import TodoList from 'todo-domain/observable/TodoList.js';
import Observer from 'todo-domain/observable/Observer.js';
import TodoMemoryGateway from 'todo-domain/gateways/TodoMemoryGateway.js';
import Item from 'todo-domain/observable/Item.js';
import type { TodoItemDTO } from 'todo-domain';

async function createBoundTodoList(gateway: TodoMemoryGateway): Promise<TodoList> {
	const todoList = TodoList.fromDTO(await gateway.getTodos());
	todoList.register(
		new Observer('addItem', async (item) => {
			await gateway.addItem((item as Item).toDTO());
		})
	);
	todoList.register(
		new Observer('removeItem', async (item) => {
			await gateway.removeItem((item as Item).id);
		})
	);
	todoList.register(
		new Observer('toggleDone', async (item) => {
			await gateway.updateItem((item as Item).toDTO());
		})
	);
	return todoList;
}

describe('TodoListView integration (classic)', () => {
	test('Deve testar a tela de todo list com memory gateway', async () => {
		const gateway = new TodoMemoryGateway();
		const todoList = await createBoundTodoList(gateway);

		expect(todoList.getCompleted()).toBe(33);
	});

	test('deve adicionar item via gateway', async () => {
		const gateway = new TodoMemoryGateway([]);
		const todoList = await createBoundTodoList(gateway);

		await todoList.addItem('Novo item');
		const stored = await gateway.getTodos();
		expect(stored).toHaveLength(1);
		expect(stored[0].description).toBe('Novo item');
	});

	test('deve remover item via gateway', async () => {
		const gateway = new TodoMemoryGateway([{ id: 'x', description: 'Remover', done: false }]);
		const todoList = await createBoundTodoList(gateway);

		const item = todoList.getItem('Remover');
		expect(item).toBeDefined();
		if (item) await todoList.removeItem(item);

		const stored = await gateway.getTodos();
		expect(stored).toHaveLength(0);
	});

	test('deve alternar done via gateway', async () => {
		const gateway = new TodoMemoryGateway([{ id: 'y', description: 'Alternar', done: false }]);
		const todoList = await createBoundTodoList(gateway);

		const item = todoList.getItem('Alternar');
		expect(item).toBeDefined();
		if (item) await todoList.toggleDone(item);

		const stored = await gateway.getTodos();
		expect(stored[0].done).toBe(true);
	});

	test('gatilho de addItem não adiciona itens duplicados', async () => {
		const gateway = new TodoMemoryGateway([]);
		const todoList = await createBoundTodoList(gateway);

		await todoList.addItem('Único');
		await todoList.addItem('Único');
		const stored = await gateway.getTodos();
		expect(stored).toHaveLength(1);
	});

	test('cria TodoList a partir de DTOs e verifica toDTO', async () => {
		const dtos: TodoItemDTO[] = [
			{ id: 'a', description: 'Alpha', done: true },
			{ id: 'b', description: 'Beta', done: false }
		];
		const todoList = TodoList.fromDTO(dtos);
		expect(todoList.toDTO()).toEqual(dtos);
	});
});
