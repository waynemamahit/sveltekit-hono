import { Container } from 'inversify';
import 'reflect-metadata';
import { PUBLIC_ENV } from '../lib/env';
import { TYPES } from './types';

// Interfaces
import type {
	IApiService,
	IHealthApiService,
	IHelloApiService,
	IUserApiService
} from '../interfaces/api.interface';
import type { IHttpClient } from '../interfaces/http-client.interface';

// Implementations
import {
	ApiService,
	HealthApiService,
	HelloApiService,
	UserApiService
} from '../services/client/api.service';
import { HttpClient } from '../services/client/http-client.service';

// Create Client-side IoC Container
const clientContainer = new Container();

// Bind HTTP Client with base URL from environment
clientContainer
	.bind<IHttpClient>(TYPES.HttpClient)
	.toDynamicValue(() => {
		return new HttpClient(PUBLIC_ENV.API_BASE_URL);
	})
	.inSingletonScope();

// Bind API Services
clientContainer.bind<IUserApiService>(TYPES.UserApiService).to(UserApiService).inSingletonScope();

clientContainer
	.bind<IHealthApiService>(TYPES.HealthApiService)
	.to(HealthApiService)
	.inSingletonScope();

clientContainer
	.bind<IHelloApiService>(TYPES.HelloApiService)
	.to(HelloApiService)
	.inSingletonScope();

// Bind combined API Service (facade)
clientContainer.bind<IApiService>(TYPES.ApiService).to(ApiService).inSingletonScope();

export { clientContainer };
