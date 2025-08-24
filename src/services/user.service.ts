import { injectable, inject } from 'inversify';
import type {
	IUserService,
	IUserRepository,
	IUserValidationService,
	User,
	CreateUserRequest,
	UpdateUserRequest
} from '../interfaces/user.interface';
import type { ILogger } from '../interfaces/logger.interface';
import { TYPES } from '../container/types';
import { ValidationError } from '../types/errors';

// Dependency Inversion Principle - Depends on abstractions, not concretions
@injectable()
export class UserService implements IUserService {
	constructor(
		@inject(TYPES.UserRepository) private readonly userRepository: IUserRepository,
		@inject(TYPES.UserValidationService) private readonly validationService: IUserValidationService,
		@inject(TYPES.Logger) private readonly logger: ILogger
	) {}

	async getUserById(id: number): Promise<User | null> {
		this.logger.info('Fetching user by ID', { userId: id });

		const user = await this.userRepository.findById(id);

		if (!user) {
			this.logger.warn('User not found', { userId: id });
		}

		return user;
	}

	async getAllUsers(): Promise<User[]> {
		this.logger.info('Fetching all users');
		return await this.userRepository.findAll();
	}

	async createUser(userData: CreateUserRequest): Promise<User> {
		this.logger.info('Creating new user', { email: userData.email });

		// Validation
		const validation = this.validationService.validateCreateUser(userData);
		if (!validation.isValid) {
			const error = new ValidationError(`Validation failed: ${validation.errors.join(', ')}`);
			this.logger.error('User creation failed - validation error', error);
			throw error;
		}

		// Create user
		const newUser = await this.userRepository.create({
			...userData,
			createdAt: new Date()
		});

		this.logger.info('User created successfully', { userId: newUser.id });
		return newUser;
	}

	async updateUser(id: number, userData: UpdateUserRequest): Promise<User | null> {
		this.logger.info('Updating user', { userId: id, updateData: userData });

		// Check if user exists
		const existingUser = await this.userRepository.findById(id);
		if (!existingUser) {
			this.logger.warn('Update failed - user not found', { userId: id });
			return null;
		}

		// Validation
		const validation = this.validationService.validateUpdateUser(userData);
		if (!validation.isValid) {
			const error = new ValidationError(`Validation failed: ${validation.errors.join(', ')}`);
			this.logger.error('User update failed - validation error', error);
			throw error;
		}

		// Update user
		const updatedUser = await this.userRepository.update(id, userData);

		if (updatedUser) {
			this.logger.info('User updated successfully', { userId: id });
		}

		return updatedUser;
	}

	async deleteUser(id: number): Promise<boolean> {
		this.logger.info('Deleting user', { userId: id });

		// Check if user exists
		const existingUser = await this.userRepository.findById(id);
		if (!existingUser) {
			this.logger.warn('Delete failed - user not found', { userId: id });
			return false;
		}

		const deleted = await this.userRepository.delete(id);

		if (deleted) {
			this.logger.info('User deleted successfully', { userId: id });
		}

		return deleted;
	}
}
