import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { Container } from 'inversify';
import { TYPES } from '../../container/types';
import { UserService } from '../../services/user.service';
import type { IUserRepository } from '../../interfaces/user.interface';
import type { ILogger } from '../../interfaces/logger.interface';

describe('UserService', () => {
	let userService: UserService;
	let mockUserRepository: IUserRepository;
	let mockLogger: ILogger;
	let container: Container;

	beforeEach(() => {
		// Create mock implementations
		mockUserRepository = {
			findById: vi.fn(),
			findAll: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn()
		} as IUserRepository;

		mockLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn()
		} as ILogger;

		// Set up container with mocks
		container = new Container();
		container.bind<IUserRepository>(TYPES.UserRepository).toConstantValue(mockUserRepository);
		container.bind<ILogger>(TYPES.Logger).toConstantValue(mockLogger);
		container.bind<UserService>(TYPES.UserService).to(UserService);

		// Create service instance with injected dependencies
		userService = container.get(TYPES.UserService);
	});

	describe('getUserById', () => {
		it('should return user when found', async () => {
			// Arrange
			const userId = 1;
			const expectedUser = {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com',
				createdAt: new Date()
			};
			(mockUserRepository.findById as Mock).mockResolvedValue(expectedUser);

			// Act
			const result = await userService.getUserById(userId);

			// Assert
			expect(result).toEqual(expectedUser);
			expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
			expect(mockLogger.info).toHaveBeenCalledWith('Fetching user by ID', { userId });
		});

		it('should return null and log warning when user not found', async () => {
			// Arrange
			const userId = 999;
			(mockUserRepository.findById as Mock).mockResolvedValue(null);

			// Act
			const result = await userService.getUserById(userId);

			// Assert
			expect(result).toBeNull();
			expect(mockLogger.warn).toHaveBeenCalledWith('User not found', { userId });
		});
	});

	describe('createUser', () => {
		it('should create user when validation passes', async () => {
			// Arrange
			const userData = { name: 'John Doe', email: 'john@example.com' };
			const expectedUser = { id: 1, ...userData, createdAt: new Date() };

			(mockUserRepository.create as Mock).mockResolvedValue(expectedUser);

			// Act
			const result = await userService.createUser(userData);

			// Assert
			expect(result).toEqual(expectedUser);
			expect(mockUserRepository.create).toHaveBeenCalled();
			expect(mockLogger.info).toHaveBeenCalledWith('Creating new user', { email: userData.email });
		});

		it('should throw error when validation fails', async () => {
			// Arrange
			const userData = { name: '', email: 'invalid-email' };
			// Act & Assert
			await expect(userService.createUser(userData)).rejects.toThrow(
				'Validation failed: Name is required, Email format is invalid'
			);
			expect(mockUserRepository.create).not.toHaveBeenCalled();
			expect(mockLogger.error).toHaveBeenCalled();
		});
	});

	describe('updateUser', () => {
		it('should update user when validation passes and user exists', async () => {
			const userId = 1;
			const updateData = { name: 'Updated Name' };
			const existingUser = {
				id: 1,
				name: 'Old Name',
				email: 'test@example.com',
				createdAt: new Date()
			};
			const updatedUser = { ...existingUser, ...updateData };

			(mockUserRepository.findById as Mock).mockResolvedValue(existingUser);
			(mockUserRepository.update as Mock).mockResolvedValue(updatedUser);

			const result = await userService.updateUser(userId, updateData);

			expect(result).toEqual(updatedUser);
			expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
			expect(mockUserRepository.update).toHaveBeenCalledWith(userId, updateData);
			expect(mockLogger.info).toHaveBeenCalledWith('User updated successfully', { userId });
		});

		it('should throw error when update validation fails', async () => {
			const userId = 1;
			const updateData = { email: 'invalid-email' };
			const existingUser = {
				id: 1,
				name: 'Test',
				email: 'test@example.com',
				createdAt: new Date()
			};

			(mockUserRepository.findById as Mock).mockResolvedValue(existingUser);

			await expect(userService.updateUser(userId, updateData)).rejects.toThrow(
				'Validation failed: Email format is invalid'
			);
			expect(mockUserRepository.update).not.toHaveBeenCalled();
			expect(mockLogger.error).toHaveBeenCalled();
		});
	});

	describe('deleteUser', () => {
		it('should delete user when user exists', async () => {
			const userId = 1;
			const existingUser = {
				id: 1,
				name: 'Test',
				email: 'test@example.com',
				createdAt: new Date()
			};

			(mockUserRepository.findById as Mock).mockResolvedValue(existingUser);
			(mockUserRepository.delete as Mock).mockResolvedValue(true);

			const result = await userService.deleteUser(userId);

			expect(result).toBe(true);
			expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
			expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
			expect(mockLogger.info).toHaveBeenCalledWith('User deleted successfully', { userId });
		});
	});
});
