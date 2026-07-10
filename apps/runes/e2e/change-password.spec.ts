import { test, expect } from '@playwright/test';
import { cleanupUser } from './cleanup';
import { assertSeedAdmin, SEED_EMAIL, SEED_PASSWORD } from './env';

const uniqueId = Date.now().toString(36);
const tempUser = {
	name: `Temp ${uniqueId}`,
	email: `temp-${uniqueId}@example.com`,
	jobTitle: 'junior' as const,
	password: 'temp-senha-1234',
	collection: 'user'
};

test.describe('Change Password (runes e2e)', () => {
	test.beforeEach(async ({ request }) => {
		await assertSeedAdmin(request);
	});

	test('troca de senha com sucesso usando usuário temporário', async ({ page }) => {
		// --- Login como admin ---
		await page.goto('/login');
		await page.getByTestId('input-email').fill(SEED_EMAIL);
		await page.getByTestId('input-password').fill(SEED_PASSWORD);
		await page.getByTestId('btn-login').click();
		await page.waitForURL('/');

		// --- Criar usuário temporário ---
		await page.goto('/users/new');
		await page.getByTestId('input-name').fill(tempUser.name);
		await page.getByTestId('input-email').fill(tempUser.email);
		await page.getByTestId('select-job-title').selectOption(tempUser.jobTitle);
		await page.getByTestId('input-password').fill(tempUser.password);
		await page.getByTestId('input-confirm-password').fill(tempUser.password);
		await page.getByTestId('btn-create-user').click();
		await page.waitForURL('/users');

		try {
			// --- Logout ---
			await page.getByTestId('btn-logout').click();
			await page.waitForURL('/login');

			// --- Login como usuário temporário ---
			await page.getByTestId('input-email').fill(tempUser.email);
			await page.getByTestId('input-password').fill(tempUser.password);
			await page.getByTestId('btn-login').click();
			await page.waitForURL('/');

			// --- Trocar senha ---
			const newPassword = 'nova-senha-temp-654321';
			await page.goto('/change-password');
			await page.getByTestId('input-current-password').fill(tempUser.password);
			await page.getByTestId('input-password').fill(newPassword);
			await page.getByTestId('input-confirm-password').fill(newPassword);
			await page.getByTestId('btn-change-password').click();

			// Após trocar a senha, o PocketBase invalida o token,
			// então o servidor redireciona para /login
			await page.waitForURL('/login');

			// --- Re-login com a nova senha ---
			await page.getByTestId('input-email').fill(tempUser.email);
			await page.getByTestId('input-password').fill(newPassword);
			await page.getByTestId('btn-login').click();
			await page.waitForURL('/');
		} finally {
			await cleanupUser(page.request, tempUser.email);
		}
	});

	test('mostra erro com senha atual incorreta', async ({ page }) => {
		// Usa um usuário não-admin: o PocketBase só exige oldPassword de quem
		// não casa o manageRule (isAdmin = true). Com um admin, a troca passaria
		// sem a senha atual — o que é justamente a brecha que a action agora fecha.
		const wrongPwUser = {
			name: `Temp ${uniqueId}-wp`,
			email: `temp-${uniqueId}-wp@example.com`,
			jobTitle: 'junior' as const,
			password: 'temp-senha-1234'
		};

		await page.goto('/login');
		await page.getByTestId('input-email').fill(SEED_EMAIL);
		await page.getByTestId('input-password').fill(SEED_PASSWORD);
		await page.getByTestId('btn-login').click();
		await page.waitForURL('/');

		await page.goto('/users/new');
		await page.getByTestId('input-name').fill(wrongPwUser.name);
		await page.getByTestId('input-email').fill(wrongPwUser.email);
		await page.getByTestId('select-job-title').selectOption(wrongPwUser.jobTitle);
		await page.getByTestId('input-password').fill(wrongPwUser.password);
		await page.getByTestId('input-confirm-password').fill(wrongPwUser.password);
		await page.getByTestId('btn-create-user').click();
		await page.waitForURL('/users');

		try {
			await page.getByTestId('btn-logout').click();
			await page.waitForURL('/login');

			await page.getByTestId('input-email').fill(wrongPwUser.email);
			await page.getByTestId('input-password').fill(wrongPwUser.password);
			await page.getByTestId('btn-login').click();
			await page.waitForURL('/');

			await page.goto('/change-password');
			await page.getByTestId('input-current-password').fill('senha-errada');
			await page.getByTestId('input-password').fill('nova-senha-123456');
			await page.getByTestId('input-confirm-password').fill('nova-senha-123456');
			await page.getByTestId('btn-change-password').click();

			await expect(page.getByTestId('error-current-password')).toBeVisible();
		} finally {
			await cleanupUser(page.request, wrongPwUser.email);
		}
	});
});
