// Interface Segregation Principle - Separate interfaces for different concerns
export interface IUserRepository {
	findById(id: number): Promise<User | null>;
	findAll(): Promise<User[]>;
	create(userData: Omit<User, 'id'>): Promise<User>;
	update(id: number, userData: Partial<User>): Promise<User | null>;
	delete(id: number): Promise<boolean>;
}

export interface IUserService {
	getUserById(id: number): Promise<User | null>;
	getAllUsers(): Promise<User[]>;
	createUser(userData: CreateUserRequest): Promise<User>;
	updateUser(id: number, userData: UpdateUserRequest): Promise<User | null>;
	deleteUser(id: number): Promise<boolean>;
}

// Validation moved to Zod schemas; legacy interface removed

// DTOs for better type safety
import type {
	CreateUserRequest as CreateUserRequestModel,
	UpdateUserRequest as UpdateUserRequestModel
} from '../models/user.model';

export interface User {
	id: number;
	name: string;
	email: string;
	createdAt: Date;
}

// Alias DTOs to schema-inferred types for consistency across layers
export type CreateUserRequest = CreateUserRequestModel;
export type UpdateUserRequest = UpdateUserRequestModel;

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
}
