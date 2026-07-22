import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { withToast } from './enhanceWithToast';
import { toastStore } from './toast.svelte';

describe('withToast', () => {
	beforeEach(() => {
		toastStore.items = [];
	});

	test('failure adiciona toast de erro com mensagem do data.error', async () => {
		const handler = withToast();
		const update = vi.fn();
		const result = { type: 'failure', data: { error: 'Erro personalizado' } };

		await handler()({ result, update } as any);

		expect(toastStore.items).toHaveLength(1);
		expect(toastStore.items[0].type).toBe('error');
		expect(toastStore.items[0].message).toBe('Erro personalizado');
		expect(update).toHaveBeenCalledOnce();
	});

	test('failure com errors.general', async () => {
		const handler = withToast();
		const update = vi.fn();
		const result = { type: 'failure', data: { errors: { general: 'Erro geral' } } };

		await handler()({ result, update } as any);

		expect(toastStore.items[0].message).toBe('Erro geral');
	});

	test('failure sem mensagem específica usa fallback', async () => {
		const handler = withToast();
		const update = vi.fn();
		const result = { type: 'failure', data: {} };

		await handler()({ result, update } as any);

		expect(toastStore.items[0].message).toBe('Erro ao executar ação.');
	});

	test('success com successMessage adiciona toast', async () => {
		const handler = withToast({ successMessage: 'Tudo ok!' });
		const update = vi.fn();
		const result = { type: 'success' };

		await handler()({ result, update } as any);

		expect(toastStore.items).toHaveLength(1);
		expect(toastStore.items[0].type).toBe('success');
		expect(toastStore.items[0].message).toBe('Tudo ok!');
	});

	test('redirect com successMessage adiciona toast', async () => {
		const handler = withToast({ successMessage: 'Redirecionado!' });
		const update = vi.fn();
		const result = { type: 'redirect', location: '/somewhere' };

		await handler()({ result, update } as any);

		expect(toastStore.items).toHaveLength(1);
		expect(toastStore.items[0].message).toBe('Redirecionado!');
	});

	test('noSuccessToast suprime toast de sucesso', async () => {
		const handler = withToast({ successMessage: 'Não deve aparecer', noSuccessToast: true });
		const update = vi.fn();
		const result = { type: 'success' };

		await handler()({ result, update } as any);

		expect(toastStore.items).toHaveLength(0);
	});

	test('success sem successMessage não adiciona toast', async () => {
		const handler = withToast();
		const update = vi.fn();
		const result = { type: 'success' };

		await handler()({ result, update } as any);

		expect(toastStore.items).toHaveLength(0);
	});

	test('failure sem data trata objeto vazio', async () => {
		const handler = withToast();
		const update = vi.fn();
		const result = { type: 'failure', data: {} };

		await handler()({ result, update } as any);

		expect(toastStore.items[0].message).toBe('Erro ao executar ação.');
	});
});
