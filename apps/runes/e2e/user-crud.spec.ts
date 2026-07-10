import { test, expect } from './fixtures';
import { cleanupUser } from './cleanup';

test.describe('Admin User CRUD (runes e2e)', () => {
	const uniqueId = Date.now().toString(36);
	const newUser = {
		name: `Teste ${uniqueId}`,
		email: `teste-${uniqueId}@example.com`,
		jobTitle: 'senior' as const,
		password: 'senha123456'
	};

	test('admin cria um novo usuário, edita, reseta senha e exclui', async ({ page }) => {
		try {
			// --- Criar usuário ---
			await page.goto('/users/new');
			await expect(page.getByTestId('new-user-form')).toBeVisible();

			await page.getByTestId('input-name').fill(newUser.name);
			await page.getByTestId('input-email').fill(newUser.email);
			await page.getByTestId('select-job-title').selectOption(newUser.jobTitle);
			await page.getByTestId('input-password').fill(newUser.password);
			await page.getByTestId('input-confirm-password').fill(newUser.password);
			await page.getByTestId('btn-create-user').click();
			await page.waitForURL('/users');

			// --- Verificar que o usuário aparece na lista ---
			await expect(page.getByTestId('users-table')).toContainText(newUser.name);
			await expect(page.getByTestId('users-table')).toContainText(newUser.email);

			// --- Editar usuário (usar filtro pela linha do novo email) ---
			const userRow = page.getByTestId('users-table').locator('tbody tr').filter({ hasText: newUser.email });
			await userRow.getByRole('link', { name: 'Editar' }).click();
			await page.waitForURL(/\/users\/.+\/edit/);
			await expect(page.getByTestId('edit-user-form')).toBeVisible();

			const newName = `Editado ${uniqueId}`;
			await page.getByTestId('input-name').fill(newName);
			await page.getByTestId('btn-save-user').click();
			await page.waitForURL(/\/users/);
			await expect(page.getByTestId('users-table')).toContainText(newName);

			// --- Resetar senha ---
			const updatedRow = page.getByTestId('users-table').locator('tbody tr').filter({ hasText: newName });
			await updatedRow.getByRole('link', { name: 'Editar' }).click();
			await page.waitForURL(/\/users\/.+\/edit/);

			await page.getByTestId('input-password').fill('nova-senha-9876');
			await page.getByTestId('input-confirm-password').fill('nova-senha-9876');
			await page.getByTestId('btn-reset-password').click();

			await expect(page.getByTestId('reset-password-success')).toBeVisible();

			// --- Excluir usuário ---
			await page.getByTestId('btn-delete-user').click();
			await page.waitForURL('/users');
			await expect(page.getByTestId('users-table')).not.toContainText(newName);
		} finally {
			await cleanupUser(page.request, newUser.email);
		}
	});

	test('mostra validação ao criar usuário com dados inválidos', async ({ page }) => {
		await page.goto('/users/new');

		// O form tem novalidate, então o required do HTML5 não bloqueia o submit
		await page.getByTestId('btn-create-user').click();

		await expect(page.getByTestId('error-name')).toBeVisible();
	});
});
