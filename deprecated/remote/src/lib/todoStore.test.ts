import { describe, expect, test, beforeEach } from 'vitest';
import {
	addTodo,
	createTodo,
	getTodos,
	removeTodo,
	resetStore,
	updateTodo
} from './server/todoStore';

beforeEach(() => {
	resetStore();
});

describe('todoStore (remote)', () => {
	test('getTodos retorna os seed todos', () => {
		const todos = getTodos();
		expect(todos).toHaveLength(3);
		expect(todos[0].description).toBe('Estudar TypeScript');
		expect(todos[1].description).toBe('Fazer a prova online');
		expect(todos[2].description).toBe('Cortar a grama');
	});

	test('getTodos retorna clone independente', () => {
		const a = getTodos();
		const b = getTodos();
		expect(a).toEqual(b);
		expect(a).not.toBe(b);
	});

	test('createTodo cria DTO válido', () => {
		const todo = createTodo('Tarefa remota');
		expect(todo.id).toBeTruthy();
		expect(todo.description).toBe('Tarefa remota');
		expect(todo.done).toBe(false);
	});

	test('addTodo insere item no final', () => {
		const before = getTodos().length;
		addTodo({ id: 'r1', description: 'Remoto', done: true });
		expect(getTodos()).toHaveLength(before + 1);
		expect(getTodos()[before].description).toBe('Remoto');
	});

	test('updateTodo altera done', () => {
		const targetId = getTodos()[0].id;
		updateTodo(targetId, true);
		expect(getTodos().find((t) => t.id === targetId)?.done).toBe(true);
	});

	test('updateTodo ignora id inexistente', () => {
		expect(() => updateTodo('fake', true)).not.toThrow();
	});

	test('removeTodo remove pelo id', () => {
		const targetId = getTodos()[0].id;
		removeTodo(targetId);
		expect(getTodos().find((t) => t.id === targetId)).toBeUndefined();
	});

	test('removeTodo não quebra se id inexistente', () => {
		expect(() => removeTodo('fake')).not.toThrow();
	});

	test('resetStore restaura seed', () => {
		addTodo({ id: 'x', description: 'Extra', done: false });
		resetStore();
		expect(getTodos()).toHaveLength(3);
	});

	test('resetStore aceita array customizado', () => {
		resetStore([{ id: 'c1', description: 'Custom', done: false }]);
		expect(getTodos()).toHaveLength(1);
	});
});
