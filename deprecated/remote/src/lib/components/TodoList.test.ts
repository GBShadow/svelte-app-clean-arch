import { describe, expect, test } from 'vitest';
import TodoList from 'todo-domain/observable/TodoList.js';
import Observer from 'todo-domain/observable/Observer.js';
import TodoMemoryGateway from 'todo-domain/gateways/TodoMemoryGateway.js';
import Item from 'todo-domain/observable/Item.js';

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

describe('TodoListView integration (remote)', () => {
	test('Deve testar a tela de todo list com memory gateway — percentual', async () => {
		const gateway = new TodoMemoryGateway();
		const todoList = await createBoundTodoList(gateway);
		expect(todoList.getCompleted()).toBe(33);
	});

	test('deve adicionar item sincronizando com gateway', async () => {
		const gateway = new TodoMemoryGateway([]);
		const todoList = await createBoundTodoList(gateway);

		await todoList.addItem('Item remoto');
		const stored = await gateway.getTodos();
		expect(stored).toHaveLength(1);
		expect(stored[0].description).toBe('Item remoto');
	});

	test('deve remover item sincronizando com gateway', async () => {
		const gateway = new TodoMemoryGateway([{ id: 'r1', description: 'Remove-me', done: false }]);
		const todoList = await createBoundTodoList(gateway);

		const item = todoList.getItem('Remove-me');
		if (item) await todoList.removeItem(item);

		expect(await gateway.getTodos()).toHaveLength(0);
	});

	test('deve alternar done sincronizando com gateway', async () => {
		const gateway = new TodoMemoryGateway([{ id: 't1', description: 'Toggle', done: false }]);
		const todoList = await createBoundTodoList(gateway);

		const item = todoList.getItem('Toggle');
		if (item) await todoList.toggleDone(item);

		const stored = await gateway.getTodos();
		expect(stored[0].done).toBe(true);
	});

	test('deve sincronizar múltiplas operações', async () => {
		const gateway = new TodoMemoryGateway([]);
		const todoList = await createBoundTodoList(gateway);

		await todoList.addItem('A');
		await todoList.addItem('B');
		const a = todoList.getItem('A');
		if (a) await todoList.toggleDone(a);

		const stored = await gateway.getTodos();
		expect(stored).toHaveLength(2);
		expect(stored.find((t) => t.description === 'A')?.done).toBe(true);
	});
});
