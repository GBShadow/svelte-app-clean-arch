import { describe, expect, test } from 'vitest';
import { TodoListService } from '$lib/domain/TodoListService.svelte';
import { TodoMemoryGateway } from 'todo-domain';

describe('TodoListView integration (runes)', () => {
	test('Deve testar a tela de todo list com memory gateway', async () => {
		const gateway = new TodoMemoryGateway();
		const service = new TodoListService(gateway);
		await service.load();
		expect(service.list.completedPercent).toBe(33);
	});
});
