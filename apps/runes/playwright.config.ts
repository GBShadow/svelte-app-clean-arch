import { defineConfig, devices } from '@playwright/test';

const port = 5175;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: 'list',
	use: {
		baseURL,
		trace: 'on-first-retry',
		headless: true
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		// Build de produção + preview: no dev server, o websocket de HMR do Vite
		// deixa a hidratação não-determinística e os forms são submetidos antes de
		// os inputs serem preenchidos. O preview elimina essa corrida.
		command: `pnpm run build && pnpm run preview --port ${port} --strictPort`,
		url: baseURL,
		reuseExistingServer: true,
		timeout: 120_000
	}
});
