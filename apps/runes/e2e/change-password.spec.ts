import { test, expect } from '@playwright/test';

const SEED_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'seed-admin@example.com';
const SEED_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'changeme123456';

test.describe('Change Password (runes e2e)', () => {
	test('troca de senha com sucesso usando usuário admin', async ({ page }) => {
		await page.goto('/login');
		await page.getByLabel('E-mail').fill(SEED_EMAIL);
		await page.getByLabel('Senha').fill(SEED_PASSWORD);
		await page.getByRole('button', { name: 'Entrar' }).click();
		await page.waitForURL('/todos');

		await page.goto('/change-password');
		await expect(page.getByRole('heading', { name: /Troca de senha/i })).toBeVisible();

		// Preencher campos — mas cancelar via navegação para não alterar senha real
		await page.getByLabel('Senha atual').fill(SEED_PASSWORD);
		await page.getByLabel('Nova senha').fill('nova-senha-temp-123456');
		await page.getByLabel('Confirmar nova senha').fill('nova-senha-temp-123456');
		await page.getByRole('button', { name: 'Trocar senha' }).click();

		// Se a troca funcionou, fomos redirecionados para /todos
		await page.waitForURL('/todos');

		// Reverter a senha para o valor original
		await page.goto('/change-password');
		await page.getByLabel('Senha atual').fill('nova-senha-temp-123456');
		await page.getByLabel('Nova senha').fill(SEED_PASSWORD);
		await page.getByLabel('Confirmar nova senha').fill(SEED_PASSWORD);
		await page.getByRole('button', { name: 'Trocar senha' }).click();
		await page.waitForURL('/todos');
	});

	test('mostra erro com senha atual incorreta', async ({ page }) => {
		await page.goto('/login');
		await page.getByLabel('E-mail').fill(SEED_EMAIL);
		await page.getByLabel('Senha').fill(SEED_PASSWORD);
		await page.getByRole('button', { name: 'Entrar' }).click();
		await page.waitForURL('/todos');

		await page.goto('/change-password');
		await page.getByLabel('Senha atual').fill('senha-errada');
		await page.getByLabel('Nova senha').fill('nova-senha-123');
		await page.getByLabel('Confirmar nova senha').fill('nova-senha-123');
		await page.getByRole('button', { name: 'Trocar senha' }).click();

		await expect(page.getByText(/Senha atual incorreta/i)).toBeVisible();
	});
});
