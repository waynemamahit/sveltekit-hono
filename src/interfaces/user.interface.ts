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

export interface IUserValidationService {
	validateCreateUser(userData: CreateUserRequest): ValidationResult;
	validateUpdateUser(userData: UpdateUserRequest): ValidationResult;
}

// DTOs for better type safety
export interface User {
	id: number;
	name: string;
	email: string;
	createdAt: Date;
}

export interface CreateUserRequest {
	name: string;
	email: string;
}

export interface UpdateUserRequest {
	name?: string;
	email?: string;
}

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
}
