import { test as base, expect } from '@playwright/test';
import { ApiHelpers } from './api-helpers';
import { HomePage } from '../pages/HomePage';

// Extend base test with custom fixtures
type TestFixtures = {
	homePage: HomePage;
	api: ApiHelpers;
};

export const test = base.extend<TestFixtures>({
	// HomePage fixture
	homePage: async ({ page }, use) => {
		const homePage = new HomePage(page);
		await use(homePage);
	},

	// API helpers fixture
	api: async ({ request }, use) => {
		const apiHelpers = new ApiHelpers(request);

		// Setup: Clean up any existing test users before test
		try {
			await apiHelpers.cleanupTestUsers();
		} catch {
			// Ignore cleanup errors at start
		}

		await use(apiHelpers);

		// Teardown: Clean up test users after test
		try {
			await apiHelpers.cleanupTestUsers();
		} catch {
			// Ignore cleanup errors at end
		}
	}
});

export { expect };
