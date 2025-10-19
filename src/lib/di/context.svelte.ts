import type { Container } from 'inversify';
import { getContext, setContext } from 'svelte';
import { clientContainer } from '../../container/inversify.client';
import { TYPES } from '../../container/types';
import type {
	IApiService,
	IHealthApiService,
	IHelloApiService,
	IUserApiService
} from '../../interfaces/api.interface';
import type { IHttpClient } from '../../interfaces/http-client.interface';

const DI_CONTAINER_KEY = Symbol('DI_CONTAINER');

/**
 * Initialize the DI container in the Svelte context
 * Call this in the root layout or component
 */
export function initializeDI(container: Container = clientContainer): void {
	setContext(DI_CONTAINER_KEY, container);
}

/**
 * Get the DI container from Svelte context
 */
export function getContainer(): Container {
	const container = getContext<Container>(DI_CONTAINER_KEY);

	if (!container) {
		throw new Error(
			'DI Container not found in context. Did you call initializeDI() in the root layout?'
		);
	}

	return container;
}

/**
 * Get a service from the DI container by its type identifier
 */
export function getService<T>(serviceType: symbol): T {
	const container = getContainer();
	return container.get<T>(serviceType);
}

/**
 * Hook to get the HTTP Client service
 */
export function useHttpClient(): IHttpClient {
	return getService<IHttpClient>(TYPES.HttpClient);
}

/**
 * Hook to get the User API service
 */
export function useUserApi(): IUserApiService {
	return getService<IUserApiService>(TYPES.UserApiService);
}

/**
 * Hook to get the Health API service
 */
export function useHealthApi(): IHealthApiService {
	return getService<IHealthApiService>(TYPES.HealthApiService);
}

/**
 * Hook to get the Hello API service
 */
export function useHelloApi(): IHelloApiService {
	return getService<IHelloApiService>(TYPES.HelloApiService);
}

/**
 * Hook to get the combined API service (facade pattern)
 */
export function useApi(): IApiService {
	return getService<IApiService>(TYPES.ApiService);
}

/**
 * Higher-order function to create custom service hooks
 *
 * @example
 * const useMyService = createServiceHook<IMyService>(TYPES.MyService);
 */
export function createServiceHook<T>(serviceType: symbol): () => T {
	return () => getService<T>(serviceType);
}
