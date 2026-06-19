import { describe, expect, test } from 'vitest';
import { TodoListService } from './TodoListService.svelte';
import { TodoMemoryGateway } from 'todo-domain';

describe('TodoListService', () => {
	test('Deve carregar todos do gateway em memoria', async () => {
		const gateway = new TodoMemoryGateway();
		const service = new TodoListService(gateway);
		await service.load();
		expect(service.list.items).toHaveLength(3);
		expect(service.list.completedPercent).toBe(33);
	});

	test('Deve adicionar item via gateway', async () => {
		const gateway = new TodoMemoryGateway();
		const service = new TodoListService(gateway);
		await service.load();
		await service.addItem('Novo item');
		expect(service.list.items).toHaveLength(4);
		const todos = await gateway.getTodos();
		expect(todos.some((t) => t.description === 'Novo item')).toBe(true);
	});
});
