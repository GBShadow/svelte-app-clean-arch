import { describe, expect, test } from 'vitest';
import TodoList from 'todo-domain/observable/TodoList.js';
import TodoMemoryGateway from 'todo-domain/gateways/TodoMemoryGateway.js';

describe('TodoListView integration (remote)', () => {
	test('Deve testar a tela de todo list com memory gateway', async () => {
		const gateway = new TodoMemoryGateway();
		const todoList = TodoList.fromDTO(await gateway.getTodos());
		expect(todoList.getCompleted()).toBe(33);
	});
});
