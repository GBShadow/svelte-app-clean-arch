import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	envDir: '../..',
	server: {
		port: 5175
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
				experimental: { async: true }
			},
			adapter: adapter(),
			env: { dir: '../..' }
		})
	],
	test: {
		expect: { requireAssertions: true },
		environment: 'node',
		include: ['src/**/*.{test,spec}.{js,ts}'],
		coverage: {
			provider: 'v8',
			enabled: false,
			include: ['src/**'],
			exclude: [
				'src/lib/server/**',
				'src/**/*.{test,spec}.{js,ts}',
				'src/**/*.d.ts',
				'src/app.d.ts',
				'src/**/*.svelte',
				'src/hooks.server.ts',
				'src/service-worker.ts',
				'src/app.html',
				'src/routes/**'
			],
			thresholds: {
				statements: 80,
				branches: 70,
				functions: 80,
				lines: 80
			},
			reporter: ['text', 'lcov', 'html']
		}
	}
});
