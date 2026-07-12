import { test, expect } from './fixtures';
import { cleanupPokerRoom, cleanupKanbanCard } from './cleanup';

test.describe('Planning Poker (runes e2e)', () => {
	const uniqueId = Date.now().toString(36);
	const roomName = `Poker E2E ${uniqueId}`;
	const taskTitle = `Task E2E ${uniqueId}`;

	test('fluxo completo do planning poker: criar sala, criar task, selecionar para votação, votar, revelar, resetar rodada, atribuir pontos, exportar para o kanban', async ({ page }) => {
		try {
			// --- Criar uma nova sala ---
			await page.goto('/poker');
			await expect(page.locator('h1')).toContainText('Planning Poker');

			await page.getByTestId('btn-open-create-room').click();
			await page.getByTestId('input-room-name').fill(roomName);
			await page.getByTestId('btn-submit-create-room').click();

			// Aguarda redirecionar para a sala
			await expect(page.locator('h1')).toContainText(roomName);

			// --- Criar nova task no backlog ---
			await page.getByTestId('btn-open-create-task').click();
			await page.getByTestId('input-task-title').fill(taskTitle);
			await page.getByTestId('btn-save-poker-task').click();

			// Garante que a task apareceu no backlog
			const taskRow = page.locator('div').filter({ has: page.locator('h4', { hasText: taskTitle }) }).first();
			await expect(taskRow).toBeVisible();

			// --- Iniciar votação da task ---
			await taskRow.locator('button[title="Iniciar votação desta task"]').click();

			// Garante que a task está ativa para votação na área principal
			await expect(page.locator('h2').filter({ hasText: taskTitle })).toBeVisible();

			// --- Votar (clicar na carta 5) ---
			await page.getByTestId('poker-card-5').click();

			// Revelar votos
			await page.getByTestId('btn-reveal-votes').click();

			// Garante que o resultado exibiu a média 5
			await expect(page.locator('text=Média Geral')).toBeVisible();
			await expect(page.locator('text=5').first()).toBeVisible();

			// --- Reiniciar rodada ---
			await page.getByTestId('btn-reset-votes').click();

			// Votar novamente com 8
			await page.getByTestId('poker-card-8').click();

			// Revelar votos
			await page.getByTestId('btn-reveal-votes').click();

			// Define estimativa final (8 SP)
			await taskRow.locator('button:has-text("Pontuar")').click();
			await taskRow.locator('input[placeholder="SP"]').fill('8');
			await taskRow.locator('button:has-text("✓")').click();

			// Garante que a task agora exibe o badge de 8 SP
			const estimatedBadge = taskRow.locator('span.badge-success').filter({ hasText: '8 SP' });
			await expect(estimatedBadge).toBeVisible();

			// --- Exportar para o Kanban ---
			// Seleciona a checkbox da task estimada
			await taskRow.locator('input[type="checkbox"]').check();

			// Clica no botão de exportar
			await page.getByTestId('btn-export-poker-tasks').click();

			// Garante que o badge da task mudou para "No Kanban"
			const exportedBadge = taskRow.locator('span.badge-info').filter({ hasText: 'No Kanban' });
			await expect(exportedBadge).toBeVisible();

			// --- Sair da sala ---
			await page.getByTestId('btn-leave-room').click();

			// Garante que voltou para a página de listagem
			await expect(page.locator('h1')).toContainText('Planning Poker');
		} finally {
			await cleanupPokerRoom(page.request, roomName);
			await cleanupKanbanCard(page.request, taskTitle);
		}
	});
});
