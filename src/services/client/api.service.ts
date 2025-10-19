import { inject, injectable } from 'inversify';
import { TYPES } from '../../container/types';
import type {
	ApiResponse,
	HelloResponse,
	IApiService,
	IHealthApiService,
	IHelloApiService,
	IUserApiService
} from '../../interfaces/api.interface';
import type { IHttpClient } from '../../interfaces/http-client.interface';
import type { User } from '../../models/user.model';
import type { HealthStatus } from '../../types/health';

@injectable()
export class UserApiService implements IUserApiService {
	constructor(@inject(TYPES.HttpClient) private readonly httpClient: IHttpClient) {}

	async getAllUsers(): Promise<User[]> {
		const response = await this.httpClient.get<ApiResponse<User[]>>('/api/users');
		return response.data || [];
	}

	async getUserById(id: number): Promise<User> {
		const response = await this.httpClient.get<ApiResponse<User>>(`/api/users/${id}`);
		if (!response.data) {
			throw new Error(`User with ID ${id} not found`);
		}
		return response.data;
	}

	async createUser(userData: { name: string; email: string }): Promise<User> {
		const response = await this.httpClient.post<ApiResponse<User>>('/api/users', userData);
		if (!response.data) {
			throw new Error('Failed to create user');
		}
		return response.data;
	}

	async updateUser(id: number, userData: { name?: string; email?: string }): Promise<User> {
		const response = await this.httpClient.put<ApiResponse<User>>(`/api/users/${id}`, userData);
		if (!response.data) {
			throw new Error(`Failed to update user with ID ${id}`);
		}
		return response.data;
	}

	async deleteUser(id: number): Promise<void> {
		await this.httpClient.delete(`/api/users/${id}`);
	}
}

@injectable()
export class HealthApiService implements IHealthApiService {
	constructor(@inject(TYPES.HttpClient) private readonly httpClient: IHttpClient) {}

	async checkHealth(): Promise<HealthStatus> {
		return await this.httpClient.get<HealthStatus>('/api/health');
	}
}

@injectable()
export class HelloApiService implements IHelloApiService {
	constructor(@inject(TYPES.HttpClient) private readonly httpClient: IHttpClient) {}

	async getHello(): Promise<HelloResponse> {
		return await this.httpClient.get<HelloResponse>('/api/hello');
	}
}

@injectable()
export class ApiService implements IApiService {
	public readonly users: IUserApiService;
	public readonly health: IHealthApiService;
	public readonly hello: IHelloApiService;

	constructor(
		@inject(TYPES.UserApiService) userApiService: IUserApiService,
		@inject(TYPES.HealthApiService) healthApiService: IHealthApiService,
		@inject(TYPES.HelloApiService) helloApiService: IHelloApiService
	) {
		this.users = userApiService;
		this.health = healthApiService;
		this.hello = helloApiService;
	}
}
