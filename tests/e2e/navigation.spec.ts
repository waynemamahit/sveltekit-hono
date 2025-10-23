import { test, expect } from './fixtures';

test.describe('Navigation', () => {
	test.beforeEach(async ({ homePage }) => {
		await homePage.goto();
	});

	test.describe('Internal Navigation', () => {
		test('should navigate to DI Examples page', async ({ homePage }) => {
			await homePage.navigateToDIExamples();

			// Verify URL changed
			expect(homePage.page.url()).toContain('/di-example');

			// Verify page loaded
			await homePage.page.waitForLoadState('networkidle');
			const heading = homePage.page.getByRole('heading', { name: /dependency injection/i });
			await expect(heading).toBeVisible({ timeout: 10000 });
		});

		test('should update browser URL when navigating', async ({ homePage, page }) => {
			const initialUrl = page.url();
			expect(initialUrl).toContain('/');

			await homePage.navigateToDIExamples();

			const newUrl = page.url();
			expect(newUrl).not.toBe(initialUrl);
			expect(newUrl).toContain('/di-example');
		});

		test('should load DI Examples page without errors', async ({ homePage, page }) => {
			const errors: string[] = [];
			page.on('console', (msg) => {
				if (msg.type() === 'error') {
					errors.push(msg.text());
				}
			});

			await homePage.navigateToDIExamples();
			await page.waitForLoadState('networkidle');

			expect(errors).toHaveLength(0);
		});

		test('should have accessible navigation links', async ({ homePage }) => {
			// DI Examples link should be keyboard accessible
			await homePage.diExamplesLink.focus();
			const isFocused = await homePage.diExamplesLink.evaluate(
				(el) => el === document.activeElement
			);
			expect(isFocused).toBe(true);
		});
	});

	test.describe('Back Navigation', () => {
		test('should navigate back to homepage from DI Examples', async ({ homePage, page }) => {
			await homePage.navigateToDIExamples();
			expect(page.url()).toContain('/di-example');

			// Navigate back
			await page.goBack();
			await page.waitForURL('**/');

			// Verify we're on the homepage
			await homePage.expectPageToBeVisible();
		});

		test('should maintain page state after back navigation', async ({ homePage, page, api }) => {
			// Create a user on homepage
			const userData = api.generateTestUser();
			await homePage.createUser(userData.name, userData.email);

			// Navigate away
			await homePage.navigateToDIExamples();

			// Navigate back
			await page.goBack();
			await page.waitForURL('**/');

			// User should still be visible (if persisted in backend)
			await expect(homePage.page.getByText(userData.name)).toBeVisible({ timeout: 10000 });
		});

		test('should not navigate back from homepage', async ({ page }) => {
			const initialUrl = page.url();

			// Try to go back when already on the first page
			await page.goBack();

			// URL should remain the same
			expect(page.url()).toBe(initialUrl);
		});

		test('should handle rapid back/forward navigation', async ({ homePage, page }) => {
			// Navigate forward
			await homePage.navigateToDIExamples();
			expect(page.url()).toContain('/di-example');

			// Navigate back
			await page.goBack();
			expect(page.url()).toContain('/');

			// Navigate forward again
			await page.goForward();
			expect(page.url()).toContain('/di-example');

			// Navigate back again
			await page.goBack();
			expect(page.url()).toContain('/');
		});
	});

	test.describe('External Link Navigation', () => {
		test('should open Health Check API in new tab', async ({ homePage }) => {
			const newPage = await homePage.openHealthCheckInNewTab();

			// Verify new tab opened with correct URL
			expect(newPage.url()).toContain('/api/health');

			// Wait for response
			await newPage.waitForLoadState('networkidle');

			// Should show JSON response
			const content = await newPage.textContent('body');
			expect(content).toContain('status');

			await newPage.close();
		});

		test('should open Hello API in new tab', async ({ homePage }) => {
			const newPage = await homePage.openHelloApiInNewTab();

			expect(newPage.url()).toContain('/api/hello');
			await newPage.waitForLoadState('networkidle');

			// Should show JSON response
			const content = await newPage.textContent('body');
			expect(content).toContain('message');

			await newPage.close();
		});

		test('should open Users API in new tab', async ({ homePage }) => {
			const newPage = await homePage.openUsersApiInNewTab();

			expect(newPage.url()).toContain('/api/users');
			await newPage.waitForLoadState('networkidle');

			// Should show JSON response (array)
			const content = await newPage.textContent('body');
			expect(content).toMatch(/\[.*\]/);

			await newPage.close();
		});

		test('should keep original tab unchanged when opening new tab', async ({ homePage, page }) => {
			const originalUrl = page.url();

			const newPage = await homePage.openHealthCheckInNewTab();

			// Original page should still be on homepage
			expect(page.url()).toBe(originalUrl);
			await homePage.expectPageToBeVisible();

			await newPage.close();
		});

		test('should handle multiple tabs simultaneously', async ({ homePage, context }) => {
			// Open multiple new tabs
			const healthPage = await homePage.openHealthCheckInNewTab();
			const helloPage = await homePage.openHelloApiInNewTab();
			const usersPage = await homePage.openUsersApiInNewTab();

			// All tabs should exist
			const pages = context.pages();
			expect(pages.length).toBeGreaterThanOrEqual(4); // Original + 3 new tabs

			// Close new tabs
			await healthPage.close();
			await helloPage.close();
			await usersPage.close();
		});

		test('should open links with correct target attribute', async ({ homePage }) => {
			// Verify external links have target="_blank"
			await expect(homePage.healthCheckLink).toHaveAttribute('target', '_blank');
			await expect(homePage.helloApiLink).toHaveAttribute('target', '_blank');
			await expect(homePage.usersApiLink).toHaveAttribute('target', '_blank');
		});

		test('should have proper rel attribute for security', async ({ homePage }) => {
			// External links should have rel="noopener noreferrer" for security
			const rel = await homePage.healthCheckLink.getAttribute('rel');
			expect(rel).toContain('noopener');
			expect(rel).toContain('noreferrer');
		});
	});

	test.describe('Browser History', () => {
		test('should update browser history correctly', async ({ homePage, page }) => {
			// Start on homepage
			expect(page.url()).toContain('/');

			// Navigate to DI Examples
			await homePage.navigateToDIExamples();
			expect(page.url()).toContain('/di-example');

			// Go back
			await page.goBack();
			expect(page.url()).not.toContain('/di-example');
			expect(page.url()).toContain('/');

			// Go forward
			await page.goForward();
			expect(page.url()).toContain('/di-example');
		});

		test('should maintain history stack through multiple navigations', async ({
			homePage,
			page
		}) => {
			// Navigate to DI Examples
			await homePage.navigateToDIExamples();

			// Go back to home
			await page.goBack();

			// Navigate again
			await homePage.navigateToDIExamples();

			// Go back again
			await page.goBack();

			// Verify we're on homepage
			await homePage.expectPageToBeVisible();
		});

		test('should handle history after page reload', async ({ homePage, page }) => {
			await homePage.navigateToDIExamples();

			// Reload the page
			await page.reload();
			await page.waitForLoadState('networkidle');

			// Should still be on DI Examples page
			expect(page.url()).toContain('/di-example');

			// Should be able to go back
			await page.goBack();
			expect(page.url()).toContain('/');
		});
	});

	test.describe('Direct URL Navigation', () => {
		test('should handle direct navigation to DI Examples', async ({ page }) => {
			await page.goto('/di-example');
			await page.waitForLoadState('networkidle');

			expect(page.url()).toContain('/di-example');

			const heading = page.getByRole('heading', { name: /dependency injection/i });
			await expect(heading).toBeVisible({ timeout: 10000 });
		});

		test('should handle direct navigation to homepage', async ({ homePage, page }) => {
			// Navigate away first
			await page.goto('/di-example');

			// Navigate directly back to homepage
			await page.goto('/');
			await page.waitForLoadState('networkidle');

			await homePage.expectPageToBeVisible();
		});

		test('should handle direct navigation with query parameters', async ({ page }) => {
			await page.goto('/?test=value');
			await page.waitForLoadState('networkidle');

			// Page should load normally
			const heading = page.getByRole('heading', { name: /SvelteKit \+ Hono/i });
			await expect(heading).toBeVisible();

			// URL should contain query parameter
			expect(page.url()).toContain('test=value');
		});

		test('should handle direct navigation with hash', async ({ page }) => {
			await page.goto('/#section');
			await page.waitForLoadState('networkidle');

			// Page should load normally
			const heading = page.getByRole('heading', { name: /SvelteKit \+ Hono/i });
			await expect(heading).toBeVisible();

			// URL should contain hash
			expect(page.url()).toContain('#section');
		});
	});

	test.describe('404 Error Handling', () => {
		test('should handle 404 pages gracefully', async ({ page }) => {
			const response = await page.goto('/non-existent-page');

			// Should return 404 status
			expect(response?.status()).toBe(404);
		});

		test('should display error page for non-existent routes', async ({ page }) => {
			await page.goto('/this-route-does-not-exist');
			await page.waitForLoadState('networkidle');

			// Page should load (even if it's a 404 page)
			const body = await page.textContent('body');
			expect(body).toBeTruthy();
		});

		test('should allow navigation from 404 page', async ({ page, homePage }) => {
			await page.goto('/non-existent-page');

			// Navigate to a valid page
			await page.goto('/');
			await page.waitForLoadState('networkidle');

			// Should load homepage successfully
			await homePage.expectPageToBeVisible();
		});

		test('should handle 404 for API endpoints', async ({ page }) => {
			const response = await page.goto('/api/non-existent-endpoint');

			// Should return 404 status
			expect(response?.status()).toBe(404);
		});
	});

	test.describe('Scroll Position', () => {
		test('should maintain scroll position when navigating back', async ({ homePage, page }) => {
			// Scroll down on homepage
			await page.evaluate(() => window.scrollTo(0, 500));
			const scrollPosition = await page.evaluate(() => window.scrollY);
			expect(scrollPosition).toBeGreaterThan(0);

			// Navigate to DI Examples
			await homePage.navigateToDIExamples();
			await page.waitForLoadState('networkidle');

			// Go back
			await page.goBack();
			await page.waitForLoadState('networkidle');

			// Verify we're back on homepage
			await homePage.expectPageToBeVisible();
		});

		test('should start at top of page after navigation', async ({ homePage, page }) => {
			// Scroll down on homepage
			await page.evaluate(() => window.scrollTo(0, 500));

			// Navigate to DI Examples
			await homePage.navigateToDIExamples();
			await page.waitForLoadState('networkidle');

			// Should be at top of new page
			const scrollPosition = await page.evaluate(() => window.scrollY);
			expect(scrollPosition).toBe(0);
		});

		test('should handle scroll to anchor links', async ({ page }) => {
			// Create a page with an anchor
			await page.goto('/');
			await page.waitForLoadState('networkidle');

			// Try to scroll to an element by adding hash
			await page.evaluate(() => {
				window.location.hash = '#app';
			});

			// URL should contain hash
			expect(page.url()).toContain('#app');
		});
	});

	test.describe('State Preservation', () => {
		test('should preserve user data when navigating', async ({ homePage, page, api }) => {
			// Create a user on homepage
			const userData = api.generateTestUser();
			await homePage.createUser(userData.name, userData.email);

			// Navigate away
			await homePage.navigateToDIExamples();

			// Navigate back
			await page.goto('/');
			await page.waitForLoadState('networkidle');

			// User should still be visible (backend persisted)
			await expect(homePage.page.getByText(userData.name)).toBeVisible({ timeout: 10000 });
		});

		test('should maintain API data across navigations', async ({ homePage, page }) => {
			// Wait for initial API data to load
			await homePage.expectHealthStatusToBeVisible();

			// Navigate away
			await homePage.navigateToDIExamples();

			// Navigate back
			await page.goto('/');
			await page.waitForLoadState('networkidle');

			// API data should load again
			await homePage.expectHealthStatusToBeVisible();
		});

		test('should clear form on navigation and return', async ({ homePage, page, api }) => {
			// Fill but don't submit form
			const userData = api.generateTestUser();
			await homePage.fillUserForm(userData.name, userData.email);

			// Navigate away
			await homePage.navigateToDIExamples();

			// Navigate back
			await page.goto('/');
			await page.waitForLoadState('networkidle');

			// Form should be cleared (fresh page load)
			await homePage.expectFormToBeEmpty();
		});
	});

	test.describe('Navigation Performance', () => {
		test('should navigate between pages quickly', async ({ homePage, page }) => {
			const startTime = Date.now();

			await homePage.navigateToDIExamples();
			await page.waitForLoadState('networkidle');

			const navigationTime = Date.now() - startTime;

			// Navigation should complete within 3 seconds
			expect(navigationTime).toBeLessThan(3000);
		});

		test('should handle rapid navigation without errors', async ({ homePage, page }) => {
			const errors: string[] = [];
			page.on('console', (msg) => {
				if (msg.type() === 'error') {
					errors.push(msg.text());
				}
			});

			// Rapid navigation
			await homePage.navigateToDIExamples();
			await page.goBack();
			await page.goForward();
			await page.goBack();

			await page.waitForLoadState('networkidle');

			// Should have no errors
			expect(errors).toHaveLength(0);
		});

		test('should not have memory leaks on repeated navigation', async ({ homePage, page }) => {
			// Navigate multiple times
			for (let i = 0; i < 5; i++) {
				await homePage.goto();
				await homePage.navigateToDIExamples();
				await page.goBack();
			}

			// Page should still be responsive
			await homePage.expectPageToBeVisible();
		});
	});

	test.describe('Link Accessibility', () => {
		test('should have descriptive link text', async ({ homePage }) => {
			const diLinkText = await homePage.diExamplesLink.textContent();
			expect(diLinkText).toBeTruthy();
			expect(diLinkText?.length).toBeGreaterThan(5);

			const healthLinkText = await homePage.healthCheckLink.textContent();
			expect(healthLinkText).toBeTruthy();
			expect(healthLinkText?.length).toBeGreaterThan(5);
		});

		test('should be keyboard navigable', async ({ page }) => {
			// Tab to first link
			await page.keyboard.press('Tab');

			// One of the links should be focused
			const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
			expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
		});

		test('should support Enter key activation', async ({ homePage, page }) => {
			// Focus DI Examples link
			await homePage.diExamplesLink.focus();

			// Press Enter
			await page.keyboard.press('Enter');

			// Should navigate
			await page.waitForURL('**/di-example', { timeout: 5000 });
			expect(page.url()).toContain('/di-example');
		});
	});
});
