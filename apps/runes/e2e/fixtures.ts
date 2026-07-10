import { test as base } from '@playwright/test';
import { assertSeedAdmin, SEED_EMAIL, SEED_PASSWORD } from './env';

export const test = base.extend({
	page: async ({ page }, use) => {
		await assertSeedAdmin(page.request);

		await page.goto('/login');
		await page.getByTestId('input-email').fill(SEED_EMAIL);
		await page.getByTestId('input-password').fill(SEED_PASSWORD);
		await page.getByTestId('btn-login').click();
		await page.waitForURL('/todos');

		await use(page);
	}
});

export { expect } from '@playwright/test';
