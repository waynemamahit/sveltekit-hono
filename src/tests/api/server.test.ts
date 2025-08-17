import type { RequestEvent } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { DELETE, GET, POST, PUT } from '../../routes/api/[...paths]/+server';

describe('Hono API Routes', () => {
	describe('GET /api/health', () => {
		it('should return health status', async () => {
			const request = new Request('http://localhost/api/health');
			const response = await GET({ request } as RequestEvent);

			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data).toHaveProperty('status', 'ok');
			expect(data).toHaveProperty('timestamp');
			expect(data).toHaveProperty('environment');
		});
	});

	describe('GET /api/hello', () => {
		it('should return hello message', async () => {
			const request = new Request('http://localhost/api/hello');
			const response = await GET({ request } as RequestEvent);

			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data).toHaveProperty('message', 'Hello from Hono!');
			expect(data).toHaveProperty('method', 'GET');
			expect(data).toHaveProperty('path', '/api/hello');
			expect(data).toHaveProperty('timestamp');
		});
	});

	describe('GET /api/users', () => {
		it('should return users list', async () => {
			const request = new Request('http://localhost/api/users');
			const response = await GET({ request } as RequestEvent);

			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data).toHaveProperty('users');
			expect(Array.isArray(data.users)).toBe(true);
			expect(data.users).toHaveLength(2);
			expect(data.users[0]).toHaveProperty('id', 1);
			expect(data.users[0]).toHaveProperty('name', 'John Doe');
		});
	});

	describe('POST /api/users', () => {
		it('should create a new user', async () => {
			const userData = {
				name: 'Test User',
				email: 'test@example.com'
			};

			const request = new Request('http://localhost/api/users', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(userData)
			});

			const response = await POST({ request } as RequestEvent);

			expect(response.status).toBe(201);

			const data = await response.json();
			expect(data).toHaveProperty('message', 'User created successfully');
			expect(data).toHaveProperty('user');
			expect(data.user).toHaveProperty('name', userData.name);
			expect(data.user).toHaveProperty('email', userData.email);
			expect(data.user).toHaveProperty('id');
		});
	});

	describe('PUT /api/users/:id', () => {
		it('should update user by id', async () => {
			const userId = '123';
			const updateData = {
				name: 'Updated User',
				email: 'updated@example.com'
			};

			const request = new Request(`http://localhost/api/users/${userId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updateData)
			});

			const response = await PUT({ request } as RequestEvent);

			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data).toHaveProperty('message', `User ${userId} updated successfully`);
			expect(data).toHaveProperty('user');
			expect(data.user).toHaveProperty('id', parseInt(userId));
			expect(data.user).toHaveProperty('name', updateData.name);
		});
	});

	describe('DELETE /api/users/:id', () => {
		it('should delete user by id', async () => {
			const userId = '123';
			const request = new Request(`http://localhost/api/users/${userId}`, {
				method: 'DELETE'
			});

			const response = await DELETE({ request } as RequestEvent);

			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data).toHaveProperty('message', `User ${userId} deleted successfully`);
			expect(data).toHaveProperty('timestamp');
		});
	});

	describe('GET /api/custom-path', () => {
		it('should handle dynamic routes', async () => {
			const customPath = '/api/custom-path';
			const request = new Request(`http://localhost${customPath}?param=value`);
			const response = await GET({ request } as RequestEvent);

			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data).toHaveProperty('message', `You reached: ${customPath}`);
			expect(data).toHaveProperty('method', 'GET');
			expect(data).toHaveProperty('query');
		});
	});
});
