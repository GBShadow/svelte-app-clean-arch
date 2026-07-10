import { describe, expect, test } from 'vitest';
import TodoList from '../../src/observable/TodoList';
import Item from '../../src/observable/Item';
import Observer from '../../src/observable/Observer';
import type { TodoItemDTO } from '../../src/types';

describe('TodoList (observable)', () => {
	test('cria lista vazia por padrão', () => {
		const todoList = new TodoList();
		expect(todoList.items).toHaveLength(0);
	});

	test('cria lista a partir de DTOs', () => {
		const dtos: TodoItemDTO[] = [
			{ id: '1', description: 'a', done: false },
			{ id: '2', description: 'b', done: true }
		];
		const todoList = new TodoList(dtos);
		expect(todoList.items).toHaveLength(2);
		expect(todoList.items[0].description).toBe('a');
		expect(todoList.items[1].done).toBe(true);
	});

	test('fromDTO cria lista estática', () => {
		const dtos: TodoItemDTO[] = [{ id: '1', description: 'x', done: false }];
		const todoList = TodoList.fromDTO(dtos);
		expect(todoList).toBeInstanceOf(TodoList);
		expect(todoList.items).toHaveLength(1);
	});

	test('toDTO retorna array de DTOs', () => {
		const todoList = new TodoList([
			{ id: 'a', description: 'Item A', done: true }
		]);
		const dtos = todoList.toDTO();
		expect(dtos).toHaveLength(1);
		expect(dtos[0]).toEqual({ id: 'a', description: 'Item A', done: true });
	});

	test('addItem adiciona item à lista', async () => {
		const todoList = new TodoList();
		await todoList.addItem('Nova tarefa');
		expect(todoList.items).toHaveLength(1);
		expect(todoList.items[0].description).toBe('Nova tarefa');
	});

	test('addItem não adiciona se description for vazia', async () => {
		const todoList = new TodoList();
		await todoList.addItem('');
		expect(todoList.items).toHaveLength(0);
	});

	test('addItem não adiciona item duplicado', async () => {
		const todoList = new TodoList();
		await todoList.addItem('Único');
		await todoList.addItem('Único');
		expect(todoList.items).toHaveLength(1);
	});

	test('addItem não adiciona se já houver 5 itens não-feitos', async () => {
		const todoList = new TodoList();
		await todoList.addItem('a');
		await todoList.addItem('b');
		await todoList.addItem('c');
		await todoList.addItem('d');
		await todoList.addItem('e');
		// 5 itens não-feitos — o sexto não deve entrar
		await todoList.addItem('f');
		expect(todoList.items).toHaveLength(5);
	});

	test('addItem permite mais itens se alguns estiverem feitos', async () => {
		const todoList = new TodoList();
		await todoList.addItem('a');
		await todoList.addItem('b');
		await todoList.addItem('c');
		await todoList.addItem('d');
		await todoList.addItem('e');
		// marca 'a' como feito
		const a = todoList.getItem('a');
		if (a) await todoList.toggleDone(a);
		// agora deve deixar adicionar mais um (max 5 não-feitos)
		await todoList.addItem('f');
		expect(todoList.items).toHaveLength(6);
	});

	test('removeItem remove item da lista', async () => {
		const todoList = new TodoList();
		await todoList.addItem('a');
		await todoList.addItem('b');
		const b = todoList.getItem('b');
		if (b) await todoList.removeItem(b);
		expect(todoList.items).toHaveLength(1);
		expect(todoList.items[0].description).toBe('a');
	});

	test('toggleDone alterna estado done', async () => {
		const todoList = new TodoList();
		await todoList.addItem('a');
		const item = todoList.getItem('a');
		expect(item?.done).toBe(false);

		if (item) await todoList.toggleDone(item);
		expect(item?.done).toBe(true);

		if (item) await todoList.toggleDone(item);
		expect(item?.done).toBe(false);
	});

	test('getCompleted retorna 0 para lista vazia', () => {
		const todoList = new TodoList();
		expect(todoList.getCompleted()).toBe(0);
	});

	test('getCompleted calcula percentual arredondado', async () => {
		const todoList = new TodoList();
		await todoList.addItem('a');
		await todoList.addItem('b');
		await todoList.addItem('c');
		expect(todoList.getCompleted()).toBe(0);

		const a = todoList.getItem('a');
		if (a) await todoList.toggleDone(a);
		// 1 de 3 = 33%
		expect(todoList.getCompleted()).toBe(33);

		const b = todoList.getItem('b');
		if (b) await todoList.toggleDone(b);
		// 2 de 3 = 67%
		expect(todoList.getCompleted()).toBe(67);
	});

	test('getCompleted retorna 100 quando todos estão feitos', async () => {
		const todoList = new TodoList();
		await todoList.addItem('a');
		const a = todoList.getItem('a');
		if (a) await todoList.toggleDone(a);
		expect(todoList.getCompleted()).toBe(100);
	});

	test('getItem retorna undefined para item inexistente', () => {
		const todoList = new TodoList();
		expect(todoList.getItem('inexistente')).toBeUndefined();
	});

	test('getItem encontra item pela descrição', async () => {
		const todoList = new TodoList();
		await todoList.addItem('Encontre-me');
		const item = todoList.getItem('Encontre-me');
		expect(item).toBeDefined();
		expect(item!.description).toBe('Encontre-me');
	});

	test('notifica observers em addItem', async () => {
		const todoList = new TodoList();
		let notified: unknown = null;
		todoList.register(new Observer('addItem', (data) => { notified = data; }));

		await todoList.addItem('Notificar');
		expect(notified).toBeInstanceOf(Item);
		expect((notified as Item).description).toBe('Notificar');
	});

	test('notifica observers em removeItem', async () => {
		const todoList = new TodoList();
		await todoList.addItem('remover');

		let notified: unknown = null;
		todoList.register(new Observer('removeItem', (data) => { notified = data; }));

		const item = todoList.getItem('remover');
		if (item) await todoList.removeItem(item);
		expect(notified).toBeInstanceOf(Item);
	});

	test('notifica observers em toggleDone', async () => {
		const todoList = new TodoList();
		await todoList.addItem('alternar');

		let notified: unknown = null;
		todoList.register(new Observer('toggleDone', (data) => { notified = data; }));

		const item = todoList.getItem('alternar');
		if (item) await todoList.toggleDone(item);
		expect(notified).toBeInstanceOf(Item);
	});
});
