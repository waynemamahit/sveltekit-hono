import { Container } from 'inversify';
import { TYPES } from '../../container/types';
import type {
	HelloResponse,
	IApiService,
	IHealthApiService,
	IHelloApiService,
	IUserApiService
} from '../../interfaces/api.interface';
import type { User } from '../../models/user.model';
import type { HealthStatus } from '../../types/health';

// Mock data
export const mockUsers: User[] = [
	{ id: 1, name: 'John Doe', email: 'john@example.com' },
	{ id: 2, name: 'Jane Smith', email: 'jane@example.com' },
	{ id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
];

export const mockHealthStatus: HealthStatus = {
	status: 'healthy',
	timestamp: new Date().toISOString(),
	environment: 'test'
};

export const mockHelloResponse: HelloResponse = {
	message: 'Hello from mock API!',
	timestamp: new Date().toISOString(),
	environment: 'test'
};

// Mock User API Service
export class MockUserApiService implements IUserApiService {
	private users: User[] = [...mockUsers];
	private nextId = 4;

	async getAllUsers(): Promise<User[]> {
		return Promise.resolve([...this.users]);
	}

	async getUserById(id: number): Promise<User> {
		const user = this.users.find((u) => u.id === id);
		if (!user) {
			throw new Error(`User with ID ${id} not found`);
		}
		return Promise.resolve(user);
	}

	async createUser(userData: { name: string; email: string }): Promise<User> {
		const newUser: User = {
			id: this.nextId++,
			name: userData.name,
			email: userData.email
		};
		this.users.push(newUser);
		return Promise.resolve(newUser);
	}

	async updateUser(id: number, userData: { name?: string; email?: string }): Promise<User> {
		const userIndex = this.users.findIndex((u) => u.id === id);
		if (userIndex === -1) {
			throw new Error(`User with ID ${id} not found`);
		}
		this.users[userIndex] = {
			...this.users[userIndex],
			...userData
		};
		return Promise.resolve(this.users[userIndex]);
	}

	async deleteUser(id: number): Promise<void> {
		const userIndex = this.users.findIndex((u) => u.id === id);
		if (userIndex === -1) {
			throw new Error(`User with ID ${id} not found`);
		}
		this.users.splice(userIndex, 1);
		return Promise.resolve();
	}

	// Helper method to reset mock data
	reset(): void {
		this.users = [...mockUsers];
		this.nextId = 4;
	}
}

// Mock Health API Service
export class MockHealthApiService implements IHealthApiService {
	async checkHealth(): Promise<HealthStatus> {
		return Promise.resolve({ ...mockHealthStatus });
	}
}

// Mock Hello API Service
export class MockHelloApiService implements IHelloApiService {
	async getHello(): Promise<HelloResponse> {
		return Promise.resolve({ ...mockHelloResponse });
	}
}

// Mock combined API Service
export class MockApiService implements IApiService {
	public readonly users: IUserApiService;
	public readonly health: IHealthApiService;
	public readonly hello: IHelloApiService;

	constructor(users?: IUserApiService, health?: IHealthApiService, hello?: IHelloApiService) {
		this.users = users || new MockUserApiService();
		this.health = health || new MockHealthApiService();
		this.hello = hello || new MockHelloApiService();
	}
}

// Factory functions for creating mocks with custom behavior
export function createMockUserApi(overrides?: Partial<IUserApiService>): IUserApiService {
	const mock = new MockUserApiService();
	if (!overrides) return mock;

	// Create a new object that implements the full interface
	return {
		getAllUsers: overrides.getAllUsers || mock.getAllUsers.bind(mock),
		getUserById: overrides.getUserById || mock.getUserById.bind(mock),
		createUser: overrides.createUser || mock.createUser.bind(mock),
		updateUser: overrides.updateUser || mock.updateUser.bind(mock),
		deleteUser: overrides.deleteUser || mock.deleteUser.bind(mock)
	};
}

export function createMockHealthApi(overrides?: Partial<IHealthApiService>): IHealthApiService {
	const mock = new MockHealthApiService();
	if (!overrides) return mock;

	return {
		checkHealth: overrides.checkHealth || mock.checkHealth.bind(mock)
	};
}

export function createMockHelloApi(overrides?: Partial<IHelloApiService>): IHelloApiService {
	const mock = new MockHelloApiService();
	if (!overrides) return mock;

	return {
		getHello: overrides.getHello || mock.getHello.bind(mock)
	};
}

export function createMockApi(overrides?: {
	users?: IUserApiService;
	health?: IHealthApiService;
	hello?: IHelloApiService;
}): IApiService {
	return new MockApiService(overrides?.users, overrides?.health, overrides?.hello);
}

// Helper to create a test container with mock services (for Svelte component testing)
export async function createMockContainer() {
	const { Container } = await import('inversify');
	const { TYPES } = await import('../../container/types');

	const container = new Container();

	container.bind(TYPES.UserApiService).toConstantValue(new MockUserApiService());
	container.bind(TYPES.HealthApiService).toConstantValue(new MockHealthApiService());
	container.bind(TYPES.HelloApiService).toConstantValue(new MockHelloApiService());
	container.bind(TYPES.ApiService).toConstantValue(new MockApiService());

	return container;
}

// Synchronous version for tests that don't support async setup
export function createMockContainerSync() {
	const container = new Container();

	container.bind(TYPES.UserApiService).toConstantValue(new MockUserApiService());
	container.bind(TYPES.HealthApiService).toConstantValue(new MockHealthApiService());
	container.bind(TYPES.HelloApiService).toConstantValue(new MockHelloApiService());
	container.bind(TYPES.ApiService).toConstantValue(new MockApiService());

	return container;
}
