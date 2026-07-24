import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['test/**/*.{test,spec}.{js,ts}'],
		coverage: {
			provider: 'v8',
			enabled: false,
			include: ['src/**'],
			exclude: ['src/**/*.{test,spec}.{js,ts}', 'src/**/*.d.ts'],
			thresholds: {
				statements: 95,
				branches: 95,
				functions: 95,
				lines: 95
			},
			reporter: ['text', 'lcov', 'html']
		}
	}
});
