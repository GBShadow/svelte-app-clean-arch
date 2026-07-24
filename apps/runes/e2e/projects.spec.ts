import { test, expect } from './fixtures';
import { cleanupProject } from './cleanup';

test.describe('Projects E2E', () => {
	test('lista projetos', async ({ page }) => {
		await page.goto('/projects');
		await expect(page.getByText('Projetos')).toBeVisible();
		await expect(page.getByTestId('btn-new-project')).toBeVisible();
	});

	test('cria projeto, exibe e edita', async ({ page }) => {
		const title = `Projeto e2e ${Date.now()}`;
		const newTitle = `Editado e2e ${Date.now()}`;

		try {
			await page.goto('/projects/new');
			await page.locator('#title').fill(title);
			await page.locator('#description').fill('Descricao e2e');
			await page.getByTestId('btn-save-project').click();

			await page.waitForURL(/\/projects\/[a-zA-Z0-9]+$/);
			await expect(page.getByText(title)).toBeVisible();
			await expect(page.getByText('Descricao e2e')).toBeVisible();

			await page.getByText('Editar').click();
			await page.waitForURL(/\/projects\/[a-zA-Z0-9]+\/edit$/);
			await page.locator('#title').clear();
			await page.locator('#title').fill(newTitle);
			await page.getByTestId('btn-save-project').click();

			await page.waitForURL(/\/projects\/[a-zA-Z0-9]+$/);
			await expect(page.getByText(newTitle)).toBeVisible();
		} finally {
			await cleanupProject(page.request, title);
			if (title !== newTitle) await cleanupProject(page.request, newTitle);
		}
	});
});
