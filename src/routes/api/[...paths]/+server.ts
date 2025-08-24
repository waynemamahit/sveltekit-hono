import type { ServerEnv } from '$lib/env';
import type { RequestHandler } from '@sveltejs/kit';
import type { Next } from 'hono';
import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import 'reflect-metadata';
import { container } from '../../../container/inversify.config';
import { getLogger, getUserService } from '../../../container/resolvers';
import type { HealthStatus } from '../../../types/health';

interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	message?: string;
	error?: string;
	timestamp: string;
}

function createErrorResponse(error: string): ApiResponse {
	return {
		success: false,
		error,
		timestamp: new Date().toISOString()
	};
}

function handleError(c: Context, error: unknown, operation: string): Response {
	const logger = getLogger(c);
	const errorMessage = error instanceof Error ? error.message : 'Unknown error';

	// Handle validation errors
	if (errorMessage.includes('Validation failed')) {
		logger.warn(`${operation} failed - validation error`, {
			error: errorMessage
		});
		return c.json(createErrorResponse(errorMessage), 400);
	}

	// Handle general errors
	logger.error(`Error in ${operation}`, error instanceof Error ? error : new Error(String(error)));
	return c.json(createErrorResponse('Internal server error'), 500);
}

function parseIntParam(param: string): number | null {
	const parsed = parseInt(param);
	return isNaN(parsed) ? null : parsed;
}

const app = new Hono<{ Bindings: ServerEnv }>().basePath('/api');

// Middleware
app.use('*', logger());
app.use(
	'*',
	cors({
		origin: '*',
		allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization']
	})
);

// Add DI middleware
app.use('*', async (c: Context, next: Next) => {
	c.set('container', container);
	await next();
});

// Health check endpoint
app.get('/health', (c): Response => {
	const response: HealthStatus = {
		status: 'ok',
		timestamp: new Date().toISOString(),
		environment: c.env?.ENVIRONMENT || 'development'
	};
	return c.json(response);
});

// Hello endpoint
app.get('/hello', (c): Response => {
	const response = {
		message: 'Hello from Hono!',
		method: c.req.method,
		path: c.req.path,
		timestamp: new Date().toISOString()
	};
	return c.json(response);
});

// User CRUD endpoints with Dependency Injection
app.get('/users', async (c): Promise<Response> => {
	try {
		const userService = getUserService(c);
		const logger = getLogger(c);

		logger.info('GET /users endpoint called');
		const users = await userService.getAllUsers();

		return c.json({
			success: true,
			data: users,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		return handleError(c, error, 'fetching users');
	}
});

app.get('/users/:id', async (c): Promise<Response> => {
	try {
		const id = parseIntParam(c.req.param('id'));
		const userService = getUserService(c);
		const logger = getLogger(c);

		if (id === null) {
			return c.json(createErrorResponse('Invalid user ID'), 400);
		}

		logger.info('GET /users/:id endpoint called', { userId: id });
		const user = await userService.getUserById(id);

		if (!user) {
			return c.json(createErrorResponse('User not found'), 404);
		}

		return c.json({
			success: true,
			data: user,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		return handleError(c, error, 'fetching user');
	}
});

app.post('/users', async (c): Promise<Response> => {
	try {
		const body = await c.req.json();
		const userService = getUserService(c);
		const logger = getLogger(c);

		logger.info('POST /users endpoint called', { userData: body });
		const newUser = await userService.createUser(body);

		return c.json(
			{
				success: true,
				data: newUser,
				message: 'User created successfully',
				timestamp: new Date().toISOString()
			},
			201
		);
	} catch (error) {
		return handleError(c, error, 'creating user');
	}
});

app.put('/users/:id', async (c): Promise<Response> => {
	try {
		const id = parseIntParam(c.req.param('id'));
		const body = await c.req.json();
		const userService = getUserService(c);
		const logger = getLogger(c);

		if (id === null) {
			return c.json(createErrorResponse('Invalid user ID'), 400);
		}

		logger.info('PUT /users/:id endpoint called', { userId: id, updateData: body });
		const updatedUser = await userService.updateUser(id, body);

		if (!updatedUser) {
			return c.json(createErrorResponse('User not found'), 404);
		}

		return c.json({
			success: true,
			data: updatedUser,
			message: `User ${id} updated successfully`,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		return handleError(c, error, 'updating user');
	}
});

app.delete('/users/:id', async (c): Promise<Response> => {
	try {
		const id = parseIntParam(c.req.param('id'));
		const userService = getUserService(c);
		const logger = getLogger(c);

		if (id === null) {
			return c.json(createErrorResponse('Invalid user ID'), 400);
		}

		logger.info('DELETE /users/:id endpoint called', { userId: id });
		const deleted = await userService.deleteUser(id);

		if (!deleted) {
			return c.json(createErrorResponse('User not found'), 404);
		}

		return c.json({
			success: true,
			message: `User ${id} deleted successfully`,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		return handleError(c, error, 'deleting user');
	}
});

// Catch-all for testing dynamic routes
app.get('/*', (c): Response => {
	const path = c.req.path;
	return c.json({
		message: `You reached: ${path}`,
		method: c.req.method,
		params: c.req.param(),
		query: c.req.query(),
		timestamp: new Date().toISOString()
	});
});

// Export all HTTP methods
export const GET: RequestHandler = ({ request }) => app.fetch(request);
export const POST: RequestHandler = ({ request }) => app.fetch(request);
export const PUT: RequestHandler = ({ request }) => app.fetch(request);
export const PATCH: RequestHandler = ({ request }) => app.fetch(request);
export const DELETE: RequestHandler = ({ request }) => app.fetch(request);
export const OPTIONS: RequestHandler = ({ request }) => app.fetch(request);
