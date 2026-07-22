import { describe, expect, test, vi, beforeEach } from 'vitest';

const mockCreate = vi.fn();
const mockAdminPb = {
	collection: vi.fn(() => ({ create: mockCreate }))
};
vi.mock('./pocketbaseAdmin', () => ({
	getAdminClient: vi.fn().mockResolvedValue(mockAdminPb)
}));

describe('kanbanHistory', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('recordCardHistory', () => {
		test('cria registro de histórico', async () => {
			const { recordCardHistory } = await import('./kanbanHistory');
			await recordCardHistory('card1', 'user1', 'title');
			expect(mockCreate).toHaveBeenCalledWith({ card: 'card1', user: 'user1', field: 'title' });
		});
	});

	describe('recordCardChanges', () => {
		test('registra campo que mudou', async () => {
			const { recordCardChanges } = await import('./kanbanHistory');
			await recordCardChanges('c1', 'u1', { title: 'old' }, { title: 'new' });
			expect(mockCreate).toHaveBeenCalledWith({ card: 'c1', user: 'u1', field: 'title' });
		});

		test('não registra campo que não mudou', async () => {
			const { recordCardChanges } = await import('./kanbanHistory');
			await recordCardChanges('c1', 'u1', { title: 'same' }, { title: 'same' });
			expect(mockCreate).not.toHaveBeenCalled();
		});

		test('ignora campo undefined em newData', async () => {
			const { recordCardChanges } = await import('./kanbanHistory');
			await recordCardChanges('c1', 'u1', { title: 'old' }, {});
			expect(mockCreate).not.toHaveBeenCalled();
		});

		test('detecta mudança em array de assignees', async () => {
			const { recordCardChanges } = await import('./kanbanHistory');
			await recordCardChanges('c1', 'u1', { assignees: ['a', 'b'] }, { assignees: ['a', 'b', 'c'] });
			expect(mockCreate).toHaveBeenCalledWith({ card: 'c1', user: 'u1', field: 'assignees' });
		});

		test('não detecta mudança em array com mesma ordenação diferente', async () => {
			const { recordCardChanges } = await import('./kanbanHistory');
			await recordCardChanges('c1', 'u1', { assignees: ['a', 'b'] }, { assignees: ['b', 'a'] });
			expect(mockCreate).not.toHaveBeenCalled();
		});

		test('trata null como string vazia', async () => {
			const { recordCardChanges } = await import('./kanbanHistory');
			await recordCardChanges('c1', 'u1', { title: null }, { title: 'new' });
			expect(mockCreate).toHaveBeenCalledWith({ card: 'c1', user: 'u1', field: 'title' });
		});

		test('registra múltiplos campos que mudaram', async () => {
			const { recordCardChanges } = await import('./kanbanHistory');
			await recordCardChanges('c1', 'u1', { title: 'old', points: 3 }, { title: 'new', points: 5 });
			expect(mockCreate).toHaveBeenCalledTimes(2);
		});
	});
});
