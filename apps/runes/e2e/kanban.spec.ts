import { test, expect } from './fixtures';
import { cleanupKanbanCard } from './cleanup';
import { getAdminClient } from '../src/lib/server/pocketbaseAdmin';

test.describe('Kanban (runes e2e)', () => {
	const uniqueId = Date.now().toString(36);
	const cardTitle = `Tarefa E2E ${uniqueId}`;

	test('fluxo completo do kanban: criar card, ver no board, editar, adicionar comentário, verificar histórico, deletar card', async ({ page }) => {
		try {
			await page.goto('/kanban');
			await expect(page.locator('h1')).toContainText('Quadro Kanban');

			// --- Criar um cartão na coluna "Aguardando" ---
			const backlogColumn = page.locator('div[data-testid^="kanban-column-"]').filter({ hasText: 'Aguardando' });
			await backlogColumn.getByTestId(/^btn-add-card-/).click();

			// Preenche o formulário do modal de criação
			await page.locator('#new-card-title').fill(cardTitle);
			await page.locator('#new-card-points').selectOption('5');
			await page.getByTestId('btn-save-new-card').click();

			// Garante que o card apareceu no board
			const newCardLocator = page.locator('h3[data-testid^="card-title-"]').filter({ hasText: cardTitle });
			await expect(newCardLocator).toBeVisible();

			// --- Abrir detalhes do card (modal de edição) ---
			await newCardLocator.click();

			// Valida pontos
			await expect(page.locator('#edit-card-points')).toHaveValue('5');

			// Adiciona um comentário
			await page.getByTestId('input-comment').fill('Comentário E2E de teste');
			await page.getByTestId('btn-add-comment').click();

			// Garante que o comentário foi adicionado
			await expect(page.locator('text=Comentário E2E de teste')).toBeVisible();

			// Garante que o histórico registrou a criação
			await expect(page.locator('text=criou o cartão')).toBeVisible();

			// Salva modificações do título/pontos
			const updatedTitle = `${cardTitle} Editado`;
			await page.locator('#edit-card-title').fill(updatedTitle);
			await page.locator('#edit-card-points').selectOption('8');
			await page.getByTestId('btn-save-card').click();

			// Garante que o título atualizado está no board
			const updatedCardLocator = page.locator('h3[data-testid^="card-title-"]').filter({ hasText: updatedTitle });
			await expect(updatedCardLocator).toBeVisible();

			// --- Deletar o card ---
			await updatedCardLocator.click();
			await page.getByTestId('btn-delete-card').click();

			// Garante que o card sumiu do board
			await expect(updatedCardLocator).not.toBeVisible();
		} finally {
			await cleanupKanbanCard(page.request, cardTitle);
			await cleanupKanbanCard(page.request, `${cardTitle} Editado`);
		}
	});

	test('gerenciamento de colunas (admin only)', async ({ page }) => {
		const columnName = `Coluna E2E ${uniqueId}`;

		await page.goto('/kanban');
		await expect(page.getByTestId('btn-manage-columns')).toBeVisible();

		// Abre gerenciador de colunas
		await page.getByTestId('btn-manage-columns').click();

		// Adiciona nova coluna
		await page.getByTestId('input-new-column-name').fill(columnName);
		await page.getByTestId('btn-create-column').click();

		// Fecha modal
		await page.locator('button:has-text("Fechar")').click();

		// Garante que a coluna apareceu no quadro
		const newColumn = page.locator('div[data-testid^="kanban-column-"]').filter({ hasText: columnName });
		await expect(newColumn).toBeVisible();

		// Exclui a coluna criada
		await page.getByTestId('btn-manage-columns').click();
		const deleteBtn = page.getByTestId(/^btn-delete-column-/).last();
		await deleteBtn.click();

		// Fecha modal e garante sumiço
		await page.locator('button:has-text("Fechar")').click();
		await expect(newColumn).not.toBeVisible();
	});

	test('notificação in-app ao criar card com assignee', async ({ page, adminUser }) => {
		const testCardTitle = `Card Notif ${Date.now()}`;
		const adminPb = await getAdminClient();

		// Buscar um usuário para ser assignee (não admin)
		const users = await adminPb.collection('user').getFullList({ filter: 'id != "' + adminUser.id + '"' });
		if (users.length === 0) {
			test.skip('Nenhum usuário não-admin disponível para teste');
			return;
		}
		const assignee = users[0];

		// Criar card com assignee
		await page.goto('/kanban');
		const backlogColumn = page.locator('div[data-testid^="kanban-column-"]').filter({ hasText: 'Aguardando' });
		await backlogColumn.getByTestId(/^btn-add-card-/).click();
		await page.locator('#new-card-title').fill(testCardTitle);
		
		// Selecionar assignee no checkbox
		await page.locator(`input[name="assigneeIds[]"][value="${assignee.id}"]`).check();
		
		await page.getByTestId('btn-save-new-card').click();

		// Aguardar card aparecer
		const cardLocator = page.locator('h3[data-testid^="card-title-"]').filter({ hasText: testCardTitle });
		await expect(cardLocator).toBeVisible();

		// Verificar notificação in-app criada via admin API
		await page.waitForTimeout(500); // dar tempo do createCard action processar
		const notifications = await adminPb.collection('notifications').getFullList({
			filter: `user = "${assignee.id}" && type = "kanban"`,
			sort: '-created'
		});
		
		expect(notifications.length).toBeGreaterThan(0);
		const notif = notifications[0];
		expect(notif.title).toBe('Novo cartão atribuído');
		expect(notif.body).toContain(testCardTitle);
		expect(notif.url).toContain('#card-');
		expect(notif.read).toBe(false);

		// Cleanup
		await adminPb.collection('notifications').delete(notif.id);
		await cleanupKanbanCard(page.request, testCardTitle);
	});

	test('notificação ao mover card entre colunas', async ({ page, adminUser }) => {
		const testCardTitle = `Card Move ${Date.now()}`;
		const adminPb = await getAdminClient();

		// Buscar um usuário para ser assignee
		const users = await adminPb.collection('user').getFullList({ filter: 'id != "' + adminUser.id + '"' });
		if (users.length === 0) {
			test.skip('Nenhum usuário não-admin disponível para teste');
			return;
		}
		const assignee = users[0];

		// Criar card com assignee
		await page.goto('/kanban');
		const backlogColumn = page.locator('div[data-testid^="kanban-column-"]').filter({ hasText: 'Aguardando' });
		await backlogColumn.getByTestId(/^btn-add-card-/).click();
		await page.locator('#new-card-title').fill(testCardTitle);
		await page.locator(`input[name="assigneeIds[]"][value="${assignee.id}"]`).check();
		await page.getByTestId('btn-save-new-card').click();

		const cardLocator = page.locator('h3[data-testid^="card-title-"]').filter({ hasText: testCardTitle });
		await expect(cardLocator).toBeVisible();

		// Mover card para coluna "Fazendo" via drag-and-drop
		const fazendoColumn = page.locator('div[data-testid^="kanban-column-"]').filter({ hasText: 'Fazendo' });
		
		await cardLocator.dragTo(fazendoColumn.locator('.min-h-\\[150px\\]'));

		// Aguardar processamento
		await page.waitForTimeout(500);

		// Verificar notificação de movimento
		const notifications = await adminPb.collection('notifications').getFullList({
			filter: `user = "${assignee.id}" && type = "kanban"`,
			sort: '-created'
		});
		
		expect(notifications.length).toBeGreaterThan(0);
		const moveNotif = notifications.find(n => n.title === 'Cartão movido');
		expect(moveNotif).toBeDefined();
		expect(moveNotif!.body).toContain(testCardTitle);
		expect(moveNotif!.body).toContain('Fazendo');
		expect(moveNotif!.url).toContain('#card-');

		// Cleanup
		for (const n of notifications) {
			await adminPb.collection('notifications').delete(n.id);
		}
		await cleanupKanbanCard(page.request, testCardTitle);
	});

	test('deep link /kanban#card-{id} abre modal', async ({ page }) => {
		const testCardTitle = `Card DeepLink ${Date.now()}`;

		// Criar card
		await page.goto('/kanban');
		const backlogColumn = page.locator('div[data-testid^="kanban-column-"]').filter({ hasText: 'Aguardando' });
		await backlogColumn.getByTestId(/^btn-add-card-/).click();
		await page.locator('#new-card-title').fill(testCardTitle);
		await page.getByTestId('btn-save-new-card').click();

		const cardLocator = page.locator('h3[data-testid^="card-title-"]').filter({ hasText: testCardTitle });
		await expect(cardLocator).toBeVisible();

		// Obter ID do card via data-testid
		const cardId = await cardLocator.getAttribute('data-testid');
		const cardIdValue = cardId!.replace('card-title-', '');

		// Navegar para deep link
		await page.goto(`/kanban#card-${cardIdValue}`);

		// Modal deve abrir
		await expect(page.locator('dialog.modal-open')).toBeVisible();
		await expect(page.locator('#edit-card-title')).toHaveValue(testCardTitle);

		// Fechar modal
		await page.locator('button:has-text("Fechar")').click();

		// Cleanup
		await cleanupKanbanCard(page.request, testCardTitle);
	});

	test('auto-atribuição não notifica criador', async ({ page, adminUser }) => {
		const testCardTitle = `Card SelfAssign ${Date.now()}`;
		const adminPb = await getAdminClient();

		// Criar card auto-atribuído (admin se atribui)
		await page.goto('/kanban');
		const backlogColumn = page.locator('div[data-testid^="kanban-column-"]').filter({ hasText: 'Aguardando' });
		await backlogColumn.getByTestId(/^btn-add-card-/).click();
		await page.locator('#new-card-title').fill(testCardTitle);
		await page.locator(`input[name="assigneeIds[]"][value="${adminUser.id}"]`).check();
		await page.getByTestId('btn-save-new-card').click();

		const cardLocator = page.locator('h3[data-testid^="card-title-"]').filter({ hasText: testCardTitle });
		await expect(cardLocator).toBeVisible();

		// Aguardar processamento
		await page.waitForTimeout(500);

		// Verificar que NÃO há notificação para o criador
		const notifications = await adminPb.collection('notifications').getFullList({
			filter: `user = "${adminUser.id}" && type = "kanban"`,
			sort: '-created'
		});
		
		// Pode haver notificações antigas, mas nenhuma para este card específico
		const newNotif = notifications.find(n => n.body.includes(testCardTitle));
		expect(newNotif).toBeUndefined();

		await cleanupKanbanCard(page.request, testCardTitle);
	});

	test('reordenação na mesma coluna não gera notificação', async ({ page, adminUser }) => {
		const testCardTitle = `Card Reorder ${Date.now()}`;
		const adminPb = await getAdminClient();

		// Buscar assignee
		const users = await adminPb.collection('user').getFullList({ filter: 'id != "' + adminUser.id + '"' });
		if (users.length === 0) {
			test.skip('Nenhum usuário não-admin disponível para teste');
			return;
		}
		const assignee = users[0];

		// Criar card com assignee
		await page.goto('/kanban');
		const backlogColumn = page.locator('div[data-testid^="kanban-column-"]').filter({ hasText: 'Aguardando' });
		await backlogColumn.getByTestId(/^btn-add-card-/).click();
		await page.locator('#new-card-title').fill(testCardTitle);
		await page.locator(`input[name="assigneeIds[]"][value="${assignee.id}"]`).check();
		await page.getByTestId('btn-save-new-card').click();

		const cardLocator = page.locator('h3[data-testid^="card-title-"]').filter({ hasText: testCardTitle });
		await expect(cardLocator).toBeVisible();

		// Contar notificações antes
		const beforeNotifs = await adminPb.collection('notifications').getFullList({
			filter: `user = "${assignee.id}" && type = "kanban"`
		});

		// Reordenar na mesma coluna (drag and drop dentro da coluna)
		const cardEl = cardLocator.locator('..'); // botão do card
		const columnEl = backlogColumn.locator('.min-h-\\[150px\\]');
		
		// Drag leve dentro da mesma zona
		await cardEl.dragTo(columnEl, { targetPosition: { x: 100, y: 100 } });

		await page.waitForTimeout(500);

		// Contar notificações depois
		const afterNotifs = await adminPb.collection('notifications').getFullList({
			filter: `user = "${assignee.id}" && type = "kanban"`
		});

		// Não deve ter novas notificações
		expect(afterNotifs.length).toBe(beforeNotifs.length);

		// Cleanup
		for (const n of afterNotifs) {
			await adminPb.collection('notifications').delete(n.id);
		}
		await cleanupKanbanCard(page.request, testCardTitle);
	});
});
