import { test, expect } from '@playwright/test';

const SEED_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'seed-admin@example.com';
const SEED_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'changeme123456';

test.describe('Sincronização de login/logout entre abas (BroadcastChannel)', () => {
	test('login em uma aba tira a outra aba de /login automaticamente', async ({ context }) => {
		const tabA = await context.newPage();
		const tabB = await context.newPage();

		await tabA.goto('/login');
		await tabB.goto('/login');

		await tabA.getByLabel('E-mail').fill(SEED_EMAIL);
		await tabA.getByLabel('Senha').fill(SEED_PASSWORD);
		await tabA.getByRole('button', { name: 'Entrar' }).click();
		await tabA.waitForURL('/todos');

		await tabB.waitForURL('/todos', { timeout: 5_000 });
		await expect(tabB.getByRole('heading', { name: /Minhas listas/i })).toBeVisible();
	});

	test('logout em uma aba desloga e redireciona a outra aba automaticamente', async ({
		context
	}) => {
		const tabA = await context.newPage();
		await tabA.goto('/login');
		await tabA.getByLabel('E-mail').fill(SEED_EMAIL);
		await tabA.getByLabel('Senha').fill(SEED_PASSWORD);
		await tabA.getByRole('button', { name: 'Entrar' }).click();
		await tabA.waitForURL('/todos');

		const tabB = await context.newPage();
		await tabB.goto('/todos');
		await expect(tabB).toHaveURL('/todos');

		await tabA.getByRole('button', { name: /Sair/ }).click();
		await tabA.waitForURL('/login');

		await tabB.waitForURL('/login', { timeout: 5_000 });
	});
});
