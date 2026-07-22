import { describe, expect, test, vi, beforeEach } from 'vitest';

const mockCreate = vi.fn();
const mockGetList = vi.fn();
const mockGetFullList = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFilter = vi.fn((template: string, params: Record<string, any>) => {
	let result = template;
	for (const [key, val] of Object.entries(params)) {
		result = result.replace(`{:${key}}`, `'${val}'`);
	}
	return result;
});
const mockAdminPb = {
	collection: vi.fn(() => ({
		create: mockCreate,
		getList: mockGetList,
		getFullList: mockGetFullList,
		update: mockUpdate,
		delete: mockDelete
	})),
	filter: mockFilter
};
vi.mock('$lib/server/pocketbaseAdmin', () => ({
	getAdminClient: vi.fn().mockResolvedValue(mockAdminPb)
}));

vi.mock('$lib/domain/notification', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...(actual as any),
		isSafeRedirectUrl: vi.fn()
	};
});

import { isSafeRedirectUrl } from '$lib/domain/notification';

describe('notificationStore', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('resolveUserIdsToAuthIds', () => {
		test('retorna Map vazio para array vazio', async () => {
			const { resolveUserIdsToAuthIds } = await import('./notificationStore');
			const result = await resolveUserIdsToAuthIds([]);
			expect(result.size).toBe(0);
		});

		test('mapeia userId para authId via email', async () => {
			mockGetFullList
				.mockResolvedValueOnce([{ id: 'user1', email: 'user1@test.com' }])
				.mockResolvedValueOnce([{ id: 'auth1', email: 'user1@test.com' }]);

			const { resolveUserIdsToAuthIds } = await import('./notificationStore');
			const result = await resolveUserIdsToAuthIds(['user1']);
			expect(result.get('user1')).toBe('auth1');
		});

		test('ignora userIds sem auth correspondente', async () => {
			mockGetFullList
				.mockResolvedValueOnce([{ id: 'user1', email: 'user1@test.com' }])
				.mockResolvedValueOnce([]);

			const { resolveUserIdsToAuthIds } = await import('./notificationStore');
			const result = await resolveUserIdsToAuthIds(['user1']);
			expect(result.size).toBe(0);
		});
	});

	describe('getNotifications', () => {
		test('usa filtro padrão e retorna resultado', async () => {
			mockGetList.mockResolvedValue({ items: [{ id: 'n1' }], totalItems: 1, totalPages: 1 });

			const { getNotifications } = await import('./notificationStore');
			const result = await getNotifications('auth1');
			expect(result.items).toHaveLength(1);
			expect(mockGetList).toHaveBeenCalledWith(1, 20, expect.objectContaining({
				filter: expect.stringContaining('user = "auth1"')
			}));
		});
	});

	describe('getUnreadCount', () => {
		test('retorna totalItems do filtro', async () => {
			mockGetList.mockResolvedValue({ items: [], totalItems: 5, totalPages: 1 });

			const { getUnreadCount } = await import('./notificationStore');
			const result = await getUnreadCount('auth1');
			expect(result).toBe(5);
		});
	});

	describe('createChatNotification', () => {
		test('cria notificação com payload de chat', async () => {
			mockCreate.mockResolvedValue({ id: 'new' });

			const { createChatNotification } = await import('./notificationStore');
			await createChatNotification('auth1', 'Sender', 'preview', 'room1', 'msg1');
			expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
				user: 'auth1',
				type: 'chat',
				title: 'Sender',
				read: false
			}));
		});
	});

	describe('createSystemNotification', () => {
		test('throw para URL insegura', async () => {
			vi.mocked(isSafeRedirectUrl).mockReturnValue(false);

			const { createSystemNotification } = await import('./notificationStore');
			await expect(createSystemNotification('auth1', 'Title', 'Body', 'http://evil.com')).rejects.toThrow(
				'URL inválida para notificação'
			);
		});

		test('cria para URL segura', async () => {
			vi.mocked(isSafeRedirectUrl).mockReturnValue(true);
			mockCreate.mockResolvedValue({ id: 'n1' });

			const { createSystemNotification } = await import('./notificationStore');
			await createSystemNotification('auth1', 'Title', 'Body', '/safe');
			expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
				user: 'auth1',
				type: 'system',
				title: 'Title'
			}));
		});
	});

	describe('createKanbanNotification', () => {
		test('cria notificações para cada authId mapeado', async () => {
			mockGetFullList
				.mockResolvedValueOnce([{ id: 'user1', email: 'e@e.com' }])
				.mockResolvedValueOnce([{ id: 'auth1', email: 'e@e.com' }]);
			mockCreate.mockResolvedValue({ id: 'n1' });

			const { createKanbanNotification } = await import('./notificationStore');
			const results = await createKanbanNotification(['user1'], 'Card', 'Coluna', 'c1');
			expect(results).toHaveLength(1);
			expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
				user: 'auth1',
				type: 'kanban'
			}));
		});

		test('retorna vazio sem mapeamentos', async () => {
			mockGetFullList.mockResolvedValue([]);

			const { createKanbanNotification } = await import('./notificationStore');
			const results = await createKanbanNotification(['user1'], 'Card', 'Coluna', 'c1');
			expect(results).toHaveLength(0);
		});
	});

	describe('markAsRead', () => {
		test('atualiza cada id com filtro de userId', async () => {
			mockUpdate.mockResolvedValue({});

			const { markAsRead } = await import('./notificationStore');
			const count = await markAsRead('auth1', ['n1', 'n2']);
			expect(count).toBe(2);
			expect(mockUpdate).toHaveBeenCalledWith('n1', { read: true }, { filter: 'user = "auth1"' });
			expect(mockUpdate).toHaveBeenCalledWith('n2', { read: true }, { filter: 'user = "auth1"' });
		});

		test('ignora erros de não encontrado', async () => {
			mockUpdate.mockRejectedValue(new Error('not found'));

			const { markAsRead } = await import('./notificationStore');
			const count = await markAsRead('auth1', ['n1']);
			expect(count).toBe(0);
		});
	});

	describe('markAllAsRead', () => {
		test('retorna 0 quando não há não lidas', async () => {
			mockGetFullList.mockResolvedValue([]);

			const { markAllAsRead } = await import('./notificationStore');
			const count = await markAllAsRead('auth1');
			expect(count).toBe(0);
		});

		test('atualiza todas as não lidas', async () => {
			mockGetFullList.mockResolvedValue([{ id: 'n1' }, { id: 'n2' }]);
			mockUpdate.mockResolvedValue({});

			const { markAllAsRead } = await import('./notificationStore');
			const count = await markAllAsRead('auth1');
			expect(count).toBe(2);
		});
	});

	describe('deleteExpiredNotifications', () => {
		test('deleta registros expirados e retorna contagem', async () => {
			mockGetFullList.mockResolvedValue([{ id: 'old1' }, { id: 'old2' }]);
			mockDelete.mockResolvedValue(true);

			const { deleteExpiredNotifications } = await import('./notificationStore');
			const count = await deleteExpiredNotifications();
			expect(count).toBe(2);
			expect(mockDelete).toHaveBeenCalledWith('old1');
			expect(mockDelete).toHaveBeenCalledWith('old2');
		});
	});
});
