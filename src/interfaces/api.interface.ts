import type { User } from '../models/user.model';
import type { HealthStatus } from '../types/health';

// API Response types
export interface ApiResponse<T> {
	data?: T;
	message?: string;
	error?: string;
}

export interface HelloResponse {
	message: string;
	timestamp?: string;
	environment?: string;
}

// User API Service Interface
export interface IUserApiService {
	/**
	 * Fetch all users from the API
	 */
	getAllUsers(): Promise<User[]>;

	/**
	 * Fetch a single user by ID
	 */
	getUserById(id: number): Promise<User>;

	/**
	 * Create a new user
	 */
	createUser(userData: { name: string; email: string }): Promise<User>;

	/**
	 * Update an existing user
	 */
	updateUser(id: number, userData: { name?: string; email?: string }): Promise<User>;

	/**
	 * Delete a user by ID
	 */
	deleteUser(id: number): Promise<void>;
}

// Health API Service Interface
export interface IHealthApiService {
	/**
	 * Check the health status of the API
	 */
	checkHealth(): Promise<HealthStatus>;
}

// Hello API Service Interface
export interface IHelloApiService {
	/**
	 * Fetch hello message from the API
	 */
	getHello(): Promise<HelloResponse>;
}

// Combined API Service Interface (optional - if you want a facade)
export interface IApiService {
	users: IUserApiService;
	health: IHealthApiService;
	hello: IHelloApiService;
}
