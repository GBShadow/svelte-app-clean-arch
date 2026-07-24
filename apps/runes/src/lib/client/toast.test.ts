import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { toastStore } from './toast.svelte';

describe('toastStore', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		toastStore.items = [];
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	test('add insere toast na fila', () => {
		toastStore.add('sucesso!', 'success');
		expect(toastStore.items).toHaveLength(1);
		expect(toastStore.items[0].message).toBe('sucesso!');
		expect(toastStore.items[0].type).toBe('success');
		expect(toastStore.items[0].id).toBeDefined();
	});

	test('add com tipo error', () => {
		toastStore.add('falhou', 'error');
		expect(toastStore.items[0].type).toBe('error');
	});

	test('add remove o toast após 4 segundos', () => {
		toastStore.add('some', 'success');
		expect(toastStore.items).toHaveLength(1);

		vi.advanceTimersByTime(4000);
		expect(toastStore.items).toHaveLength(0);
	});

	test('remove toast por id', () => {
		toastStore.add('msg1', 'success');
		toastStore.add('msg2', 'success');
		const id = toastStore.items[0].id;
		toastStore.remove(id);
		expect(toastStore.items).toHaveLength(1);
		expect(toastStore.items[0].message).toBe('msg2');
	});

	test('remove id inexistente não afeta a fila', () => {
		toastStore.add('msg', 'success');
		toastStore.remove('inexistente');
		expect(toastStore.items).toHaveLength(1);
	});

	test('acumula múltiplos toasts', () => {
		toastStore.add('um', 'success');
		toastStore.add('dois', 'error');
		toastStore.add('três', 'success');
		expect(toastStore.items).toHaveLength(3);
	});

	test('auto-dismiss remove apenas o toast expirado', () => {
		toastStore.add('vai sumir', 'success');
		vi.advanceTimersByTime(1000);
		toastStore.add('vai ficar', 'success');

		vi.advanceTimersByTime(3000);
		expect(toastStore.items).toHaveLength(1);
		expect(toastStore.items[0].message).toBe('vai ficar');
	});
});
