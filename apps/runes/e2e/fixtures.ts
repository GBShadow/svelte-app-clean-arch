import { test as base } from '@playwright/test';

const SEED_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'seed-admin@example.com';
const SEED_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'changeme123456';

export const test = base.extend({
	page: async ({ page }, use) => {
		await page.goto('/login');
		await page.getByLabel('E-mail').fill(SEED_EMAIL);
		await page.getByLabel('Senha').fill(SEED_PASSWORD);
		await page.getByRole('button', { name: 'Entrar' }).click();
		await page.waitForURL('/todos');

		await use(page);
	}
});

export { expect } from '@playwright/test';
