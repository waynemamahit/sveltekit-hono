import { describe, it, expect, beforeEach } from 'vitest';
import { UserValidationService } from '../../services/user-validation.service';
import type { CreateUserRequest, UpdateUserRequest } from '../../interfaces/user.interface';

describe('UserValidationService', () => {
	let validationService: UserValidationService;

	beforeEach(() => {
		validationService = new UserValidationService();
	});

	describe('validateCreateUser', () => {
		it('should pass validation for valid user data', () => {
			// Arrange
			const userData: CreateUserRequest = {
				name: 'John Doe',
				email: 'john@example.com'
			};

			// Act
			const result = validationService.validateCreateUser(userData);

			// Assert
			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should fail validation when name is empty', () => {
			// Arrange
			const userData: CreateUserRequest = {
				name: '',
				email: 'john@example.com'
			};

			// Act
			const result = validationService.validateCreateUser(userData);

			// Assert
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Name is required');
		});

		it('should fail validation when name is too short', () => {
			// Arrange
			const userData: CreateUserRequest = {
				name: 'J',
				email: 'john@example.com'
			};

			// Act
			const result = validationService.validateCreateUser(userData);

			// Assert
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Name must be at least 2 characters long');
		});

		it('should fail validation when email is invalid', () => {
			// Arrange
			const userData: CreateUserRequest = {
				name: 'John Doe',
				email: 'invalid-email'
			};

			// Act
			const result = validationService.validateCreateUser(userData);

			// Assert
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Email format is invalid');
		});

		it('should fail validation with multiple errors', () => {
			// Arrange
			const userData: CreateUserRequest = {
				name: '',
				email: 'invalid-email'
			};

			// Act
			const result = validationService.validateCreateUser(userData);

			// Assert
			expect(result.isValid).toBe(false);
			expect(result.errors).toHaveLength(2);
			expect(result.errors).toContain('Name is required');
			expect(result.errors).toContain('Email format is invalid');
		});
	});

	describe('validateUpdateUser', () => {
		it('should pass validation for valid update data', () => {
			// Arrange
			const userData: UpdateUserRequest = {
				name: 'Jane Doe',
				email: 'jane@example.com'
			};

			// Act
			const result = validationService.validateUpdateUser(userData);

			// Assert
			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should pass validation for partial update data', () => {
			// Arrange
			const userData: UpdateUserRequest = {
				name: 'Jane Doe'
				// email is optional for updates
			};

			// Act
			const result = validationService.validateUpdateUser(userData);

			// Assert
			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should fail validation when provided name is empty', () => {
			// Arrange
			const userData: UpdateUserRequest = {
				name: ''
			};

			// Act
			const result = validationService.validateUpdateUser(userData);

			// Assert
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Name cannot be empty');
		});
	});
});
