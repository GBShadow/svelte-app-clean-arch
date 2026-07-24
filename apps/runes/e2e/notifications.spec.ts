import { test, expect } from './fixtures';
import { authenticateSeedAdmin } from './env';
import { PB_API_URL } from './env';

test.describe('Notifications E2E', () => {
	test('pagina de notificacoes carrega', async ({ page }) => {
		await page.goto('/notifications');
		await expect(page.getByText('Notificações')).toBeVisible();
	});

	test('unread-count retorna numero via pagina', async ({ page }) => {
		await page.goto('/notifications');
		const badge = page.locator('.badge').filter({ hasText: 'não lidas' });
		await expect(badge).toBeVisible();
	});

	test('api de notificacoes retorna dados', async ({ request }) => {
		const token = await authenticateSeedAdmin(request);
		expect(token).toBeTruthy();

		const headers = { Authorization: `Bearer ${token}` };
		const resp = await request.get(
			`${PB_API_URL}/api/collections/notifications/records?perPage=1&sort=-created`,
			{ headers, failOnStatusCode: false }
		);

		expect(resp.ok()).toBeTruthy();
		const body = await resp.json();
		expect(Array.isArray(body.items)).toBeTruthy();
	});
});
