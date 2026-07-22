import { describe, expect, test } from 'vitest';
import { TASK_LIST_SANITIZE_TAGS, TASK_LIST_SANITIZE_ATTRIBUTES } from './richTextSanitize';

describe('richTextSanitize', () => {
	test('exporta tags do task list', () => {
		expect(TASK_LIST_SANITIZE_TAGS).toEqual(['input', 'label']);
	});

	test('exporta atributos para ul, li e input', () => {
		expect(TASK_LIST_SANITIZE_ATTRIBUTES).toEqual({
			ul: ['data-type'],
			li: ['data-type', 'data-checked'],
			input: ['type', 'checked', 'disabled']
		});
	});
});
