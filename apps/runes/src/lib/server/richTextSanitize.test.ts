import { describe, expect, test } from 'vitest';
import { RICH_TEXT_ALLOWED_TAGS, RICH_TEXT_ALLOWED_ATTRIBUTES } from './richTextSanitize';

describe('richTextSanitize', () => {
	test('exporta tags com headings, listas, tabelas, task list', () => {
		expect(RICH_TEXT_ALLOWED_TAGS).toContain('h1');
		expect(RICH_TEXT_ALLOWED_TAGS).toContain('h2');
		expect(RICH_TEXT_ALLOWED_TAGS).toContain('h3');
		expect(RICH_TEXT_ALLOWED_TAGS).toContain('ul');
		expect(RICH_TEXT_ALLOWED_TAGS).toContain('ol');
		expect(RICH_TEXT_ALLOWED_TAGS).toContain('li');
		expect(RICH_TEXT_ALLOWED_TAGS).toContain('table');
		expect(RICH_TEXT_ALLOWED_TAGS).toContain('input');
		expect(RICH_TEXT_ALLOWED_TAGS).toContain('label');
		expect(RICH_TEXT_ALLOWED_TAGS).toContain('a');
		expect(RICH_TEXT_ALLOWED_TAGS).toContain('img');
		expect(RICH_TEXT_ALLOWED_TAGS).toContain('code');
		expect(RICH_TEXT_ALLOWED_TAGS).toContain('pre');
	});

	test('exporta atributos com href, src e input checkbox', () => {
		expect(RICH_TEXT_ALLOWED_ATTRIBUTES).toHaveProperty('a');
		expect(RICH_TEXT_ALLOWED_ATTRIBUTES).toHaveProperty('img');
		expect(RICH_TEXT_ALLOWED_ATTRIBUTES).toHaveProperty('input');
	});

	test('nao exporta tags de script ou style', () => {
		expect(RICH_TEXT_ALLOWED_TAGS).not.toContain('script');
		expect(RICH_TEXT_ALLOWED_TAGS).not.toContain('style');
	});
});
