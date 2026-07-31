import { describe, expect, test } from 'vitest';
import { normalizeMarkdown } from './normalizeMarkdown';

describe('normalizeMarkdown', () => {
	test('retorna markdown puro sem alteracao', () => {
		expect(normalizeMarkdown('# Titulo')).toBe('# Titulo');
	});

	test('converte HTML simples para markdown', () => {
		const result = normalizeMarkdown('<p><strong>negrito</strong></p>');
		expect(result).toContain('**negrito**');
	});

	test('converte Tiptap task list HTML para MD', () => {
		const result = normalizeMarkdown(
			'<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked=""><span></span></label><div><p>Feito</p></div></li></ul>'
		);
		expect(result).toContain('Feito');
		expect(result).not.toContain('<script>');
	});

	test('retorna vazio para input vazio', () => {
		expect(normalizeMarkdown('')).toBe('');
	});

	test('preserva texto plano sem tags', () => {
		expect(normalizeMarkdown('texto simples')).toBe('texto simples');
	});
});
