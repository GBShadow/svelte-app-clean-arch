import { describe, expect, test } from 'vitest';
import {
	canCreateCard,
	canUpdateCard,
	canDeleteCard,
	canManageColumns,
	canDeleteColumn,
	reorderPositions,
	recalculatePositions
} from './kanbanAccess';

describe('kanbanAccess - Cards', () => {
	test('canCreateCard', () => {
		expect(canCreateCard('user1')).toBe(true);
		expect(canCreateCard(undefined)).toBe(false);
	});

	test('canUpdateCard', () => {
		expect(canUpdateCard('user1')).toBe(true);
		expect(canUpdateCard(undefined)).toBe(false);
	});

	test('canDeleteCard', () => {
		const card = { created_by: 'user1' };
		expect(canDeleteCard('user1', card)).toBe(true);
		expect(canDeleteCard('user2', card)).toBe(false);
		expect(canDeleteCard(undefined, card)).toBe(false);
	});
});

describe('kanbanAccess - Columns', () => {
	test('canManageColumns', () => {
		expect(canManageColumns({ isAdmin: true })).toBe(true);
		expect(canManageColumns({ isAdmin: false })).toBe(false);
		expect(canManageColumns(undefined)).toBe(false);
	});

	test('canDeleteColumn', () => {
		const customCol = { type: 'custom' as const };
		const backlogCol = { type: 'backlog' as const };
		const doneCol = { type: 'done' as const };

		const admin = { isAdmin: true };
		const normalUser = { isAdmin: false };

		expect(canDeleteColumn(admin, customCol)).toBe(true);
		expect(canDeleteColumn(admin, backlogCol)).toBe(false);
		expect(canDeleteColumn(admin, doneCol)).toBe(false);

		expect(canDeleteColumn(normalUser, customCol)).toBe(false);
		expect(canDeleteColumn(undefined, customCol)).toBe(false);
	});
});

describe('kanbanAccess - reorderPositions', () => {
	test('reordena item movido para cima', () => {
		const items = [
			{ id: '1', position: 0 },
			{ id: '2', position: 1 },
			{ id: '3', position: 2 }
		];
		const result = reorderPositions(items, '3', 0);
		expect(result).toEqual([
			{ id: '3', position: 0 },
			{ id: '1', position: 1 },
			{ id: '2', position: 2 }
		]);
	});

	test('reordena item movido para baixo', () => {
		const items = [
			{ id: '1', position: 0 },
			{ id: '2', position: 1 },
			{ id: '3', position: 2 }
		];
		const result = reorderPositions(items, '1', 2);
		expect(result).toEqual([
			{ id: '2', position: 0 },
			{ id: '3', position: 1 },
			{ id: '1', position: 2 }
		]);
	});

	test('preserva posições contíguas', () => {
		const items = [
			{ id: '1', position: 10 },
			{ id: '2', position: 20 },
			{ id: '3', position: 30 }
		];
		const result = reorderPositions(items, '3', 0);
		expect(result).toEqual([
			{ id: '3', position: 0 },
			{ id: '1', position: 1 },
			{ id: '2', position: 2 }
		]);
	});

	test('retorna a mesma lista se id não existir', () => {
		const items = [
			{ id: '1', position: 0 },
			{ id: '2', position: 1 }
		];
		const result = reorderPositions(items, '999', 0);
		expect(result).toBe(items);
	});
});

describe('kanbanAccess - recalculatePositions', () => {
	test('garante posições contíguas a partir de 0', () => {
		const items = [
			{ id: '1', position: 5 },
			{ id: '3', position: 12 }
		];
		const result = recalculatePositions(items);
		expect(result).toEqual([
			{ id: '1', position: 0 },
			{ id: '3', position: 1 }
		]);
	});
});
