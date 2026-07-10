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

describe('todoStore (classic)', () => {
	test('getTodos retorna os seed todos', () => {
		const todos = getTodos();
		expect(todos).toHaveLength(3);
		expect(todos[0].description).toBe('Estudar TypeScript');
		expect(todos[1].description).toBe('Fazer a prova online');
		expect(todos[2].description).toBe('Cortar a grama');
	});

	test('getTodos retorna um clone', () => {
		const a = getTodos();
		const b = getTodos();
		expect(a).toEqual(b);
		expect(a).not.toBe(b);
	});

	test('createTodo cria DTO com id, descrição e done=false', () => {
		const todo = createTodo('Minha tarefa');
		expect(todo.id).toBeTruthy();
		expect(todo.description).toBe('Minha tarefa');
		expect(todo.done).toBe(false);
	});

	test('createTodo gera ids diferentes', () => {
		const t1 = createTodo('a');
		const t2 = createTodo('b');
		expect(t1.id).not.toBe(t2.id);
	});

	test('addTodo adiciona item ao final', () => {
		addTodo({ id: 'novo', description: 'Novo item', done: false });
		const todos = getTodos();
		expect(todos).toHaveLength(4);
		expect(todos[3].description).toBe('Novo item');
	});

	test('updateTodo altera done do item existente', () => {
		const todos = getTodos();
		const targetId = todos[0].id;
		updateTodo(targetId, true);
		const updated = getTodos();
		expect(updated.find((t) => t.id === targetId)?.done).toBe(true);
	});

	test('updateTodo não quebra se id não existir', () => {
		expect(() => updateTodo('inexistente', true)).not.toThrow();
	});

	test('removeTodo remove item pelo id', () => {
		const before = getTodos();
		const targetId = before[0].id;
		removeTodo(targetId);
		const after = getTodos();
		expect(after).toHaveLength(before.length - 1);
		expect(after.find((t) => t.id === targetId)).toBeUndefined();
	});

	test('removeTodo não quebra se id não existir', () => {
		expect(() => removeTodo('inexistente')).not.toThrow();
	});

	test('resetStore restaura para seed padrão', () => {
		addTodo({ id: 'x', description: 'Extra', done: false });
		resetStore();
		expect(getTodos()).toHaveLength(3);
	});

	test('resetStore aceita array personalizado', () => {
		const custom = [{ id: 'c1', description: 'Custom', done: true }];
		resetStore(custom);
		expect(getTodos()).toHaveLength(1);
		expect(getTodos()[0].description).toBe('Custom');
	});
});
