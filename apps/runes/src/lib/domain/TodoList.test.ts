import { describe, expect, test } from 'vitest';
import { TodoList } from './TodoList.svelte';

describe('TodoList (runes)', () => {
	test('Deve criar uma todo list com 3 itens', () => {
		const todoList = new TodoList();
		todoList.addItem('a');
		todoList.addItem('b');
		todoList.addItem('c');
		expect(todoList.completedPercent).toBe(0);
	});

	test('Deve criar uma todo list com 3 itens e 2 done', () => {
		const todoList = new TodoList();
		todoList.addItem('a');
		todoList.addItem('b');
		todoList.addItem('c');
		const a = todoList.getItem('a');
		if (a) todoList.toggleDone(a);
		const c = todoList.getItem('c');
		if (c) todoList.toggleDone(c);
		expect(todoList.completedPercent).toBe(67);
	});

	test('Deve criar uma todo list com 3 itens e apagar um', () => {
		const todoList = new TodoList();
		todoList.addItem('a');
		todoList.addItem('b');
		todoList.addItem('c');
		const c = todoList.getItem('c');
		if (c) todoList.removeItem(c);
		expect(todoList.items).toHaveLength(2);
	});
});
