import { test, expect } from './fixtures';

test.describe('Profile E2E', () => {
	test('pagina de perfil carrega com elementos principais', async ({ page }) => {
		await page.goto('/profile');
		await expect(page.getByText('Meu perfil')).toBeVisible();
		await expect(page.getByTestId('avatar-form')).toBeVisible();
		await expect(page.getByTestId('input-avatar')).toBeVisible();
		await expect(page.getByTestId('btn-upload-avatar')).toBeVisible();
	});

	test('secao de notificacoes push aparece', async ({ page }) => {
		await page.goto('/profile');
		await expect(page.getByText('Notificações push')).toBeVisible();
	});

	test('seletor de acentuacao aparece', async ({ page }) => {
		await page.goto('/profile');
		await expect(page.getByText('Acentuar')).toBeVisible();
	});
});
