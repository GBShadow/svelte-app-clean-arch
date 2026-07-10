import { test, expect } from './fixtures';
import { cleanupTodoList } from './cleanup';

test.describe('Todo List Management (runes e2e)', () => {
	const uniqueId = Date.now().toString(36);
	const listTitle = `Lista ${uniqueId}`;

	test('cria lista, adiciona e remove itens, alterna visibilidade', async ({ page }) => {
		try {
			// --- Criar lista ---
			await page.goto('/todos/new');
			await page.getByTestId('input-title').fill(listTitle);
			await page.getByTestId('btn-create-list').click();

			await expect(page.getByRole('heading', { name: listTitle })).toBeVisible();

			// --- Adicionar itens ---
			const items = ['Item A', 'Item B', 'Item C'];
			for (const item of items) {
				await page.getByTestId('input-add-item').fill(item);
				await page.getByTestId('btn-add-item').click();
				await expect(page.getByTestId('todo-items-card')).toContainText(item);
			}

			// --- Marcar item como feito ---
			const checkboxes = page.getByTestId('todo-items-card').getByRole('checkbox');
			await checkboxes.first().click();
			await expect(
				page.getByTestId('todo-items-card').getByText(items[0])
			).toHaveClass(/line-through/);

			// --- Remover item ---
			const removeButtons = page.getByTestId('todo-items-card').getByRole('button', { name: 'Remover' });
			await removeButtons.first().click();
			await expect(page.getByTestId('todo-items-card')).not.toContainText(items[0]);

			// --- Alternar visibilidade para pública ---
			await page.getByTestId('btn-toggle-public').click();
			await expect(page.getByTestId('list-public-badge')).toBeVisible();

			// --- Alternar de volta para privada ---
			await page.getByTestId('btn-toggle-public').click();
			await expect(page.getByTestId('list-public-badge')).not.toBeVisible();

			// --- Editar título ---
			const newTitle = `Lista editada ${uniqueId}`;
			await page.getByTestId('input-title').fill(newTitle);
			await page.getByTestId('btn-save-title').click();
			await expect(page.getByRole('heading', { name: newTitle })).toBeVisible();

			// --- Excluir lista ---
			await page.getByTestId('btn-delete-list').click();
			await page.waitForURL('/todos');
			await expect(page.getByText(newTitle)).not.toBeVisible();
		} finally {
			await cleanupTodoList(page.request, listTitle);
			await cleanupTodoList(page.request, `Lista editada ${uniqueId}`);
		}
	});

	test('mostra mensagem de lista vazia', async ({ page }) => {
		const title = `Vazia ${uniqueId}`;

		try {
			await page.goto('/todos/new');
			await page.getByTestId('input-title').fill(title);

			await page.getByTestId('btn-create-list').click();
			await expect(page.getByTestId('no-items-msg')).toBeVisible();

			// cleanup via UI
			await page.getByTestId('btn-delete-list').click();
			await page.waitForURL('/todos');
		} finally {
			await cleanupTodoList(page.request, title);
		}
	});

	test('validação de título vazio em nova lista', async ({ page }) => {
		await page.goto('/todos/new');

		// O form tem novalidate, então o required do HTML5 não bloqueia o submit
		await page.getByTestId('btn-create-list').click();
		await expect(page.getByTestId('error-title')).toBeVisible();
	});
});
