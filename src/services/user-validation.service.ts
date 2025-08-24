import { injectable } from 'inversify';
import type {
	IUserValidationService,
	CreateUserRequest,
	UpdateUserRequest,
	ValidationResult
} from '../interfaces/user.interface';

// Single Responsibility Principle - Only handles validation logic
@injectable()
export class UserValidationService implements IUserValidationService {
	validateCreateUser(userData: CreateUserRequest): ValidationResult {
		const errors: string[] = [];

		if (!userData.name || userData.name.trim().length === 0) {
			errors.push('Name is required');
		}

		if (userData.name && userData.name.length < 2) {
			errors.push('Name must be at least 2 characters long');
		}

		if (!userData.email || userData.email.trim().length === 0) {
			errors.push('Email is required');
		}

		if (userData.email && !this.isValidEmail(userData.email)) {
			errors.push('Email format is invalid');
		}

		return {
			isValid: errors.length === 0,
			errors
		};
	}

	validateUpdateUser(userData: UpdateUserRequest): ValidationResult {
		const errors: string[] = [];

		if (userData.name !== undefined && userData.name.trim().length === 0) {
			errors.push('Name cannot be empty');
		}

		if (userData.name && userData.name.length < 2) {
			errors.push('Name must be at least 2 characters long');
		}

		if (userData.email !== undefined && userData.email.trim().length === 0) {
			errors.push('Email cannot be empty');
		}

		if (userData.email && !this.isValidEmail(userData.email)) {
			errors.push('Email format is invalid');
		}

		return {
			isValid: errors.length === 0,
			errors
		};
	}

	private isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}
}
