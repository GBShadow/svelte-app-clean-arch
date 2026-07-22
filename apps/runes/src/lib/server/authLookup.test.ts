import { describe, expect, test, vi, beforeEach } from 'vitest';

const mockGetFirstListItem = vi.fn();
const mockFilter = vi.fn((template: string, params: Record<string, any>) => {
	let result = template;
	for (const [key, val] of Object.entries(params)) {
		result = result.replace(`{:${key}}`, `'${val}'`);
	}
	return result;
});
const mockAdminPb = {
	collection: vi.fn(() => ({ getFirstListItem: mockGetFirstListItem })),
	filter: mockFilter
};
vi.mock('./pocketbaseAdmin', () => ({
	getAdminClient: vi.fn().mockResolvedValue(mockAdminPb)
}));

describe('authLookup', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('findAuthRecordByEmail busca com filtro', async () => {
		mockGetFirstListItem.mockResolvedValue({ id: 'auth1', email: 'user@test.com' });

		const { findAuthRecordByEmail } = await import('./authLookup');
		const result = await findAuthRecordByEmail('user@test.com');
		expect(result.email).toBe('user@test.com');
		expect(mockGetFirstListItem).toHaveBeenCalledWith(
			expect.stringContaining('email')
		);
	});
});
