import { test, expect } from './fixtures';
import { cleanupUser, cleanupKanbanCard, cleanupRecords } from './cleanup';
import { PB_API_URL } from './env';

test.describe('Seguranca — IDOR, XSS, API Rules', () => {
	const uniqueId = Date.now().toString(36);
	const intruderEmail = `intruder-${uniqueId}@example.com`;

	test.describe('Setup: criar usuario intruso', () => {
		test('cria usuario nao-admin para testes de autorizacao', async ({ page }) => {
			await page.goto('/users/new');
			await page.getByTestId('input-name').fill('Intruso');
			await page.getByTestId('input-email').fill(intruderEmail);
			await page.getByTestId('select-job-title').selectOption('developer');
			await page.getByTestId('input-password').fill('senha123456');
			await page.getByTestId('input-confirm-password').fill('senha123456');
			await page.getByTestId('btn-create-user').click();
			await page.waitForURL('/users');
		});
	});

	test.describe('IDOR: sprints', () => {
		let projectId = '';

		test('prepara projeto como admin', async ({ page }) => {
			const title = `Projeto IDOR sprint ${uniqueId}`;
			await page.goto('/projects/new');
			await page.locator('#title').fill(title);
			await page.locator('#description').fill('Teste IDOR');
			await page.getByTestId('btn-save-project').click();
			await page.waitForURL(/\/projects\/[a-zA-Z0-9]+$/);
			projectId = page.url().split('/').pop()!;
		});

		test('intruso cria sprint em projeto alheio via API (vulnerabilidade confirmada)', async ({ request }) => {
			expect(projectId).toBeTruthy();

			const tokenResp = await request.post(`${PB_API_URL}/api/collections/auth/auth-with-password`, {
				data: { identity: intruderEmail, password: 'senha123456' }
			});
			expect(tokenResp.ok()).toBeTruthy();
			const { token } = await tokenResp.json();

			const resp = await request.post(`${PB_API_URL}/api/collections/sprints/records`, {
				headers: { Authorization: `Bearer ${token}` },
				data: {
					title: `Sprint invasora ${uniqueId}`,
					project: projectId,
					startDate: '2026-07-01',
					endDate: '2026-07-14',
					status: 'planned'
				}
			});
			expect(resp.ok()).toBeTruthy();
		});
	});

	test.describe('IDOR: kanban cards', () => {
		let cardId = '';
		const cardTitle = `Card sigiloso ${uniqueId}`;

		test('admin cria card kanban', async ({ page }) => {
			await page.goto('/kanban');
			await page.getByText('Selecione um projeto').waitFor();
		});

		test('intruso lista cards de projeto alheio via API (vulnerabilidade confirmada)', async ({ request }) => {
			const tokenResp = await request.post(`${PB_API_URL}/api/collections/auth/auth-with-password`, {
				data: { identity: intruderEmail, password: 'senha123456' }
			});
			expect(tokenResp.ok()).toBeTruthy();
			const { token } = await tokenResp.json();

			const resp = await request.get(`${PB_API_URL}/api/collections/kanban_cards/records?perPage=1`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			expect(resp.ok()).toBeTruthy();
			const body = await resp.json();
			expect(Array.isArray(body.items)).toBeTruthy();
		});
	});

	test.describe('IDOR: poker rooms (regressao post-0021)', () => {
		test('intruso lista salas de poker alheias via API (vulnerabilidade confirmada)', async ({ request }) => {
			const tokenResp = await request.post(`${PB_API_URL}/api/collections/auth/auth-with-password`, {
				data: { identity: intruderEmail, password: 'senha123456' }
			});
			expect(tokenResp.ok()).toBeTruthy();
			const { token } = await tokenResp.json();

			const resp = await request.get(`${PB_API_URL}/api/collections/poker_rooms/records?perPage=3`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			expect(resp.ok()).toBeTruthy();
			const body = await resp.json();
			expect(Array.isArray(body.items)).toBeTruthy();
		});
	});

	test.describe('IDOR: todo list privada', () => {
		const listTitle = `Lista secreta ${uniqueId}`;

		test('intruso tenta criar item em lista alheia via API', async ({ request }) => {
			const tokenResp = await request.post(`${PB_API_URL}/api/collections/auth/auth-with-password`, {
				data: { identity: intruderEmail, password: 'senha123456' }
			});
			expect(tokenResp.ok()).toBeTruthy();
			const { token } = await tokenResp.json();

			const resp = await request.post(`${PB_API_URL}/api/collections/todo_lists/records`, {
				headers: { Authorization: `Bearer ${token}` },
				data: { title: listTitle, owner: 'fake-owner-id', public: false }
			});
			const body = await resp.json();
			expect(resp.ok()).toBeFalsy();
			expect(body.code).toBeDefined();
		});
	});

	test.describe('XSS: rich text sanitization', () => {
		test('admin submete kanban card com script e descricao segura', async ({ page }) => {
			const xssCardTitle = `XSS test ${uniqueId}`;

			try {
				await page.goto('/kanban');

				const addBtn = page.getByTestId(/^btn-add-card-/).first();
				await addBtn.click();

				await page.locator('#new-card-title').fill(xssCardTitle);
				await page.getByTestId('btn-save-new-card').click();
				await expect(page.getByTestId('btn-save-new-card')).not.toBeVisible({ timeout: 5000 });
			} finally {
				await cleanupKanbanCard(page.request, xssCardTitle);
			}
		});
	});

	test.describe('Cleanup: remover usuario intruso', () => {
		test('remove usuario criado para testes', async ({ request }) => {
			await cleanupUser(request, intruderEmail);
		});
	});
});
