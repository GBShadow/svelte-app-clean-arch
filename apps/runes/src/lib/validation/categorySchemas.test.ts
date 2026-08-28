import { describe, it, expect } from 'vitest';
import {
	createCategorySchema,
	updateCategorySchema,
	deleteCategorySchema
} from './categorySchemas';

describe('categorySchemas', () => {
	describe('createCategorySchema', () => {
		it('should validate valid name and description', () => {
			const result = createCategorySchema.safeParse({
				name: 'Frontend',
				description: 'Tarefas de interface e UI'
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe('Frontend');
				expect(result.data.description).toBe('Tarefas de interface e UI');
			}
		});

		it('should allow optional empty description', () => {
			const result = createCategorySchema.safeParse({
				name: 'Backend'
			});
			expect(result.success).toBe(true);
		});

		it('should fail when name is empty or only whitespace', () => {
			const resultEmpty = createCategorySchema.safeParse({ name: '' });
			expect(resultEmpty.success).toBe(false);

			const resultWhitespace = createCategorySchema.safeParse({ name: '   ' });
			expect(resultWhitespace.success).toBe(false);
		});

		it('should fail when name exceeds 50 characters', () => {
			const result = createCategorySchema.safeParse({
				name: 'a'.repeat(51)
			});
			expect(result.success).toBe(false);
		});

		it('should fail when description exceeds 250 characters', () => {
			const result = createCategorySchema.safeParse({
				name: 'Segurança',
				description: 'a'.repeat(251)
			});
			expect(result.success).toBe(false);
		});
	});

	describe('updateCategorySchema', () => {
		it('should validate valid update payload', () => {
			const result = updateCategorySchema.safeParse({
				id: 'cat123',
				name: 'DevOps & Infra',
				description: 'Infraestrutura e CI/CD'
			});
			expect(result.success).toBe(true);
		});

		it('should fail when id is missing', () => {
			const result = updateCategorySchema.safeParse({
				name: 'Sem ID'
			});
			expect(result.success).toBe(false);
		});
	});

	describe('deleteCategorySchema', () => {
		it('should validate valid delete payload', () => {
			const result = deleteCategorySchema.safeParse({
				id: 'cat123'
			});
			expect(result.success).toBe(true);
		});

		it('should fail when id is empty', () => {
			const result = deleteCategorySchema.safeParse({
				id: ''
			});
			expect(result.success).toBe(false);
		});
	});
});
