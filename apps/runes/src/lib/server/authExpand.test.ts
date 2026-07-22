import { describe, expect, test, vi, beforeEach } from 'vitest';

const mockGetOne = vi.fn();
const mockAdminPb = {
	collection: vi.fn(() => ({ getOne: mockGetOne }))
};
vi.mock('./pocketbaseAdmin', () => ({
	getAdminClient: vi.fn().mockResolvedValue(mockAdminPb)
}));

describe('authExpand', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('fetchAuthParticipants busca cada id único', async () => {
		mockGetOne.mockResolvedValue({ id: 'a1', name: 'Alice', avatar: '' });

		const { fetchAuthParticipants } = await import('./authExpand');
		const result = await fetchAuthParticipants(['a1']);
		expect(result).toHaveLength(1);
		expect(mockGetOne).toHaveBeenCalledWith('a1', { fields: 'id,name,avatar' });
	});

	test('fetchAuthParticipants deduplica ids', async () => {
		mockGetOne.mockResolvedValue({ id: 'a1', name: 'Alice', avatar: '' });

		const { fetchAuthParticipants } = await import('./authExpand');
		const result = await fetchAuthParticipants(['a1', 'a1']);
		expect(result).toHaveLength(1);
		expect(mockGetOne).toHaveBeenCalledTimes(1);
	});

	test('fetchAuthParticipants retorna vazio para array vazio', async () => {
		const { fetchAuthParticipants } = await import('./authExpand');
		const result = await fetchAuthParticipants([]);
		expect(result).toHaveLength(0);
	});
});
