import { test, expect } from './fixtures';

test.describe('Todo List Management (runes e2e)', () => {
	const uniqueId = Date.now().toString(36);
	const listTitle = `Lista ${uniqueId}`;

	test('cria lista, adiciona e remove itens, alterna visibilidade', async ({ page }) => {
		// --- Criar lista ---
		await page.goto('/todos/new');
		await page.getByLabel('Título').fill(listTitle);
		await page.getByRole('button', { name: 'Criar' }).click();

		await expect(page.getByRole('heading', { name: listTitle })).toBeVisible();

		// --- Adicionar itens ---
		const items = ['Item A', 'Item B', 'Item C'];
		for (const item of items) {
			await page.getByPlaceholder('Nova tarefa...').fill(item);
			await page.getByRole('button', { name: 'Adicionar' }).click();
			await expect(page.getByText(item)).toBeVisible();
		}

		// --- Marcar item como feito ---
		const checkboxes = page.getByRole('checkbox');
		await checkboxes.first().click();
		await expect(page.getByText(items[0])).toHaveClass(/line-through/);

		// --- Remover item ---
		const removeButtons = page.getByRole('button', { name: 'Remover' });
		await removeButtons.first().click();
		await expect(page.getByText(items[0])).not.toBeVisible();

		// --- Alternar visibilidade para pública ---
		await page.getByRole('button', { name: /Tornar pública/i }).click();
		await expect(page.getByText(/Pública/i)).toBeVisible();

		// --- Alternar de volta para privada ---
		await page.getByRole('button', { name: /Tornar privada/i }).click();
		await expect(page.getByText(/Pública/i)).not.toBeVisible();

		// --- Editar título ---
		const newTitle = `Lista editada ${uniqueId}`;
		await page.getByRole('textbox').first().fill(newTitle);
		await page.getByRole('button', { name: 'Salvar título' }).click();
		await expect(page.getByRole('heading', { name: newTitle })).toBeVisible();

		// --- Excluir lista ---
		await page.getByRole('button', { name: 'Excluir lista' }).click();
		await page.waitForURL('/todos');
		await expect(page.getByText(newTitle)).not.toBeVisible();
	});

	test('mostra mensagem de lista vazia', async ({ page }) => {
		const title = `Vazia ${uniqueId}`;
		await page.goto('/todos/new');
		await page.getByLabel('Título').fill(title);

		await page.getByRole('button', { name: 'Criar' }).click();
		await expect(page.getByText(/Nenhum item ainda/i)).toBeVisible();

		// cleanup
		await page.getByRole('button', { name: 'Excluir lista' }).click();
		await page.waitForURL('/todos');
	});

	test('validação de título vazio em nova lista', async ({ page }) => {
		await page.goto('/todos/new');

		// Remove required attribute para permitir submit sem preencher
		await page.evaluate(() => {
			document.querySelectorAll('input[required]').forEach((el) => el.removeAttribute('required'));
		});

		await page.getByRole('button', { name: 'Criar' }).click();
		await expect(page.getByText(/Título obrigatório/i)).toBeVisible();
	});
});
