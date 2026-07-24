import { describe, expect, test, vi, beforeEach } from 'vitest';

vi.mock('$app/environment');

const STORAGE_KEY = 'accent';

async function createAccent(browser: boolean, storage: Record<string, string> = {}) {
	vi.mocked(await import('$app/environment')).browser = browser;

	Object.defineProperty(globalThis, 'localStorage', {
		value: {
			getItem: vi.fn((key: string) => storage[key] ?? null),
			setItem: vi.fn((key: string, value: string) => { storage[key] = value; })
		},
		configurable: true
	});

	const dataset: Record<string, string> = {};
	Object.defineProperty(globalThis, 'document', {
		value: { documentElement: { dataset } },
		configurable: true
	});

	vi.resetModules();
	const mod = await import('./accent.svelte');
	return { accent: mod.accent, storage, dataset };
}

describe('accent com browser', () => {
	test('default é magenta', async () => {
		const { accent } = await createAccent(true);
		expect(accent.value).toBe('magenta');
	});

	test('set atualiza value, localStorage e dataset', async () => {
		const { accent, storage, dataset } = await createAccent(true);
		accent.set('ciano');
		expect(accent.value).toBe('ciano');
		expect(storage[STORAGE_KEY]).toBe('ciano');
		expect(dataset['accent']).toBe('ciano');
	});

	test('construtor lê valor salvo no localStorage', async () => {
		const { accent } = await createAccent(true, { [STORAGE_KEY]: 'verde' });
		expect(accent.value).toBe('verde');
	});
});

describe('accent sem browser', () => {
	test('default é magenta', async () => {
		const { accent } = await createAccent(false);
		expect(accent.value).toBe('magenta');
	});

	test('set não acessa localStorage', async () => {
		const { accent, storage } = await createAccent(false);
		accent.set('roxo');
		expect(accent.value).toBe('roxo');
		expect(storage[STORAGE_KEY]).toBeUndefined();
	});
});
