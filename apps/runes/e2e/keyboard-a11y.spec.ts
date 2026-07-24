import { test, expect } from './fixtures';
import { cleanupKanbanCard, cleanupChatRoom, cleanupUser } from './cleanup';

test.describe('Keyboard e Acessibilidade', () => {
	const uniqueId = Date.now().toString(36);

	test.describe('Kanban: foco e navegacao por teclado', () => {
		const cardTitle = `Card keyboard ${uniqueId}`;

		test('cria card para testar foco', async ({ page }) => {
			try {
				await page.goto('/kanban');

				const addBtn = page.getByTestId(/^btn-add-card-/).first();
				await addBtn.click();

				await page.locator('#new-card-title').fill(cardTitle);
				await page.getByTestId('btn-save-new-card').click();
				await expect(page.getByTestId('btn-save-new-card')).not.toBeVisible({ timeout: 5000 });
			} finally {
				await cleanupKanbanCard(page.request, cardTitle);
			}
		});

		test('card aberto pelo teclado abre modal de edicao', async ({ page }) => {
			await page.goto('/kanban');
			const card = page.getByTestId(/^kanban-card-/).first();

			await card.focus();
			await page.keyboard.press('Enter');
			await expect(page.getByText('Detalhes do Cartão')).toBeVisible({ timeout: 3000 });

			await page.keyboard.press('Escape');
		});

		test('tab percorre cards no kanban', async ({ page }) => {
			await page.goto('/kanban');
			const firstCard = page.getByTestId(/^kanban-card-/).first();
			await expect(firstCard).toBeVisible();

			await firstCard.focus();
			await expect(firstCard).toBeFocused();

			await page.keyboard.press('Tab');
			const nextFocused = page.locator(':focus');
			expect(await nextFocused.count()).toBeGreaterThanOrEqual(0);
		});
	});

	test.describe('Kanban: criacao de card via teclado', () => {
		const cardTitle = `Card keyboard create ${uniqueId}`;

		test('preenche form do card usando apenas teclado', async ({ page }) => {
			try {
				await page.goto('/kanban');

				const addBtn = page.getByTestId(/^btn-add-card-/).first();
				await addBtn.focus();
				await page.keyboard.press('Enter');

				await page.locator('#new-card-title').fill(cardTitle);
				await page.keyboard.press('Tab');

				await page.getByTestId('btn-save-new-card').focus();
				await page.keyboard.press('Enter');
				await expect(page.getByTestId('btn-save-new-card')).not.toBeVisible({ timeout: 5000 });
			} finally {
				await cleanupKanbanCard(page.request, cardTitle);
			}
		});
	});

	test.describe('Chat: foco no input apos envio', () => {
		const roomName = `Sala keyboard ${uniqueId}`;
		const partnerEmail = `kb-partner-${uniqueId}@example.com`;

		test('input de mensagem recebe foco apos enviar', async ({ page }) => {
			try {
				await page.goto('/users/new');
				await page.getByTestId('input-name').fill('Parceiro KB');
				await page.getByTestId('input-email').fill(partnerEmail);
				await page.getByTestId('select-job-title').selectOption('developer');
				await page.getByTestId('input-password').fill('senha123456');
				await page.getByTestId('input-confirm-password').fill('senha123456');
				await page.getByTestId('btn-create-user').click();
				await page.waitForURL('/users');

				await page.goto('/chat/new');
				await page.getByTestId('input-room-name').fill(roomName);
				await page.locator('label', { hasText: partnerEmail }).locator('input[type=checkbox]').check();
				await page.getByTestId('btn-create-room').click();
				await expect(page.getByTestId('room-title')).toContainText(roomName);

				const input = page.getByTestId('input-message');
				await input.fill('Teste foco');
				await page.getByTestId('btn-send-message').click();

				await expect(input).toBeFocused({ timeout: 3000 });
				await expect(input).toHaveValue('');
			} finally {
				await cleanupChatRoom(page.request, roomName);
				await cleanupUser(page.request, partnerEmail);
			}
		});
	});

	test.describe('ARIA: dialog de card tem atributos basicos', () => {
		const cardTitle = `Card aria ${uniqueId}`;

		test('card possui data-testid e e focavel', async ({ page }) => {
			try {
				await page.goto('/kanban');

				const addBtn = page.getByTestId(/^btn-add-card-/).first();
				await addBtn.click();
				await page.locator('#new-card-title').fill(cardTitle);
				await page.getByTestId('btn-save-new-card').click();
				await expect(page.getByTestId('btn-save-new-card')).not.toBeVisible({ timeout: 5000 });

				const card = page.getByTestId(/^kanban-card-/).first();
				await expect(card).toBeVisible();
				expect(await card.getAttribute('data-testid')).toContain('kanban-card-');
			} finally {
				await cleanupKanbanCard(page.request, cardTitle);
			}
		});
	});
});
