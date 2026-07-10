import { describe, expect, test, vi } from 'vitest';
import Observable from '../../src/observable/Observable';
import Observer from '../../src/observable/Observer';

describe('Observable', () => {
	test('register adiciona observer à lista', () => {
		const observable = new Observable();
		const observer = new Observer('test', () => {});
		observable.register(observer);
		expect(observable.observers).toHaveLength(1);
		expect(observable.observers[0]).toBe(observer);
	});

	test('notify chama callback de observers com evento correspondente', () => {
		const observable = new Observable();
		const callback = vi.fn();
		const observer = new Observer('foo', callback);
		observable.register(observer);

		observable.notify('foo', 'data');

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith('data');
	});

	test('notify não chama callback de observers com evento diferente', () => {
		const observable = new Observable();
		const callback = vi.fn();
		const observer = new Observer('foo', callback);
		observable.register(observer);

		observable.notify('bar', 'data');

		expect(callback).not.toHaveBeenCalled();
	});

	test('notify chama múltiplos observers registrados para o mesmo evento', () => {
		const observable = new Observable();
		const callback1 = vi.fn();
		const callback2 = vi.fn();
		observable.register(new Observer('evt', callback1));
		observable.register(new Observer('evt', callback2));

		observable.notify('evt', 'payload');

		expect(callback1).toHaveBeenCalledOnce();
		expect(callback2).toHaveBeenCalledOnce();
	});

	test('notify não quebra se não houver observers', () => {
		const observable = new Observable();
		expect(() => observable.notify('qualquer', {})).not.toThrow();
	});
});

describe('Observer', () => {
	test('armazena evento e callback', () => {
		const fn = () => {};
		const observer = new Observer('meu-evento', fn);
		expect(observer.event).toBe('meu-evento');
		expect(observer.callback).toBe(fn);
	});

	test('callback pode ser async', async () => {
		let called = false;
		const observer = new Observer('async', async () => {
			await Promise.resolve();
			called = true;
		});
		await observer.callback({});
		expect(called).toBe(true);
	});
});
