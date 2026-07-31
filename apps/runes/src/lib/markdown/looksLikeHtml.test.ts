import { describe, expect, test } from 'vitest';
import { looksLikeHtml } from './looksLikeHtml';

describe('looksLikeHtml', () => {
	test('detecta HTML com tags', () => {
		expect(looksLikeHtml('<p>texto</p>')).toBe(true);
	});

	test('detecta HTML com atributos', () => {
		expect(looksLikeHtml('<div class="x">conteudo</div>')).toBe(true);
	});

	test('rejeita markdown puro', () => {
		expect(looksLikeHtml('# Titulo')).toBe(false);
	});

	test('rejeita texto plano', () => {
		expect(looksLikeHtml('apenas texto')).toBe(false);
	});

	test('rejeita string vazia', () => {
		expect(looksLikeHtml('')).toBe(false);
	});

	test('detecta HTML com tag p', () => {
		expect(looksLikeHtml('<p>texto</p>')).toBe(true);
	});
});
