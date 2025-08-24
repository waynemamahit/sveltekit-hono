import type { ServerEnv } from '$lib/env';
import type { RequestHandler } from '@sveltejs/kit';
import type { Next } from 'hono';
import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import 'reflect-metadata';
import { container } from '../../../container/inversify.config';
import { getLogger, getUserService } from '../../../container/resolvers';
import { BadRequestError, errorNames, NotFoundError, ValidationError } from '../../../types/errors';
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

// Global error handler middleware
app.onError(async (error, c) => {
	const logger = getLogger(c);
	const errorMessage = error instanceof Error ? error.message : 'Unknown error';

	// Handle known custom errors - check instanceof first, then fallback to name
	if (error instanceof NotFoundError) {
		logger.warn(`NotFoundError: ${errorMessage}`, { errorMessage });
		return c.json(createErrorResponse(errorMessage), 404);
	}

	if (error instanceof BadRequestError) {
		logger.warn(`BadRequestError: ${errorMessage}`, { errorMessage });
		return c.json(createErrorResponse(errorMessage), 400);
	}

	if (error instanceof ValidationError) {
		logger.warn(`ValidationError: ${errorMessage}`, { errorMessage });
		return c.json(createErrorResponse(errorMessage), 400);
	}

	// Fallback to errorNames mapping
	if (error instanceof Error && error.name && errorNames[error.name]) {
		const statusCode = errorNames[error.name];
		logger.info(`Handling custom error via errorNames: ${error.name} with status ${statusCode}`, {
			errorMessage
		});

		if (statusCode >= 500) {
			logger.error(`${error.name}: ${errorMessage}`, error);
		} else {
			logger.warn(`${error.name}: ${errorMessage}`, { errorMessage });
		}

		return c.json(createErrorResponse(errorMessage), statusCode);
	}

	// Handle validation errors from services (legacy support)
	if (errorMessage.includes('Validation failed')) {
		logger.warn('Service validation error (legacy)', { errorMessage });
		return c.json(createErrorResponse(errorMessage), 400);
	}

	// Handle general errors
	logger.error('Unhandled error', error instanceof Error ? error : new Error(String(error)));
	return c.json(createErrorResponse('Internal server error'), 500);
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
	const userService = getUserService(c);
	const logger = getLogger(c);

	logger.info('GET /users endpoint called');
	const users = await userService.getAllUsers();

	return c.json({
		success: true,
		data: users,
		timestamp: new Date().toISOString()
	});
});

app.get('/users/:id', async (c): Promise<Response> => {
	const id = parseIntParam(c.req.param('id'));
	const userService = getUserService(c);
	const logger = getLogger(c);

	if (id === null) {
		throw new BadRequestError('Invalid user ID');
	}

	logger.info('GET /users/:id endpoint called', { userId: id });
	const user = await userService.getUserById(id);

	if (!user) {
		throw new NotFoundError('User not found');
	}

	return c.json({
		success: true,
		data: user,
		timestamp: new Date().toISOString()
	});
});

app.post('/users', async (c): Promise<Response> => {
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
});

app.put('/users/:id', async (c): Promise<Response> => {
	const id = parseIntParam(c.req.param('id'));
	const body = await c.req.json();
	const userService = getUserService(c);
	const logger = getLogger(c);

	if (id === null) {
		throw new BadRequestError('Invalid user ID');
	}

	logger.info('PUT /users/:id endpoint called', { userId: id, updateData: body });
	const updatedUser = await userService.updateUser(id, body);

	if (!updatedUser) {
		throw new NotFoundError('User not found');
	}

	return c.json({
		success: true,
		data: updatedUser,
		message: `User ${id} updated successfully`,
		timestamp: new Date().toISOString()
	});
});

app.delete('/users/:id', async (c): Promise<Response> => {
	const id = parseIntParam(c.req.param('id'));
	const userService = getUserService(c);
	const logger = getLogger(c);

	if (id === null) {
		throw new BadRequestError('Invalid user ID');
	}

	logger.info('DELETE /users/:id endpoint called', { userId: id });
	const deleted = await userService.deleteUser(id);

	if (!deleted) {
		throw new NotFoundError('User not found');
	}

	return c.json({
		success: true,
		message: `User ${id} deleted successfully`,
		timestamp: new Date().toISOString()
	});
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
