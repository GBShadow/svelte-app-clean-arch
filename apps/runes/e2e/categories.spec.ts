import { test, expect } from './fixtures';

test.describe('Categories CRUD & Aggregation E2E', () => {
	test('deve listar a página de categorias e abrir modal de criação', async ({ page }) => {
		await page.goto('/categories');
		await expect(page.getByTestId('categories-page')).toBeVisible();
		await expect(page.getByTestId('btn-new-category')).toBeVisible();

		await page.getByTestId('btn-new-category').click();
		await expect(page.getByTestId('create-category-modal')).toBeVisible();
		await page.getByTestId('btn-cancel-create-category').click();
		await expect(page.getByTestId('create-category-modal')).not.toBeVisible();
	});

	test('deve criar, visualizar agregação, editar e excluir uma categoria', async ({ page }) => {
		const categoryName = `Cat ${Date.now()}`;
		const updatedName = `Cat Editada ${Date.now()}`;
		const desc = 'Descrição teste E2E';

		await page.goto('/categories');
		await page.getByTestId('btn-new-category').click();

		await page.getByTestId('input-category-name').fill(categoryName);
		await page.getByTestId('input-category-description').fill(desc);
		await page.getByTestId('btn-submit-create-category').click();

		// Confirma que a categoria aparece na lista
		await expect(page.getByText(categoryName)).toBeVisible({ timeout: 5000 });

		// Abre a página agregada da categoria
		await page.getByText(categoryName).click();
		await page.waitForURL(/\/categories\/[a-zA-Z0-9]+$/);
		await expect(page.getByTestId('category-detail-page')).toBeVisible();
		await expect(page.getByText(categoryName)).toBeVisible();

		// Volta para a lista de categorias
		await page.getByTestId('btn-back-categories').click();
		await page.waitForURL('/categories');

		// Edita a categoria
		const editBtn = page.locator(`[data-testid^="btn-edit-category-"]`).first();
		await editBtn.click();
		await expect(page.getByTestId('edit-category-modal')).toBeVisible();

		await page.getByTestId('input-edit-category-name').clear();
		await page.getByTestId('input-edit-category-name').fill(updatedName);
		await page.getByTestId('btn-submit-edit-category').click();

		await expect(page.getByText(updatedName)).toBeVisible({ timeout: 5000 });

		// Exclui a categoria
		const deleteBtn = page.locator(`[data-testid^="btn-delete-category-"]`).first();
		await deleteBtn.click();
		await expect(page.getByTestId('delete-category-modal')).toBeVisible();
		await page.getByTestId('btn-confirm-delete-category').click();

		await expect(page.getByText(updatedName)).not.toBeVisible({ timeout: 5000 });
	});
});
