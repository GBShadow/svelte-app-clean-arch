import { describe, expect, test } from 'vitest';
import TodoList from '../../src/observable/TodoList';

describe('TodoList (observable)', () => {
	test('Deve criar uma todo list com 3 itens', async () => {
		const todoList = new TodoList();
		await todoList.addItem('a');
		await todoList.addItem('b');
		await todoList.addItem('c');
		expect(todoList.getCompleted()).toBe(0);
	});

	test('Deve criar uma todo list com 3 itens e 2 done', async () => {
		const todoList = new TodoList();
		await todoList.addItem('a');
		await todoList.addItem('b');
		await todoList.addItem('c');
		const a = todoList.getItem('a');
		if (a) await todoList.toggleDone(a);
		const c = todoList.getItem('c');
		if (c) await todoList.toggleDone(c);
		expect(todoList.getCompleted()).toBe(67);
	});

	test('Deve criar uma todo list com 3 itens e apagar um', async () => {
		const todoList = new TodoList();
		await todoList.addItem('a');
		await todoList.addItem('b');
		await todoList.addItem('c');
		const c = todoList.getItem('c');
		if (c) await todoList.removeItem(c);
		expect(todoList.items).toHaveLength(2);
	});
});
