import { test, expect } from './fixtures';
import { cleanupKanbanCard } from './cleanup';

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
});
