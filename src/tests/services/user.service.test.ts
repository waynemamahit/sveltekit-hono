import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { Container } from 'inversify';
import { TYPES } from '../../container/types';
import { UserService } from '../../services/user.service';
import type {
	IUserRepository,
	IUserValidationService,
	CreateUserRequest
} from '../../interfaces/user.interface';
import type { ILogger } from '../../interfaces/logger.interface';

describe('UserService', () => {
	let userService: UserService;
	let mockUserRepository: IUserRepository;
	let mockValidationService: IUserValidationService;
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

		mockValidationService = {
			validateCreateUser: vi.fn(),
			validateUpdateUser: vi.fn()
		} as IUserValidationService;

		mockLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn()
		} as ILogger;

		// Set up container with mocks
		container = new Container();
		container.bind<IUserRepository>(TYPES.UserRepository).toConstantValue(mockUserRepository);
		container
			.bind<IUserValidationService>(TYPES.UserValidationService)
			.toConstantValue(mockValidationService);
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
			const userData: CreateUserRequest = { name: 'John Doe', email: 'john@example.com' };
			const expectedUser = { id: 1, ...userData, createdAt: new Date() };

			(mockValidationService.validateCreateUser as Mock).mockReturnValue({
				isValid: true,
				errors: []
			});
			(mockUserRepository.create as Mock).mockResolvedValue(expectedUser);

			// Act
			const result = await userService.createUser(userData);

			// Assert
			expect(result).toEqual(expectedUser);
			expect(mockValidationService.validateCreateUser).toHaveBeenCalledWith(userData);
			expect(mockUserRepository.create).toHaveBeenCalled();
			expect(mockLogger.info).toHaveBeenCalledWith('Creating new user', { email: userData.email });
		});

		it('should throw error when validation fails', async () => {
			// Arrange
			const userData: CreateUserRequest = { name: '', email: 'invalid-email' };
			const validationResult = {
				isValid: false,
				errors: ['Name is required', 'Email format is invalid']
			};

			(mockValidationService.validateCreateUser as Mock).mockReturnValue(validationResult);

			// Act & Assert
			await expect(userService.createUser(userData)).rejects.toThrow(
				'Validation failed: Name is required, Email format is invalid'
			);
			expect(mockUserRepository.create).not.toHaveBeenCalled();
			expect(mockLogger.error).toHaveBeenCalled();
		});
	});
});
