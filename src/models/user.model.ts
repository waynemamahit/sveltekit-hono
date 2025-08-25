import { z } from 'zod';

// Domain model schema (UI/tests use this lightweight shape)
export const userSchema = z.object({
	id: z.number().int().positive(),
	name: z.string(),
	email: z.string()
});

export type User = z.infer<typeof userSchema>;

// Validation schemas for create/update operations
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createUserSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, { message: 'Name is required' })
		.refine((value) => value.length === 0 || value.length >= 2, {
			message: 'Name must be at least 2 characters long'
		}),
	email: z
		.string()
		.trim()
		.min(1, { message: 'Email is required' })
		.refine((value) => value.length === 0 || emailRegex.test(value), {
			message: 'Email format is invalid'
		})
});

export const updateUserSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, { message: 'Name cannot be empty' })
		.min(2, { message: 'Name must be at least 2 characters long' })
		.optional(),
	email: z
		.string()
		.trim()
		.min(1, { message: 'Email cannot be empty' })
		.refine((value) => value.length === 0 || emailRegex.test(value), {
			message: 'Email format is invalid'
		})
		.optional()
});

// Inferred DTO types from schemas
export type CreateUserRequest = z.infer<typeof createUserSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
