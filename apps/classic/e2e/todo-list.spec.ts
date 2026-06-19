import { test, expect } from './fixtures';

test.describe('Todo List (classic e2e)', () => {
	test('carrega todos iniciais e percentual de conclusão', async ({ page }) => {
		await page.goto('/');

		await expect(page.getByRole('heading', { name: /Todo App — Classic/i })).toBeVisible();
		await expect(page.getByText('Estudar TypeScript')).toBeVisible();
		await expect(page.getByText('Fazer a prova online')).toBeVisible();
		await expect(page.getByText('Cortar a grama')).toBeVisible();
		await expect(page.locator('.completed')).toHaveText('33%');
	});

	test('adiciona um item via input', async ({ page }) => {
		await page.goto('/');

		await page.locator('input[type="text"]').fill('Nova tarefa e2e');
		await page.keyboard.press('Enter');

		await expect(page.getByText('Nova tarefa e2e')).toBeVisible();
		await expect(page.locator('.completed')).toHaveText('25%');
	});

	test('marca item como done e remove item', async ({ page }) => {
		await page.goto('/');

		const item = page.getByText('Fazer a prova online');
		await item.locator('..').getByRole('button', { name: 'Done/Undone' }).click();
		await expect(item).toHaveCSS('text-decoration', /line-through/);

		await item.locator('..').getByRole('button', { name: 'Remove' }).click();
		await expect(page.getByText('Fazer a prova online')).not.toBeVisible();
	});
});
