import { describe, expect, test } from 'vitest';
import { renderMarkdownSafe } from './renderMarkdownSafe';

describe('renderMarkdownSafe', () => {
	test('renderiza markdown basico', () => {
		const result = renderMarkdownSafe('**negrito** e *italico*');
		expect(result).toContain('<strong>negrito</strong>');
		expect(result).toContain('<em>italico</em>');
	});

	test('renderiza headings', () => {
		const result = renderMarkdownSafe('# Titulo');
		expect(result).toContain('<h1');
		expect(result).toContain('Titulo');
	});

	test('strip script tags', () => {
		const result = renderMarkdownSafe('<script>alert("xss")</script>');
		expect(result).not.toContain('<script>');
		expect(result).not.toContain('alert');
	});

	test('strip javascript links', () => {
		const result = renderMarkdownSafe('[click](javascript:alert(1))');
		expect(result).not.toContain('javascript');
	});

	test('permite links http e https', () => {
		const result = renderMarkdownSafe('[link](https://example.com)');
		expect(result).toContain('href="https://example.com"');
	});

	test('renderiza task list GFM', () => {
		const result = renderMarkdownSafe('- [x] Feito\n- [ ] Pendente');
		expect(result).toContain('checked');
		expect(result).toContain('disabled');
	});

	test('renderiza listas', () => {
		const result = renderMarkdownSafe('- item 1\n- item 2');
		expect(result).toContain('<ul>');
		expect(result).toContain('<li>');
	});

	test('renderiza codigo', () => {
		const result = renderMarkdownSafe('`codigo`');
		expect(result).toContain('<code>');
	});

	test('retorna vazio para input vazio', () => {
		expect(renderMarkdownSafe('')).toBe('');
	});
});
