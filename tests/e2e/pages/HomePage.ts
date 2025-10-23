import { type Page, type Locator, expect } from '@playwright/test';

export class HomePage {
	readonly page: Page;

	// Main sections
	readonly heading: Locator;
	readonly description: Locator;
	readonly healthStatusSection: Locator;
	readonly helloApiSection: Locator;
	readonly userManagementSection: Locator;

	// Navigation links
	readonly diExamplesLink: Locator;
	readonly healthCheckLink: Locator;
	readonly helloApiLink: Locator;
	readonly usersApiLink: Locator;

	// User management form
	readonly nameInput: Locator;
	readonly emailInput: Locator;
	readonly addUserButton: Locator;

	// User list
	readonly usersHeading: Locator;
	readonly emptyStateMessage: Locator;

	constructor(page: Page) {
		this.page = page;

		// Main sections
		this.heading = page.getByRole('heading', { name: /SvelteKit \+ Hono \+ Cloudflare/i });
		this.description = page.getByText(
			/A modern full-stack application with SvelteKit frontend and Hono API backend/i
		);
		this.healthStatusSection = page.getByText(/API Health Status/i);
		this.helloApiSection = page.getByRole('heading', { name: /Hello API Response/i });
		this.userManagementSection = page.getByRole('heading', { name: /User Management Demo/i });

		// Navigation links
		this.diExamplesLink = page.getByRole('link', { name: /DI Examples/i });
		this.healthCheckLink = page.getByRole('link', { name: /Health Check/i });
		this.helloApiLink = page.getByRole('link', { name: /Hello API/i });
		this.usersApiLink = page.getByRole('link', { name: /Users API/i });

		// User management form
		this.nameInput = page.getByPlaceholder(/name/i);
		this.emailInput = page.getByPlaceholder(/email/i);
		this.addUserButton = page.getByRole('button', { name: /add user/i });

		// User list
		this.usersHeading = page.getByRole('heading', { name: /Users \(\d+\)/i });
		this.emptyStateMessage = page.getByText(/No users found. Add some users to get started!/i);
	}

	async goto() {
		await this.page.goto('/');
		await this.page.waitForLoadState('networkidle');
	}

	async waitForPageLoad() {
		await expect(this.heading).toBeVisible();
		await this.page.waitForLoadState('networkidle');
	}

	// User management actions
	async fillUserForm(name: string, email: string) {
		await this.nameInput.fill(name);
		await this.emailInput.fill(email);
	}

	async submitUserForm() {
		await this.addUserButton.click();
	}

	async createUser(name: string, email: string) {
		await this.fillUserForm(name, email);
		await this.submitUserForm();
		// Wait for the user to appear in the list
		await expect(this.page.getByText(name).first()).toBeVisible({ timeout: 10000 });
	}

	async deleteUser(name: string) {
		const userCard = this.page.getByText(name).locator('..').locator('..');
		const deleteButton = userCard.getByRole('button', { name: /delete/i });
		await deleteButton.click();
		// Wait for the user to be removed
		await expect(this.page.getByText(name)).not.toBeVisible({ timeout: 10000 });
	}

	async deleteFirstUser() {
		const deleteButton = this.page.getByRole('button', { name: /delete/i }).first();
		await deleteButton.click();
		await this.page.waitForTimeout(500);
	}

	async getUserByName(name: string): Promise<Locator> {
		return this.page.getByText(name);
	}

	async getUserByEmail(email: string): Promise<Locator> {
		return this.page.getByText(email);
	}

	async getUserCount(): Promise<number> {
		const text = await this.usersHeading.textContent();
		const match = text?.match(/\d+/);
		return match ? parseInt(match[0]) : 0;
	}

	async isFormEmpty(): Promise<boolean> {
		const nameValue = await this.nameInput.inputValue();
		const emailValue = await this.emailInput.inputValue();
		return nameValue === '' && emailValue === '';
	}

	async isAddButtonDisabled(): Promise<boolean> {
		return await this.addUserButton.isDisabled();
	}

	// Navigation actions
	async navigateToDIExamples() {
		await this.diExamplesLink.click();
		await this.page.waitForURL('**/di-example');
	}

	async openHealthCheckInNewTab() {
		return await this.openLinkInNewTab(this.healthCheckLink);
	}

	async openHelloApiInNewTab() {
		return await this.openLinkInNewTab(this.helloApiLink);
	}

	async openUsersApiInNewTab() {
		return await this.openLinkInNewTab(this.usersApiLink);
	}

	private async openLinkInNewTab(link: Locator): Promise<Page> {
		const pagePromise = this.page.context().waitForEvent('page');
		await link.click();
		const newPage = await pagePromise;
		await newPage.waitForLoadState();
		return newPage;
	}

	// Assertions
	async expectPageToBeVisible() {
		await expect(this.heading).toBeVisible();
		await expect(this.description).toBeVisible();
	}

	async expectHealthStatusToBeVisible() {
		await expect(this.healthStatusSection).toBeVisible({ timeout: 10000 });
	}

	async expectHelloApiResponseToBeLoaded() {
		await expect(this.helloApiSection).toBeVisible();
		await expect(this.page.getByText(/Loading\.\.\./i)).not.toBeVisible({ timeout: 10000 });
	}

	async expectUserManagementSectionToBeVisible() {
		await expect(this.userManagementSection).toBeVisible();
		await expect(this.page.getByRole('heading', { name: /Add New User/i })).toBeVisible();
	}

	async expectNavigationLinksToBeVisible() {
		await expect(this.diExamplesLink).toBeVisible();
		await expect(this.diExamplesLink).toHaveAttribute('href', '/di-example');

		await expect(this.healthCheckLink).toBeVisible();
		await expect(this.healthCheckLink).toHaveAttribute('href', '/api/health');

		await expect(this.helloApiLink).toBeVisible();
		await expect(this.helloApiLink).toHaveAttribute('href', '/api/hello');

		await expect(this.usersApiLink).toBeVisible();
		await expect(this.usersApiLink).toHaveAttribute('href', '/api/users');
	}

	async expectUserToBeVisible(name: string, email: string) {
		await expect(this.page.getByText(name)).toBeVisible({ timeout: 10000 });
		await expect(this.page.getByText(email)).toBeVisible();
	}

	async expectUserNotToBeVisible(name: string) {
		await expect(this.page.getByText(name)).not.toBeVisible({ timeout: 10000 });
	}

	async expectEmptyState() {
		await expect(this.emptyStateMessage).toBeVisible();
	}

	async expectFormToBeEmpty() {
		await expect(this.nameInput).toHaveValue('');
		await expect(this.emailInput).toHaveValue('');
	}

	async expectUserCount(count: number) {
		await expect(this.usersHeading).toHaveText(`Users (${count})`);
	}
}
