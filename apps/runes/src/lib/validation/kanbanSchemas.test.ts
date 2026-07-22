import { describe, expect, test } from 'vitest';
import {
	createColumnSchema,
	createCardSchema,
	updateCardSchema,
	moveCardSchema,
	addCommentSchema
} from './kanbanSchemas';

describe('kanbanSchemas', () => {
	test('createColumnSchema', () => {
		expect(createColumnSchema.safeParse({ name: '', projectId: 'p1' }).success).toBe(false);
		expect(createColumnSchema.safeParse({ name: 'A'.repeat(101), projectId: 'p1' }).success).toBe(false);
		expect(createColumnSchema.safeParse({ name: 'Coluna 1', projectId: 'p1' }).success).toBe(true);
	});

	test('createCardSchema', () => {
		const validCard = {
			title: 'Test Card',
			description: 'This is a test description',
			columnId: 'column-123',
			projectId: 'project-1',
			assigneeIds: ['user-1'],
			tags: ['tag1', 'tag2'],
			dueDate: '2026-12-31',
			points: 5
		};

		expect(createCardSchema.safeParse(validCard).success).toBe(true);
		expect(createCardSchema.safeParse({ ...validCard, title: '' }).success).toBe(false);
		expect(createCardSchema.safeParse({ ...validCard, columnId: '' }).success).toBe(false);
		expect(createCardSchema.safeParse({ ...validCard, dueDate: 'invalid-date' }).success).toBe(false);
	});

	test('updateCardSchema', () => {
		expect(updateCardSchema.safeParse({ cardId: '' }).success).toBe(false);
		expect(updateCardSchema.safeParse({ cardId: '123', title: 'New Title' }).success).toBe(true);
	});

	test('moveCardSchema', () => {
		expect(moveCardSchema.safeParse({ cardId: '123', columnId: 'col-1', position: 0 }).success).toBe(true);
		expect(moveCardSchema.safeParse({ cardId: '123', columnId: 'col-1', position: -1 }).success).toBe(false);
	});

	test('addCommentSchema', () => {
		expect(addCommentSchema.safeParse({ cardId: '123', text: '' }).success).toBe(false);
		expect(addCommentSchema.safeParse({ cardId: '123', text: 'A'.repeat(2001) }).success).toBe(false);
		expect(addCommentSchema.safeParse({ cardId: '123', text: 'Bom trabalho' }).success).toBe(true);
	});
});
