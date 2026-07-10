import { test as base } from '@playwright/test';

export const test = base.extend({
	page: async ({ page, request }, use) => {
		await request.post('/api/test/reset');
		await use(page);
	}
});

export { expect } from '@playwright/test';
