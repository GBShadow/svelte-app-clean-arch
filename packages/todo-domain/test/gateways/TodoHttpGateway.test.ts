import { describe, expect, test, vi } from 'vitest';
import TodoHttpGateway from '../../src/gateways/TodoHttpGateway';

function mockFetch(ok: boolean, data?: unknown): typeof fetch {
	return vi.fn().mockResolvedValue({
		ok,
		json: async () => data,
		statusText: ok ? 'OK' : 'Error'
	} as Response);
}

describe('TodoHttpGateway', () => {
	test('getTodos retorna dados do endpoint', async () => {
		const todos = [{ id: '1', description: 'Teste', done: false }];
		const fetch = mockFetch(true, todos);
		const gateway = new TodoHttpGateway(fetch, 'http://localhost');

		const result = await gateway.getTodos();
		expect(result).toEqual(todos);
		expect(fetch).toHaveBeenCalledWith('http://localhost/api/todos');
	});

	test('getTodos lança erro quando falha', async () => {
		const fetch = mockFetch(false);
		const gateway = new TodoHttpGateway(fetch, 'http://localhost');

		await expect(gateway.getTodos()).rejects.toThrow('Failed to fetch todos');
	});

	test('addItem faz POST com headers e body', async () => {
		const fetch = mockFetch(true);
		const gateway = new TodoHttpGateway(fetch, 'http://localhost');
		const item = { id: '1', description: 'Novo', done: false };

		await gateway.addItem(item);
		expect(fetch).toHaveBeenCalledWith('http://localhost/api/todos', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(item)
		});
	});

	test('addItem lança erro quando falha', async () => {
		const fetch = mockFetch(false);
		const gateway = new TodoHttpGateway(fetch, 'http://localhost');

		await expect(gateway.addItem({ id: '1', description: 'x', done: false })).rejects.toThrow(
			'Failed to add todo'
		);
	});

	test('updateItem faz PUT no endpoint com id', async () => {
		const fetch = mockFetch(true);
		const gateway = new TodoHttpGateway(fetch, 'http://localhost');
		const item = { id: 'abc', description: 'Atualizado', done: true };

		await gateway.updateItem(item);
		expect(fetch).toHaveBeenCalledWith('http://localhost/api/todos/abc', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(item)
		});
	});

	test('updateItem lança erro quando falha', async () => {
		const fetch = mockFetch(false);
		const gateway = new TodoHttpGateway(fetch, 'http://localhost');

		await expect(
			gateway.updateItem({ id: '1', description: 'x', done: true })
		).rejects.toThrow('Failed to update todo');
	});

	test('removeItem faz DELETE no endpoint com id', async () => {
		const fetch = mockFetch(true);
		const gateway = new TodoHttpGateway(fetch, 'http://localhost');

		await gateway.removeItem('abc');
		expect(fetch).toHaveBeenCalledWith('http://localhost/api/todos/abc', {
			method: 'DELETE'
		});
	});

	test('removeItem lança erro quando falha', async () => {
		const fetch = mockFetch(false);
		const gateway = new TodoHttpGateway(fetch, 'http://localhost');

		await expect(gateway.removeItem('1')).rejects.toThrow('Failed to remove todo');
	});
});
