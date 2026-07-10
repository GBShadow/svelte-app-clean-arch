import { test, expect } from './fixtures';

test.describe('Todo multi-lista (runes e2e)', () => {
	test('cria lista, adiciona item, marca como feito e exclui a lista', async ({ page }) => {
		const title = `Lista e2e ${Date.now()}`;

		await page.goto('/todos/new');
		await page.getByLabel('Título').fill(title);
		await page.getByRole('button', { name: 'Criar' }).click();

		await expect(page.getByRole('heading', { name: title })).toBeVisible();

		await page.getByPlaceholder('Nova tarefa...').fill('Comprar leite');
		await page.getByRole('button', { name: 'Adicionar' }).click();
		await expect(page.getByText('Comprar leite')).toBeVisible();

		await page.getByRole('checkbox').click();
		await expect(page.getByText('Comprar leite')).toHaveClass(/line-through/);

		await page.getByRole('button', { name: 'Excluir lista' }).click();
		await page.waitForURL('/todos');
		await expect(page.getByText(title)).not.toBeVisible();
	});
});
