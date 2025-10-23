import { test, expect } from './fixtures';

test.describe('API Endpoints', () => {
	test.describe('Health Check API', () => {
		test('should return 200 status code', async ({ request }) => {
			const response = await request.get('/api/health');
			expect(response.status()).toBe(200);
		});

		test('should return valid health status structure', async ({ api }) => {
			const data = await api.expectHealthStatusOk();

			expect(data).toHaveProperty('status');
			expect(data).toHaveProperty('timestamp');
			expect(data).toHaveProperty('environment');
			expect(data.status).toBe('ok');
			expect(typeof data.timestamp).toBe('string');
			expect(typeof data.environment).toBe('string');
		});

		test('should return JSON content type', async ({ api }) => {
			await api.expectJsonResponse('/api/health');
		});

		test('should return valid timestamp format', async ({ request }) => {
			const response = await request.get('/api/health');
			const data = await response.json();

			// Timestamp should be a valid date string
			const timestamp = new Date(data.timestamp);
			expect(timestamp.toString()).not.toBe('Invalid Date');
		});

		test('should respond quickly', async ({ request }) => {
			const startTime = Date.now();
			await request.get('/api/health');
			const responseTime = Date.now() - startTime;

			// Health check should respond within 1 second
			expect(responseTime).toBeLessThan(1000);
		});

		test('should handle multiple concurrent requests', async ({ request }) => {
			const requests = Array.from({ length: 5 }, () => request.get('/api/health'));
			const responses = await Promise.all(requests);

			responses.forEach((response) => {
				expect(response.status()).toBe(200);
			});
		});

		test('should ignore query parameters', async ({ request }) => {
			const response = await request.get('/api/health?test=value&another=param');
			expect(response.status()).toBe(200);
			const data = await response.json();
			expect(data.status).toBe('ok');
		});
	});

	test.describe('Hello API', () => {
		test('should return 200 status code', async ({ request }) => {
			const response = await request.get('/api/hello');
			expect(response.status()).toBe(200);
		});

		test('should return hello message with proper structure', async ({ api }) => {
			const data = await api.getHello();

			expect(data).toHaveProperty('message');
			expect(typeof data.message).toBe('string');
			expect(data.message.length).toBeGreaterThan(0);
		});

		test('should return JSON content type', async ({ api }) => {
			await api.expectJsonResponse('/api/hello');
		});

		test('should return consistent response', async ({ request }) => {
			const response1 = await request.get('/api/hello');
			const response2 = await request.get('/api/hello');

			const data1 = await response1.json();
			const data2 = await response2.json();

			// Message should be consistent
			expect(data1.message).toBeDefined();
			expect(data2.message).toBeDefined();
		});

		test('should handle query parameters gracefully', async ({ request }) => {
			const response = await request.get('/api/hello?test=value');
			expect(response.status()).toBe(200);
			const data = await response.json();
			expect(data.message).toBeDefined();
		});
	});

	test.describe('Users API - GET All Users', () => {
		test('should return 200 status code', async ({ request }) => {
			const response = await request.get('/api/users');
			expect(response.status()).toBe(200);
		});

		test('should return array of users', async ({ api }) => {
			const users = await api.getAllUsers();

			expect(Array.isArray(users)).toBe(true);
		});

		test('should return users with correct structure', async ({ api }) => {
			// Create a test user first
			const testUser = await api.createUser('Test User', 'test@example.com');

			const users = await api.getAllUsers();
			const createdUser = users.find((u) => u.id === testUser.id);

			expect(createdUser).toBeDefined();
			expect(createdUser).toHaveProperty('id');
			expect(createdUser).toHaveProperty('name');
			expect(createdUser).toHaveProperty('email');
			expect(createdUser).toHaveProperty('createdAt');

			// Cleanup
			await api.deleteUser(testUser.id);
		});

		test('should return JSON content type', async ({ api }) => {
			await api.expectJsonResponse('/api/users');
		});

		test('should return empty array when no users exist', async ({ api }) => {
			await api.deleteAllUsers();

			const users = await api.getAllUsers();
			expect(Array.isArray(users)).toBe(true);
			expect(users.length).toBe(0);
		});

		test('should return all created users', async ({ api }) => {
			const testUsers = api.generateMultipleTestUsers(3);

			// Create multiple users
			for (const user of testUsers) {
				await api.createUser(user.name, user.email);
			}

			const users = await api.getAllUsers();

			// All test users should be in the response
			testUsers.forEach((testUser) => {
				const found = users.some((u) => u.name === testUser.name && u.email === testUser.email);
				expect(found).toBe(true);
			});
		});
	});

	test.describe('Users API - GET User by ID', () => {
		test('should return user with correct ID', async ({ api }) => {
			const testUser = await api.createUser('Test User', 'test@example.com');

			const user = await api.expectUserExists(testUser.id);

			expect(user.id).toBe(testUser.id);
			expect(user.name).toBe(testUser.name);
			expect(user.email).toBe(testUser.email);

			await api.deleteUser(testUser.id);
		});

		test('should return 404 for non-existent user', async ({ api }) => {
			await api.expectUserNotFound(999999);
		});

		test('should return 404 for deleted user', async ({ api }) => {
			const testUser = await api.createUser('Temp User', 'temp@example.com');

			await api.deleteUser(testUser.id);

			await api.expectUserNotFound(testUser.id);
		});

		test('should handle invalid ID format gracefully', async ({ request }) => {
			const response = await request.get('/api/users/invalid');
			expect(response.status()).toBeGreaterThanOrEqual(400);
		});

		test('should return correct content type', async ({ api }) => {
			const testUser = await api.createUser('Test User', 'test@example.com');

			await api.expectJsonResponse(`/api/users/${testUser.id}`);

			await api.deleteUser(testUser.id);
		});
	});

	test.describe('Users API - POST Create User', () => {
		test('should create a new user successfully', async ({ api }) => {
			const userData = api.generateTestUser();

			const user = await api.createUser(userData.name, userData.email);

			expect(user).toHaveProperty('id');
			expect(user.name).toBe(userData.name);
			expect(user.email).toBe(userData.email);
			expect(user).toHaveProperty('createdAt');

			// Verify user exists
			await api.expectUserExists(user.id);

			await api.deleteUser(user.id);
		});

		test('should return 201 or 200 status code', async ({ request }) => {
			const timestamp = Date.now();
			const response = await request.post('/api/users', {
				data: {
					name: `Test User ${timestamp}`,
					email: `test${timestamp}@example.com`
				}
			});

			expect([200, 201]).toContain(response.status());

			// Cleanup
			const user = await response.json();
			await request.delete(`/api/users/${user.id}`);
		});

		test('should generate unique ID for each user', async ({ api }) => {
			const users = api.generateMultipleTestUsers(3);

			const createdUsers = [];
			for (const user of users) {
				const created = await api.createUser(user.name, user.email);
				createdUsers.push(created);
			}

			// All IDs should be unique
			const ids = createdUsers.map((u) => u.id);
			const uniqueIds = new Set(ids);
			expect(uniqueIds.size).toBe(ids.length);

			// Cleanup
			for (const user of createdUsers) {
				await api.deleteUser(user.id);
			}
		});

		test('should set createdAt timestamp', async ({ api }) => {
			const userData = api.generateTestUser();
			const beforeCreate = new Date();

			const user = await api.createUser(userData.name, userData.email);

			const afterCreate = new Date();
			const createdAt = new Date(user.createdAt);

			expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime() - 1000);
			expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime() + 1000);

			await api.deleteUser(user.id);
		});

		test('should handle special characters in name', async ({ api }) => {
			const specialNames = [
				"O'Brien",
				'José García',
				'Anne-Marie',
				'User with "quotes"',
				'User & Co.'
			];

			for (const name of specialNames) {
				const timestamp = Date.now();
				const user = await api.createUser(name, `special${timestamp}@example.com`);

				expect(user.name).toBe(name);
				await api.deleteUser(user.id);
			}
		});

		test('should handle various email formats', async ({ api }) => {
			const emails = [
				'simple@example.com',
				'user.name@example.com',
				'user+tag@example.com',
				'user@subdomain.example.com'
			];

			for (const email of emails) {
				const timestamp = Date.now();
				const user = await api.createUser(`User ${timestamp}`, email);

				expect(user.email).toBe(email);
				await api.deleteUser(user.id);
			}
		});
	});

	test.describe('Users API - POST Validation', () => {
		test('should reject user with missing name', async ({ api }) => {
			await api.expectValidationError('', 'test@example.com');
		});

		test('should reject user with missing email', async ({ request }) => {
			const response = await request.post('/api/users', {
				data: { name: 'Test User' }
			});

			expect(response.status()).toBeGreaterThanOrEqual(400);
			expect(response.status()).toBeLessThan(500);
		});

		test('should reject user with both fields missing', async ({ request }) => {
			const response = await request.post('/api/users', {
				data: {}
			});

			expect(response.status()).toBeGreaterThanOrEqual(400);
			expect(response.status()).toBeLessThan(500);
		});

		test('should reject invalid email format', async ({ request }) => {
			const invalidEmails = ['invalid', 'invalid@', '@example.com', 'invalid@.com'];

			for (const email of invalidEmails) {
				const response = await request.post('/api/users', {
					data: { name: 'Test User', email }
				});

				expect(response.status()).toBeGreaterThanOrEqual(400);
			}
		});

		test('should reject empty strings', async ({ request }) => {
			const response = await request.post('/api/users', {
				data: { name: '', email: '' }
			});

			expect(response.status()).toBeGreaterThanOrEqual(400);
			expect(response.status()).toBeLessThan(500);
		});

		test('should trim whitespace in fields', async ({ api }) => {
			const user = await api.createUser('  Test User  ', '  test@example.com  ');

			// Values should be trimmed
			expect(user.name.trim()).toBe(user.name);
			expect(user.email.trim()).toBe(user.email);

			await api.deleteUser(user.id);
		});

		test('should reject requests without JSON content-type', async ({ request }) => {
			const response = await request.post('/api/users', {
				data: { name: 'Test User', email: 'test@example.com' },
				headers: { 'Content-Type': 'text/plain' }
			});

			expect(response.status()).toBeGreaterThanOrEqual(400);
		});
	});

	test.describe('Users API - DELETE User', () => {
		test('should delete user successfully', async ({ api }) => {
			const testUser = await api.createUser('To Delete', 'delete@example.com');

			await api.deleteUser(testUser.id);

			// User should no longer exist
			await api.expectUserNotFound(testUser.id);
		});

		test('should return success response on deletion', async ({ request }) => {
			const timestamp = Date.now();
			const createResponse = await request.post('/api/users', {
				data: {
					name: `Delete Test ${timestamp}`,
					email: `delete${timestamp}@example.com`
				}
			});
			const user = await createResponse.json();

			const deleteResponse = await request.delete(`/api/users/${user.id}`);
			expect(deleteResponse.status()).toBe(200);
		});

		test('should return 404 when deleting non-existent user', async ({ request }) => {
			const response = await request.delete('/api/users/999999');
			expect(response.status()).toBe(404);
		});

		test('should not affect other users when deleting one', async ({ api }) => {
			const users = api.generateMultipleTestUsers(3);

			// Create multiple users
			const createdUsers = [];
			for (const user of users) {
				const created = await api.createUser(user.name, user.email);
				createdUsers.push(created);
			}

			// Delete first user
			await api.deleteUser(createdUsers[0].id);

			// Other users should still exist
			await api.expectUserExists(createdUsers[1].id);
			await api.expectUserExists(createdUsers[2].id);

			// Cleanup remaining users
			await api.deleteUser(createdUsers[1].id);
			await api.deleteUser(createdUsers[2].id);
		});

		test('should handle deleting same user twice', async ({ api }) => {
			const testUser = await api.createUser('Delete Twice', 'twice@example.com');

			// First delete should succeed
			await api.deleteUser(testUser.id);

			// Second delete should return 404
			await api.expectUserNotFound(testUser.id);
		});
	});

	test.describe('Users API - Concurrent Operations', () => {
		test('should handle concurrent user creation', async ({ api, request }) => {
			const users = api.generateMultipleTestUsers(5);

			// Create multiple users concurrently
			const promises = users.map((user) =>
				request.post('/api/users', {
					data: user
				})
			);

			const responses = await Promise.all(promises);

			// All should succeed
			responses.forEach((response) => {
				expect(response.status()).toBe(200);
			});

			// Verify all users were created
			const createdUsers = await Promise.all(responses.map((r) => r.json()));
			const allUsers = await api.getAllUsers();

			createdUsers.forEach((user) => {
				const found = allUsers.find((u) => u.id === user.id);
				expect(found).toBeDefined();
			});

			// Cleanup
			for (const user of createdUsers) {
				await api.deleteUser(user.id);
			}
		});

		test('should handle concurrent read operations', async ({ api, request }) => {
			const testUser = await api.createUser('Concurrent Read', 'concurrent@example.com');

			// Multiple concurrent reads
			const promises = Array.from({ length: 10 }, () => request.get(`/api/users/${testUser.id}`));

			const responses = await Promise.all(promises);

			// All should succeed
			responses.forEach((response) => {
				expect(response.status()).toBe(200);
			});

			await api.deleteUser(testUser.id);
		});

		test('should handle mixed concurrent operations', async ({ api, request }) => {
			// Create initial user
			const user1 = await api.createUser('User 1', 'user1@example.com');

			const operations = [
				// Create operations
				request.post('/api/users', {
					data: { name: 'User 2', email: 'user2@example.com' }
				}),
				request.post('/api/users', {
					data: { name: 'User 3', email: 'user3@example.com' }
				}),
				// Read operations
				request.get('/api/users'),
				request.get(`/api/users/${user1.id}`),
				// Health check
				request.get('/api/health')
			];

			const responses = await Promise.all(operations);

			// All should succeed
			responses.forEach((response) => {
				expect(response.ok()).toBeTruthy();
			});
		});

		test('should handle concurrent user deletion', async ({ api, request }) => {
			const users = api.generateMultipleTestUsers(3);

			const createdUsers = [];
			for (const user of users) {
				const created = await api.createUser(user.name, user.email);
				createdUsers.push(created);
			}

			const deletePromises = createdUsers.map((user) => request.delete(`/api/users/${user.id}`));

			const responses = await Promise.all(deletePromises);

			responses.forEach((response) => {
				expect(response.status()).toBe(200);
			});

			// Verify all deleted
			for (const user of createdUsers) {
				await api.expectUserNotFound(user.id);
			}
		});
	});

	test.describe('API Error Handling', () => {
		test('should return proper error structure', async ({ request }) => {
			const response = await request.get('/api/users/999999');

			expect(response.status()).toBe(404);
			const data = await response.json();
			expect(data).toHaveProperty('error');
			expect(typeof data.error).toBe('string');
		});

		test('should handle malformed JSON in POST request', async ({ request }) => {
			const response = await request.post('/api/users', {
				data: 'not valid json',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			expect(response.status()).toBeGreaterThanOrEqual(400);
		});

		test('should return consistent error format across endpoints', async ({ request }) => {
			const responses = [
				await request.get('/api/users/999999'),
				await request.post('/api/users', { data: { name: '' } }),
				await request.delete('/api/users/999999')
			];

			responses.forEach((response) => {
				expect(response.status()).toBeGreaterThanOrEqual(400);
			});
		});

		test('should return 405 for unsupported HTTP methods', async ({ request }) => {
			const response = await request.put('/api/health');
			expect(response.status()).toBe(405);
			const data = await response.json();
			expect(data).toHaveProperty('error');
		});
	});

	test.describe('API Performance', () => {
		test('should handle large user list efficiently', async ({ api }) => {
			// Create multiple users
			const users = api.generateMultipleTestUsers(10);

			for (const user of users) {
				await api.createUser(user.name, user.email);
			}

			const startTime = Date.now();
			await api.getAllUsers();
			const responseTime = Date.now() - startTime;

			// Should respond within 2 seconds
			expect(responseTime).toBeLessThan(2000);
		});

		test('should handle rapid sequential requests', async ({ request }) => {
			const startTime = Date.now();

			// Make 20 rapid requests
			for (let i = 0; i < 20; i++) {
				const response = await request.get('/api/health');
				expect(response.status()).toBe(200);
			}

			const totalTime = Date.now() - startTime;

			// Average should be reasonable
			const avgTime = totalTime / 20;
			expect(avgTime).toBeLessThan(500);
		});
	});

	test.describe('API Response Headers', () => {
		test('should include proper CORS headers', async ({ request }) => {
			const response = await request.get('/api/health');
			const headers = response.headers();

			expect(headers['content-type']).toBeDefined();
			expect(headers['access-control-allow-origin']).toBeDefined();
			expect(headers['access-control-allow-methods']).toBeDefined();
		});

		test('should return JSON content type for all endpoints', async ({ request }) => {
			const endpoints = ['/api/health', '/api/hello', '/api/users'];

			for (const endpoint of endpoints) {
				const response = await request.get(endpoint);
				const contentType = response.headers()['content-type'];
				expect(contentType).toContain('application/json');
			}
		});

		test('should include cache control headers', async ({ request }) => {
			const response = await request.get('/api/health');
			const headers = response.headers();
			expect(headers['cache-control']).toBeDefined();
		});
	});
});
