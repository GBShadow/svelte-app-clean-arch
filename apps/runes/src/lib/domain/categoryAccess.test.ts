import { describe, it, expect } from 'vitest';
import {
	canManageCategories,
	canViewCategories,
	formatCategoryBadge,
	sortCategoriesByName
} from './categoryAccess';

describe('categoryAccess', () => {
	describe('authorization', () => {
		it('allows authenticated users to view categories', () => {
			expect(canViewCategories('user123')).toBe(true);
		});

		it('denies unauthenticated/anonymous users to view categories', () => {
			expect(canViewCategories(undefined)).toBe(false);
			expect(canViewCategories('')).toBe(false);
		});

		it('allows authenticated users to manage categories', () => {
			expect(canManageCategories('user123')).toBe(true);
		});

		it('denies unauthenticated users to manage categories', () => {
			expect(canManageCategories(undefined)).toBe(false);
			expect(canManageCategories('')).toBe(false);
		});
	});

	describe('helpers', () => {
		it('formats category badge text cleanly', () => {
			expect(formatCategoryBadge({ id: '1', name: '  Frontend  ' })).toBe('Frontend');
			expect(formatCategoryBadge(null)).toBe('');
		});

		it('sorts categories alphabetically case-insensitive', () => {
			const categories = [
				{ id: '1', name: 'Zup' },
				{ id: '2', name: 'alpha' },
				{ id: '3', name: 'Beta' }
			];
			const sorted = sortCategoriesByName(categories);
			expect(sorted.map((c) => c.name)).toEqual(['alpha', 'Beta', 'Zup']);
		});
	});
});
