import { expect, type APIRequestContext } from '@playwright/test';

export interface User {
	id: number;
	name: string;
	email: string;
	createdAt: string;
}

export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
	timestamp: string;
}

export class ApiHelpers {
	constructor(private request: APIRequestContext) {}

	// Health Check API
	async getHealth() {
		const response = await this.request.get('/api/health');
		expect(response.ok()).toBeTruthy();
		return response.json();
	}

	async expectHealthStatusOk() {
		const response = await this.request.get('/api/health');
		expect(response.status()).toBe(200);
		const data = await response.json();
		expect(data).toHaveProperty('status', 'ok');
		expect(data).toHaveProperty('timestamp');
		return data;
	}

	// Hello API
	async getHello() {
		const response = await this.request.get('/api/hello');
		expect(response.ok()).toBeTruthy();
		return response.json();
	}

	// Users API
	async getAllUsers(): Promise<User[]> {
		const response = await this.request.get('/api/users');
		expect(response.ok()).toBeTruthy();
		return response.json();
	}

	async getUserById(id: number): Promise<User> {
		const response = await this.request.get(`/api/users/${id}`);
		expect(response.ok()).toBeTruthy();
		return response.json();
	}

	async createUser(name: string, email: string): Promise<User> {
		const response = await this.request.post('/api/users', {
			data: { name, email }
		});
		expect(response.ok()).toBeTruthy();
		const user = await response.json();
		expect(user).toHaveProperty('id');
		expect(user).toHaveProperty('name', name);
		expect(user).toHaveProperty('email', email);
		expect(user).toHaveProperty('createdAt');
		return user;
	}

	async deleteUser(id: number) {
		const response = await this.request.delete(`/api/users/${id}`);
		expect(response.ok()).toBeTruthy();
		return response.json();
	}

	async deleteAllUsers() {
		const users = await this.getAllUsers();
		for (const user of users) {
			await this.deleteUser(user.id);
		}
	}

	// Utility methods with assertions
	async expectUserExists(id: number) {
		const response = await this.request.get(`/api/users/${id}`);
		expect(response.status()).toBe(200);
		const user = await response.json();
		expect(user.id).toBe(id);
		return user;
	}

	async expectUserNotFound(id: number) {
		const response = await this.request.get(`/api/users/${id}`);
		expect(response.status()).toBe(404);
	}

	async expectValidationError(name: string, email: string) {
		const response = await this.request.post('/api/users', {
			data: { name, email }
		});
		expect(response.status()).toBeGreaterThanOrEqual(400);
		expect(response.status()).toBeLessThan(500);
	}

	async expectJsonResponse(endpoint: string) {
		const response = await this.request.get(endpoint);
		const contentType = response.headers()['content-type'];
		expect(contentType).toContain('application/json');
	}

	// Test data generators
	generateTestUser(suffix = '') {
		const timestamp = Date.now();
		return {
			name: `Test User ${suffix}${timestamp}`,
			email: `test${suffix}${timestamp}@example.com`
		};
	}

	generateMultipleTestUsers(count: number) {
		return Array.from({ length: count }, (_, i) => this.generateTestUser(`_${i}_`));
	}

	// Cleanup helper
	async cleanupTestUsers(emailPattern: RegExp = /test.*@example\.com/) {
		const users = await this.getAllUsers();
		const testUsers = users.filter((user) => emailPattern.test(user.email));
		for (const user of testUsers) {
			try {
				await this.deleteUser(user.id);
			} catch {
				// Ignore errors during cleanup
			}
		}
	}
}

// Export standalone helper functions
export async function createTestUser(
	request: APIRequestContext,
	name?: string,
	email?: string
): Promise<User> {
	const timestamp = Date.now();
	const userData = {
		name: name || `Test User ${timestamp}`,
		email: email || `test${timestamp}@example.com`
	};

	const response = await request.post('/api/users', { data: userData });
	expect(response.ok()).toBeTruthy();
	return response.json();
}

export async function deleteTestUser(request: APIRequestContext, id: number): Promise<void> {
	await request.delete(`/api/users/${id}`);
}

export async function expectApiSuccess(response: Response) {
	expect(response.ok).toBeTruthy();
	const data = await response.json();
	expect(data).toBeDefined();
	return data;
}

export async function expectApiError(response: Response, status: number) {
	expect(response.status).toBe(status);
	const data = await response.json();
	expect(data).toHaveProperty('error');
	return data;
}
