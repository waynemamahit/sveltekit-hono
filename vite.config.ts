import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
	plugins: [tailwindcss(), sveltekit(), svelteTesting()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: ['src/routes/**/*'],
		environment: 'jsdom',
		setupFiles: ['./src/tests/setup.ts'],
		globals: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov', 'text-summary'],
			reportsDirectory: './coverage',
			include: [
				'src/**/*.{js,ts,svelte}',
				'src/lib/**/*.{js,ts,svelte}',
				'src/models/**/*.{js,ts}',
				'src/types/**/*.{js,ts}',
				'src/ui/**/*.{js,ts,svelte}'
			],
			exclude: [
				// Test files
				'src/tests/**/*',
				'src/**/*.{test,spec}.{js,ts}',
				'src/**/*.test.{js,ts}',
				'src/**/*.spec.{js,ts}',

				// Route files (SvelteKit specific)
				'src/routes/**/*',
				'src/app.html',
				'src/app.css',

				// Type definitions
				'src/**/*.d.ts',
				'src/app.d.ts',

				// Build and config files
				'**/*.config.*',
				'build/',
				'.svelte-kit/',
				'node_modules/',

				// Generated files
				'**/*{.,-}generated.{js,ts}',
				'**/generated/**'
			],
			thresholds: {
				global: {
					branches: 80,
					functions: 80,
					lines: 80,
					statements: 80
				},
				// Per-file thresholds
				'src/lib/**/*.{js,ts}': {
					branches: 85,
					functions: 85,
					lines: 85,
					statements: 85
				},
				'src/models/**/*.{js,ts}': {
					branches: 90,
					functions: 90,
					lines: 90,
					statements: 90
				},
				'src/types/**/*.{js,ts}': {
					branches: 70,
					functions: 70,
					lines: 70,
					statements: 70
				}
			},
			// Clean coverage directory before each run
			clean: true,
			// Enable all coverage collection
			all: true,
			// Skip coverage for files with no tests
			skipFull: false
		}
	}
}));
