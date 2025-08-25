import { describe, it, expect } from 'vitest';
import {
	ValidationError,
	NotFoundError,
	BadRequestError,
	UnauthorizedError,
	ForbiddenError,
	ConflictError,
	InternalServerError,
	errorNames
} from '../../models/error.model';

/**
 * These tests ensure that each custom error sets its name properly
 * and that the errorNames mapping returns the expected HTTP status codes.
 */

describe('error.model', () => {
	it('should construct ValidationError with correct name', () => {
		const err = new ValidationError('validation failed');
		expect(err).toBeInstanceOf(Error);
		expect(err.name).toBe('ValidationError');
		expect(err.message).toBe('validation failed');
	});

	it('should construct NotFoundError with correct name', () => {
		const err = new NotFoundError('missing resource');
		expect(err).toBeInstanceOf(Error);
		expect(err.name).toBe('NotFoundError');
		expect(err.message).toBe('missing resource');
	});

	it('should construct BadRequestError with correct name', () => {
		const err = new BadRequestError('bad input');
		expect(err).toBeInstanceOf(Error);
		expect(err.name).toBe('BadRequestError');
		expect(err.message).toBe('bad input');
	});

	it('should construct UnauthorizedError with correct name', () => {
		const err = new UnauthorizedError('no auth');
		expect(err).toBeInstanceOf(Error);
		expect(err.name).toBe('UnauthorizedError');
		expect(err.message).toBe('no auth');
	});

	it('should construct ForbiddenError with correct name', () => {
		const err = new ForbiddenError('forbidden');
		expect(err).toBeInstanceOf(Error);
		expect(err.name).toBe('ForbiddenError');
		expect(err.message).toBe('forbidden');
	});

	it('should construct ConflictError with correct name', () => {
		const err = new ConflictError('conflict');
		expect(err).toBeInstanceOf(Error);
		expect(err.name).toBe('ConflictError');
		expect(err.message).toBe('conflict');
	});

	it('should construct InternalServerError with correct name', () => {
		const err = new InternalServerError('boom');
		expect(err).toBeInstanceOf(Error);
		expect(err.name).toBe('InternalServerError');
		expect(err.message).toBe('boom');
	});

	it('should map error names to proper http status codes', () => {
		expect(errorNames.ValidationError).toBe(400);
		expect(errorNames.NotFoundError).toBe(404);
		expect(errorNames.BadRequestError).toBe(400);
		expect(errorNames.UnauthorizedError).toBe(401);
		expect(errorNames.ForbiddenError).toBe(403);
		expect(errorNames.ConflictError).toBe(409);
		expect(errorNames.InternalServerError).toBe(500);
	});
});
