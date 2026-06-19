import { describe, expect, test } from 'vitest';
import TodoList from 'todo-domain/observable/TodoList.js';
import Observer from 'todo-domain/observable/Observer.js';
import TodoMemoryGateway from 'todo-domain/gateways/TodoMemoryGateway.js';
import type Item from 'todo-domain/observable/Item.js';

describe('TodoListView integration (classic)', () => {
	test('Deve testar a tela de todo list com memory gateway', async () => {
		const gateway = new TodoMemoryGateway();
		const todoList = TodoList.fromDTO(await gateway.getTodos());

		todoList.register(
			new Observer('addItem', async (item) => {
				await gateway.addItem((item as Item).toDTO());
			})
		);

		expect(todoList.getCompleted()).toBe(33);
	});
});
