import { test as base } from '@playwright/test';
import { expect } from '@playwright/test';
import { assertSeedAdmin, SEED_EMAIL, SEED_PASSWORD } from './env';

export const test = base.extend({
	page: async ({ page }, use) => {
		await assertSeedAdmin(page.request);

		await page.goto('/login');
		await page.getByTestId('input-email').fill(SEED_EMAIL);
		await page.getByTestId('input-password').fill(SEED_PASSWORD);
		await page.getByTestId('btn-login').click();

		// Após login, o SvelteKit redireciona para / (home) e invalida os loads
		await page.waitForURL('/', { timeout: 10_000 });
		await expect(page.getByTestId('app-card-tarefas')).toBeVisible({ timeout: 5_000 });

		await use(page);
	}
});

export { expect } from '@playwright/test';
