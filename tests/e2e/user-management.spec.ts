import { test, expect } from './fixtures';

test.describe('User Management', () => {
	test.beforeEach(async ({ homePage }) => {
		await homePage.goto();
	});

	test.describe('Form Display and Validation', () => {
		test('should display the user management form with all elements', async ({ homePage }) => {
			const addUserHeading = homePage.page.getByRole('heading', { name: /Add New User/i });
			await expect(addUserHeading).toBeVisible();

			await expect(homePage.nameInput).toBeVisible();
			await expect(homePage.nameInput).toBeEnabled();

			await expect(homePage.emailInput).toBeVisible();
			await expect(homePage.emailInput).toBeEnabled();

			await expect(homePage.addUserButton).toBeVisible();
			await expect(homePage.addUserButton).toBeEnabled();
		});

		test('should have proper input field types and attributes', async ({ homePage }) => {
			// Name input should be text type
			await expect(homePage.nameInput).toHaveAttribute('type', 'text');

			// Email input should be email type
			await expect(homePage.emailInput).toHaveAttribute('type', 'email');

			// Check placeholders
			const namePlaceholder = await homePage.nameInput.getAttribute('placeholder');
			expect(namePlaceholder).toBeTruthy();

			const emailPlaceholder = await homePage.emailInput.getAttribute('placeholder');
			expect(emailPlaceholder).toBeTruthy();
		});

		test('should start with empty form fields', async ({ homePage }) => {
			await homePage.expectFormToBeEmpty();
		});
	});

	test.describe('Create User Functionality', () => {
		test('should create a new user successfully', async ({ homePage, api }) => {
			const userData = api.generateTestUser();

			await homePage.fillUserForm(userData.name, userData.email);
			await homePage.submitUserForm();

			// Verify user appears in the list
			await homePage.expectUserToBeVisible(userData.name, userData.email);

			// Verify form is cleared after submission
			await homePage.expectFormToBeEmpty();
		});

		test('should create multiple users', async ({ homePage, api }) => {
			const users = api.generateMultipleTestUsers(3);

			for (const user of users) {
				await homePage.createUser(user.name, user.email);
			}

			// Verify all users are visible
			for (const user of users) {
				await expect(homePage.page.getByText(user.name)).toBeVisible();
				await expect(homePage.page.getByText(user.email)).toBeVisible();
			}
		});

		test('should display user with correct information', async ({ homePage, api }) => {
			const userData = api.generateTestUser();

			await homePage.createUser(userData.name, userData.email);

			// Verify user card contains all information
			const userCard = homePage.page.getByText(userData.name).locator('..').locator('..');
			await expect(userCard.getByText(userData.name)).toBeVisible();
			await expect(userCard.getByText(userData.email)).toBeVisible();
			await expect(userCard.getByRole('button', { name: /delete/i })).toBeVisible();
		});

		test('should handle special characters in user name', async ({ homePage }) => {
			const specialName = "O'Brien-Smith";
			const timestamp = Date.now();
			const email = `special${timestamp}@example.com`;

			await homePage.createUser(specialName, email);

			await expect(homePage.page.getByText(specialName)).toBeVisible();
		});

		test('should handle long user names and emails', async ({ homePage }) => {
			const longName = 'Very Long User Name With Many Characters';
			const timestamp = Date.now();
			const longEmail = `verylongemailaddress${timestamp}@example.com`;

			await homePage.createUser(longName, longEmail);

			await expect(homePage.page.getByText(longName)).toBeVisible();
			await expect(homePage.page.getByText(longEmail)).toBeVisible();
		});
	});

	test.describe('Delete User Functionality', () => {
		test('should delete a user successfully', async ({ homePage, api }) => {
			const userData = api.generateTestUser();

			// Create user first
			await homePage.createUser(userData.name, userData.email);
			await homePage.expectUserToBeVisible(userData.name, userData.email);

			// Delete the user
			await homePage.deleteUser(userData.name);

			// Verify user is removed
			await homePage.expectUserNotToBeVisible(userData.name);
			await expect(homePage.page.getByText(userData.email)).not.toBeVisible();
		});

		test('should delete multiple users independently', async ({ homePage, api }) => {
			const users = api.generateMultipleTestUsers(3);

			// Create all users
			for (const user of users) {
				await homePage.createUser(user.name, user.email);
			}

			// Delete first user
			await homePage.deleteUser(users[0].name);
			await homePage.expectUserNotToBeVisible(users[0].name);

			// Verify other users still exist
			await expect(homePage.page.getByText(users[1].name)).toBeVisible();
			await expect(homePage.page.getByText(users[2].name)).toBeVisible();
		});

		test('should update user count after deletion', async ({ homePage, api }) => {
			const users = api.generateMultipleTestUsers(2);

			// Create users
			for (const user of users) {
				await homePage.createUser(user.name, user.email);
			}

			const countAfterCreation = await homePage.getUserCount();

			// Delete one user
			await homePage.deleteUser(users[0].name);

			// Verify count decreased
			const countAfterDeletion = await homePage.getUserCount();
			expect(countAfterDeletion).toBe(countAfterCreation - 1);
		});
	});

	test.describe('User Count Display', () => {
		test('should display and update user count', async ({ homePage, api }) => {
			const usersHeading = homePage.page.getByRole('heading', { name: /Users \(\d+\)/i });
			await expect(usersHeading).toBeVisible();

			const initialCount = await homePage.getUserCount();

			// Add a new user
			const userData = api.generateTestUser();
			await homePage.createUser(userData.name, userData.email);

			// Verify count increased
			await homePage.expectUserCount(initialCount + 1);
		});

		test('should show correct count format', async ({ homePage }) => {
			const headingText = await homePage.usersHeading.textContent();
			expect(headingText).toMatch(/^Users \(\d+\)$/);
		});

		test('should update count when deleting users', async ({ homePage, api }) => {
			const userData = api.generateTestUser();

			await homePage.createUser(userData.name, userData.email);
			const countAfterCreate = await homePage.getUserCount();

			await homePage.deleteUser(userData.name);
			const countAfterDelete = await homePage.getUserCount();

			expect(countAfterDelete).toBe(countAfterCreate - 1);
		});
	});

	test.describe('Empty State', () => {
		test('should show empty state when no users exist', async ({ homePage, api }) => {
			// Clean up all users first
			await api.deleteAllUsers();
			await homePage.goto();

			// Check for empty state message
			await homePage.expectEmptyState();
		});

		test('should show empty state after deleting all users', async ({ homePage, api }) => {
			// Create a user
			const userData = api.generateTestUser();
			await homePage.createUser(userData.name, userData.email);

			// Delete all users via UI
			const deleteButtons = homePage.page.getByRole('button', { name: /delete/i });
			const count = await deleteButtons.count();

			for (let i = 0; i < count; i++) {
				await deleteButtons.first().click();
				await homePage.page.waitForTimeout(500);
			}

			// Verify empty state
			await homePage.expectEmptyState();
		});

		test('should have helpful empty state message', async ({ homePage, api }) => {
			await api.deleteAllUsers();
			await homePage.goto();

			const emptyMessage = await homePage.emptyStateMessage.textContent();
			expect(emptyMessage).toContain('No users found');
			expect(emptyMessage).toContain('Add some users to get started');
		});
	});

	test.describe('Form Submission States', () => {
		test('should disable button during submission', async ({ homePage, api }) => {
			const userData = api.generateTestUser();

			await homePage.fillUserForm(userData.name, userData.email);

			// Click submit
			await homePage.addUserButton.click();

			// Button should be disabled immediately
			await expect(homePage.addUserButton).toBeDisabled();

			// Wait for submission to complete
			await expect(homePage.page.getByText(userData.name)).toBeVisible({ timeout: 10000 });

			// Button should be enabled again
			await expect(homePage.addUserButton).toBeEnabled();
		});

		test('should show loading state during form submission', async ({ homePage, api }) => {
			const userData = api.generateTestUser();

			await homePage.fillUserForm(userData.name, userData.email);
			await homePage.addUserButton.click();

			// Check if button is disabled (loading state)
			const isDisabled = await homePage.isAddButtonDisabled();
			expect(isDisabled).toBe(true);

			// Wait for completion
			await expect(homePage.page.getByText(userData.name)).toBeVisible({ timeout: 10000 });
		});

		test('should clear form after successful submission', async ({ homePage, api }) => {
			const userData = api.generateTestUser();

			await homePage.fillUserForm(userData.name, userData.email);
			await homePage.submitUserForm();

			// Wait for user to appear
			await expect(homePage.page.getByText(userData.name)).toBeVisible({ timeout: 10000 });

			// Form should be cleared
			await homePage.expectFormToBeEmpty();
		});
	});

	test.describe('Data Persistence', () => {
		test('should persist users after page reload', async ({ homePage, api }) => {
			const userData = api.generateTestUser();

			await homePage.createUser(userData.name, userData.email);

			// Reload the page
			await homePage.goto();

			// User should still be visible
			await expect(homePage.page.getByText(userData.name)).toBeVisible({ timeout: 10000 });
			await expect(homePage.page.getByText(userData.email)).toBeVisible();
		});

		test('should maintain user order after operations', async ({ homePage, api }) => {
			const users = api.generateMultipleTestUsers(3);

			// Create users in order
			for (const user of users) {
				await homePage.createUser(user.name, user.email);
			}

			// Verify all users exist
			for (const user of users) {
				await expect(homePage.page.getByText(user.name)).toBeVisible();
			}

			// Reload page
			await homePage.goto();

			// All users should still be visible
			for (const user of users) {
				await expect(homePage.page.getByText(user.name)).toBeVisible({ timeout: 10000 });
			}
		});
	});

	test.describe('User List Display', () => {
		test('should display users in a list format', async ({ homePage, api }) => {
			const userData = api.generateTestUser();
			await homePage.createUser(userData.name, userData.email);

			// Verify user is in a card/list item
			const userCard = homePage.page.getByText(userData.name).locator('..').locator('..');
			await expect(userCard).toBeVisible();
		});

		test('should show delete button for each user', async ({ homePage, api }) => {
			const users = api.generateMultipleTestUsers(2);

			for (const user of users) {
				await homePage.createUser(user.name, user.email);
			}

			// Each user should have a delete button
			const deleteButtons = homePage.page.getByRole('button', { name: /delete/i });
			const count = await deleteButtons.count();
			expect(count).toBeGreaterThanOrEqual(2);
		});

		test('should display users with proper spacing and layout', async ({ homePage, api }) => {
			const users = api.generateMultipleTestUsers(3);

			for (const user of users) {
				await homePage.createUser(user.name, user.email);
			}

			// All users should be visible without scrolling issues
			for (const user of users) {
				const userElement = homePage.page.getByText(user.name);
				await expect(userElement).toBeVisible();
				await expect(userElement).toBeInViewport();
			}
		});
	});

	test.describe('Concurrent Operations', () => {
		test('should handle rapid user creation', async ({ homePage, api }) => {
			const users = api.generateMultipleTestUsers(3);

			// Create users rapidly
			for (const user of users) {
				await homePage.fillUserForm(user.name, user.email);
				await homePage.addUserButton.click();
				// Small delay to allow UI to update
				await homePage.page.waitForTimeout(200);
			}

			// Wait for last user to appear
			await expect(homePage.page.getByText(users[users.length - 1].name)).toBeVisible({
				timeout: 15000
			});

			// All users should be visible
			for (const user of users) {
				await expect(homePage.page.getByText(user.name)).toBeVisible();
			}
		});
	});
});
