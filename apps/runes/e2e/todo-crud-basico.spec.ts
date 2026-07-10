import { test, expect } from './fixtures';
import { cleanupTodoList } from './cleanup';

test.describe('Todo CRUD básico (runes e2e)', () => {
	test('cria lista, adiciona item, marca como feito e exclui a lista', async ({ page }) => {
		const title = `Lista e2e ${Date.now()}`;

		try {
			await page.goto('/todos/new');
			await page.getByTestId('input-title').fill(title);
			await page.getByTestId('btn-create-list').click();

			await expect(page.getByRole('heading', { name: title })).toBeVisible();

			await page.getByTestId('input-add-item').fill('Comprar leite');
			await page.getByTestId('btn-add-item').click();
			await expect(page.getByTestId('todo-items-card')).toContainText('Comprar leite');

			await page.getByTestId('todo-items-card').getByRole('checkbox').first().click();
			await expect(
				page.getByTestId('todo-items-card').getByText('Comprar leite')
			).toHaveClass(/line-through/);

			await page.getByTestId('btn-delete-list').click();
			await page.waitForURL('/todos');
			await expect(page.getByText(title)).not.toBeVisible();
		} finally {
			await cleanupTodoList(page.request, title);
		}
	});
});
