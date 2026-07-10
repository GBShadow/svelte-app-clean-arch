import { describe, expect, test, vi } from 'vitest';
import TodoRemoteGateway from '../../src/gateways/TodoRemoteGateway';
import type { RemoteTodoFunctions } from '../../src/gateways/TodoRemoteGateway';

function createMockRemote(): RemoteTodoFunctions {
	return {
		getTodoList: vi.fn().mockResolvedValue([]),
		addTodoItem: vi.fn().mockResolvedValue({ id: 'n1', description: '', done: false }),
		toggleTodoItem: vi.fn().mockResolvedValue(undefined),
		removeTodoItem: vi.fn().mockResolvedValue(undefined)
	};
}

describe('TodoRemoteGateway', () => {
	test('getTodos chama getTodoList', async () => {
		const remote = createMockRemote();
		const gateway = new TodoRemoteGateway(remote);

		await gateway.getTodos();
		expect(remote.getTodoList).toHaveBeenCalledOnce();
	});

	test('getTodos retorna o resultado de getTodoList', async () => {
		const expected = [{ id: '1', description: 'Item', done: false }];
		const remote = createMockRemote();
		vi.mocked(remote.getTodoList).mockResolvedValue(expected);
		const gateway = new TodoRemoteGateway(remote);

		const result = await gateway.getTodos();
		expect(result).toEqual(expected);
	});

	test('addItem chama addTodoItem com description', async () => {
		const remote = createMockRemote();
		const gateway = new TodoRemoteGateway(remote);

		await gateway.addItem({ id: '1', description: 'Tarefa', done: false });
		expect(remote.addTodoItem).toHaveBeenCalledWith({ description: 'Tarefa' });
	});

	test('updateItem chama toggleTodoItem com id e done', async () => {
		const remote = createMockRemote();
		const gateway = new TodoRemoteGateway(remote);

		await gateway.updateItem({ id: 'abc', description: 'x', done: true });
		expect(remote.toggleTodoItem).toHaveBeenCalledWith({ id: 'abc', done: true });
	});

	test('removeItem chama removeTodoItem com id', async () => {
		const remote = createMockRemote();
		const gateway = new TodoRemoteGateway(remote);

		await gateway.removeItem('xyz');
		expect(remote.removeTodoItem).toHaveBeenCalledWith({ id: 'xyz' });
	});
});
