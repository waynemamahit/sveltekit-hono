import type { ServerEnv } from '$lib/env';
import type { RequestHandler } from '@sveltejs/kit';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

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

// Health check endpoint
app.get('/health', (c) => {
	return c.json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		environment: c.env?.ENVIRONMENT || 'development'
	});
});

// Hello endpoint
app.get('/hello', (c) => {
	return c.json({
		message: 'Hello from Hono!',
		method: c.req.method,
		path: c.req.path,
		timestamp: new Date().toISOString()
	});
});

// Example CRUD endpoints
app.get('/users', (c) => {
	// In a real app, this would fetch from a database
	return c.json({
		users: [
			{ id: 1, name: 'John Doe', email: 'john@example.com' },
			{ id: 2, name: 'Jane Smith', email: 'jane@example.com' }
		]
	});
});

app.post('/users', async (c) => {
	const body = await c.req.json();
	// In a real app, this would save to a database
	return c.json(
		{
			message: 'User created successfully',
			user: { id: Date.now(), ...body },
			timestamp: new Date().toISOString()
		},
		201
	);
});

app.put('/users/:id', async (c) => {
	const id = c.req.param('id');
	const body = await c.req.json();
	// In a real app, this would update in a database
	return c.json({
		message: `User ${id} updated successfully`,
		user: { id: parseInt(id), ...body },
		timestamp: new Date().toISOString()
	});
});

app.delete('/users/:id', (c) => {
	const id = c.req.param('id');
	// In a real app, this would delete from a database
	return c.json({
		message: `User ${id} deleted successfully`,
		timestamp: new Date().toISOString()
	});
});

// Catch-all for testing dynamic routes
app.get('/*', (c) => {
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
