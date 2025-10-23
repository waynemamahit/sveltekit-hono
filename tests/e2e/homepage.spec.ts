import { test, expect } from './fixtures';
import { HomePage } from './pages/HomePage';

test.describe('Homepage', () => {
	test.beforeEach(async ({ homePage }) => {
		await homePage.goto();
	});

	test.describe('Page Structure', () => {
		test('should display the main heading and description', async ({ homePage }) => {
			await expect(homePage.page).toHaveTitle('Hono + SvelteKit Starter');
			await homePage.expectPageToBeVisible();
		});

		test('should have correct page metadata', async ({ page }) => {
			const description = await page.locator('meta[name="description"]').getAttribute('content');
			expect(description).toBe('Hono + SvelteKit starter app');
		});
	});

	test.describe('API Integration', () => {
		test('should display API health status', async ({ homePage }) => {
			await homePage.expectHealthStatusToBeVisible();

			const statusText = homePage.page.getByText(/Status:/i);
			await expect(statusText).toBeVisible();

			const environmentText = homePage.page.getByText(/Environment:/i);
			await expect(environmentText).toBeVisible();
		});

		test('should display Hello API response', async ({ homePage }) => {
			await homePage.expectHelloApiResponseToBeLoaded();

			// Verify the response details section exists
			const detailsSection = homePage.page.locator('details');
			await expect(detailsSection).toBeVisible();
		});

		test('should load API data without errors', async ({ page }) => {
			// Wait for all API calls to complete
			await page.waitForLoadState('networkidle');

			// Check that no error messages are displayed
			const errorMessage = page.getByText(/error/i);
			await expect(errorMessage).not.toBeVisible();
		});
	});

	test.describe('User Management Section', () => {
		test('should display user management section with form', async ({ homePage }) => {
			await homePage.expectUserManagementSectionToBeVisible();

			// Verify form elements
			await expect(homePage.nameInput).toBeVisible();
			await expect(homePage.emailInput).toBeVisible();
			await expect(homePage.addUserButton).toBeVisible();
		});

		test('should have proper form field attributes', async ({ homePage }) => {
			// Check input types and placeholders
			await expect(homePage.nameInput).toHaveAttribute('type', 'text');
			await expect(homePage.emailInput).toHaveAttribute('type', 'email');

			// Check placeholders
			const namePlaceholder = await homePage.nameInput.getAttribute('placeholder');
			expect(namePlaceholder).toMatch(/name/i);

			const emailPlaceholder = await homePage.emailInput.getAttribute('placeholder');
			expect(emailPlaceholder).toMatch(/email/i);
		});

		test('should display users list heading', async ({ homePage }) => {
			await expect(homePage.usersHeading).toBeVisible();

			// Verify heading shows count
			const headingText = await homePage.usersHeading.textContent();
			expect(headingText).toMatch(/Users \(\d+\)/);
		});
	});

	test.describe('Navigation Links', () => {
		test('should display all navigation links with correct URLs', async ({ homePage }) => {
			await homePage.expectNavigationLinksToBeVisible();
		});

		test('should have proper link attributes', async ({ homePage }) => {
			// Check that external API links open in new tab
			await expect(homePage.healthCheckLink).toHaveAttribute('target', '_blank');
			await expect(homePage.healthCheckLink).toHaveAttribute('rel', 'noopener noreferrer');

			await expect(homePage.helloApiLink).toHaveAttribute('target', '_blank');
			await expect(homePage.usersApiLink).toHaveAttribute('target', '_blank');
		});

		test('should have accessible link text', async ({ homePage }) => {
			// Verify links have descriptive text for accessibility
			const diLinkText = await homePage.diExamplesLink.textContent();
			expect(diLinkText).toContain('DI Examples');

			const healthLinkText = await homePage.healthCheckLink.textContent();
			expect(healthLinkText).toContain('Health Check');
		});
	});

	test.describe('Responsive Design', () => {
		test('should be responsive on mobile viewport', async ({ page }) => {
			const homePage = new HomePage(page);
			await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
			await homePage.goto();

			// Main elements should still be visible
			await expect(homePage.heading).toBeVisible();
			await expect(homePage.userManagementSection).toBeVisible();
		});

		test('should be responsive on tablet viewport', async ({ homePage }) => {
			await homePage.page.setViewportSize({ width: 768, height: 1024 }); // iPad
			await homePage.goto();

			await expect(homePage.heading).toBeVisible();
			await expect(homePage.userManagementSection).toBeVisible();
		});

		test('should be responsive on desktop viewport', async ({ homePage }) => {
			await homePage.page.setViewportSize({ width: 1920, height: 1080 }); // Full HD
			await homePage.goto();

			await expect(homePage.heading).toBeVisible();
			await expect(homePage.userManagementSection).toBeVisible();
		});
	});

	test.describe('Page Performance', () => {
		test('should load page within acceptable time', async ({ homePage }) => {
			const startTime = Date.now();
			await homePage.goto();
			const loadTime = Date.now() - startTime;

			// Page should load within 5 seconds
			expect(loadTime).toBeLessThan(5000);
		});

		test('should have no console errors on load', async ({ homePage, page }) => {
			const consoleErrors: string[] = [];

			page.on('console', (msg) => {
				if (msg.type() === 'error') {
					consoleErrors.push(msg.text());
				}
			});

			await homePage.goto();

			// Should have no console errors
			expect(consoleErrors).toHaveLength(0);
		});
	});
});
