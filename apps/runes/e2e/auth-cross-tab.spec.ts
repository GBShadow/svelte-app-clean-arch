import { test, expect } from '@playwright/test';
import { assertSeedAdmin, SEED_EMAIL, SEED_PASSWORD } from './env';

test.describe('Sincronização de login/logout entre abas (BroadcastChannel)', () => {
	test.beforeEach(async ({ request }) => {
		await assertSeedAdmin(request);
	});

	test('login em uma aba tira a outra aba de /login automaticamente', async ({ context }) => {
		const tabA = await context.newPage();
		const tabB = await context.newPage();

		await tabA.goto('/login');
		await tabB.goto('/login');

		await tabA.getByTestId('input-email').fill(SEED_EMAIL);
		await tabA.getByTestId('input-password').fill(SEED_PASSWORD);
		await tabA.getByTestId('btn-login').click();
		await tabA.waitForURL('/');

		await tabB.waitForURL('/', { timeout: 5_000 });
		await expect(tabB.getByTestId('app-card-tarefas')).toBeVisible();
	});

	test('logout em uma aba desloga e redireciona a outra aba automaticamente', async ({
		context
	}) => {
		const tabA = await context.newPage();
		await tabA.goto('/login');
		await tabA.getByTestId('input-email').fill(SEED_EMAIL);
		await tabA.getByTestId('input-password').fill(SEED_PASSWORD);
		await tabA.getByTestId('btn-login').click();
		await tabA.waitForURL('/');

		const tabB = await context.newPage();
		await tabB.goto('/todos');
		await expect(tabB).toHaveURL('/todos');

		await tabA.getByTestId('btn-logout').click();
		await tabA.waitForURL('/login');

		await tabB.waitForURL('/login', { timeout: 10_000 });
	});
});
