/**
 * Custom error classes for consistent error handling across the API
 */

import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class ValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ValidationError';
	}
}

export class NotFoundError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'NotFoundError';
	}
}

export class BadRequestError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'BadRequestError';
	}
}

export class UnauthorizedError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'UnauthorizedError';
	}
}

export class ForbiddenError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ForbiddenError';
	}
}

export class ConflictError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ConflictError';
	}
}

export class InternalServerError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'InternalServerError';
	}
}

export const errorNames: Record<string, ContentfulStatusCode> = {
	[ValidationError.name]: 400,
	[NotFoundError.name]: 404,
	[BadRequestError.name]: 400,
	[UnauthorizedError.name]: 401,
	[ForbiddenError.name]: 403,
	[ConflictError.name]: 409,
	[InternalServerError.name]: 500
};
