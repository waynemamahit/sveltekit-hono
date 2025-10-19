# Dependency Injection in SvelteKit

This directory contains utilities for implementing Dependency Injection (DI) in Svelte components using InversifyJS.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Usage Patterns](#usage-patterns)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Best Practices](#best-practices)
- [Advanced Usage](#advanced-usage)

## Overview

This implementation provides a robust dependency injection system for SvelteKit applications, separating concerns between client-side and server-side containers while enabling testable, maintainable component architecture.

### Why Dependency Injection?

- **Testability**: Easily mock dependencies for unit testing
- **Maintainability**: Centralized service configuration
- **Reusability**: Share services across multiple components
- **Flexibility**: Swap implementations without changing component code
- **Separation of Concerns**: Clear boundaries between business logic and UI

## Architecture

### Directory Structure

```
src/
├── container/
│   ├── client/
│   │   └── inversify.config.client.ts  # Client-side DI container
│   ├── inversify.config.ts             # Server-side DI container
│   ├── types.ts                        # Service type identifiers
│   └── resolvers.ts                    # Server-side service resolvers
├── interfaces/
│   ├── api.interface.ts                # API service interfaces
│   └── http-client.interface.ts        # HTTP client interface
├── services/
│   ├── client/
│   │   ├── http-client.service.ts      # HTTP client implementation
│   │   └── api.service.ts              # API service implementations
│   ├── user.service.ts                 # Server-side services
│   └── ...
└── lib/
    └── di/
        ├── context.svelte.ts           # Svelte DI context utilities
        └── README.md                   # This file
```

### Container Separation

We maintain **two separate containers**:

1. **Server-side container** (`container/inversify.config.ts`)
   - Used by Hono API routes
   - Contains database repositories, business logic services
   - Not accessible from browser

2. **Client-side container** (`container/client/inversify.config.client.ts`)
   - Used by Svelte components
   - Contains HTTP clients, API services
   - Runs in the browser

## Getting Started

### 1. Initialize DI in Root Layout

The DI container must be initialized at the root of your application:

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { initializeDI } from '$lib/di/context.svelte';

	// Initialize the DI container for all child components
	initializeDI();
</script>
```

### 2. Inject Services in Components

Use the provided hooks to inject services into your components:

```svelte
<script lang="ts">
	import { useUserApi } from '$lib/di/context.svelte';

	const userApi = useUserApi();

	const loadUsers = async () => {
		const users = await userApi.getAllUsers();
	};
</script>
```

## Usage Patterns

### Pattern 1: Individual Service Hooks

Use specific service hooks for focused functionality:

```svelte
<script lang="ts">
	import { useUserApi, useHealthApi } from '$lib/di/context.svelte';

	const userApi = useUserApi();
	const healthApi = useHealthApi();

	// Each service is independent
	const users = await userApi.getAllUsers();
	const health = await healthApi.checkHealth();
</script>
```

**When to use:**

- Component needs only one or two services
- Clear service boundaries
- Maximum type safety

### Pattern 2: Combined API Service (Facade)

Use the facade pattern for components that need multiple services:

```svelte
<script lang="ts">
	import { useApi } from '$lib/di/context.svelte';

	const api = useApi();

	// Access all services through single interface
	const users = await api.users.getAllUsers();
	const health = await api.health.checkHealth();
	const hello = await api.hello.getHello();
</script>
```

**When to use:**

- Component needs multiple API services
- Simplify imports
- Consistent service access pattern

### Pattern 3: Component-Level DI

Create self-contained components that manage their own data:

```svelte
<!-- UserList.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { useUserApi } from '$lib/di/context.svelte';

	const userApi = useUserApi();
	let users = $state([]);

	onMount(async () => {
		users = await userApi.getAllUsers();
	});

	const deleteUser = async (id: number) => {
		await userApi.deleteUser(id);
		users = users.filter((u) => u.id !== id);
	};
</script>

<!-- Component renders its own data -->
```

**When to use:**

- Reusable components with independent state
- Components that encapsulate business logic
- Maximum component isolation

## API Reference

### Initialization

#### `initializeDI(container?: Container): void`

Initialize the DI container in Svelte context. Must be called in root layout.

```typescript
import { initializeDI } from '$lib/di/context.svelte';

// Use default container
initializeDI();

// Or provide custom container (for testing)
initializeDI(mockContainer);
```

### Service Hooks

#### `useUserApi(): IUserApiService`

Inject the User API service.

```typescript
const userApi = useUserApi();

await userApi.getAllUsers();
await userApi.createUser({ name: 'John', email: 'john@example.com' });
await userApi.deleteUser(1);
```

#### `useHealthApi(): IHealthApiService`

Inject the Health API service.

```typescript
const healthApi = useHealthApi();
const status = await healthApi.checkHealth();
```

#### `useHelloApi(): IHelloApiService`

Inject the Hello API service.

```typescript
const helloApi = useHelloApi();
const response = await helloApi.getHello();
```

#### `useApi(): IApiService`

Inject the combined API service (facade).

```typescript
const api = useApi();

// Access all services
api.users.getAllUsers();
api.health.checkHealth();
api.hello.getHello();
```

#### `useHttpClient(): IHttpClient`

Inject the HTTP client directly (advanced usage).

```typescript
const httpClient = useHttpClient();

await httpClient.get('/api/custom-endpoint');
await httpClient.post('/api/data', { key: 'value' });
```

### Low-Level API

#### `getContainer(): Container`

Get the DI container from context.

```typescript
import { getContainer } from '$lib/di/context.svelte';

const container = getContainer();
```

#### `getService<T>(serviceType: symbol): T`

Get a service by its type identifier.

```typescript
import { getService } from '$lib/di/context.svelte';
import { TYPES } from '$container/types';

const userApi = getService<IUserApiService>(TYPES.UserApiService);
```

#### `createServiceHook<T>(serviceType: symbol): () => T`

Create a custom service hook.

```typescript
import { createServiceHook } from '$lib/di/context.svelte';
import { TYPES } from '$container/types';

const useMyService = createServiceHook<IMyService>(TYPES.MyService);

// Use in component
const myService = useMyService();
```

## Testing

### Testing Components with DI

Create mock services and provide them through a test container:

```typescript
// UserList.test.ts
import { render } from '@testing-library/svelte';
import { Container } from 'inversify';
import { TYPES } from '$container/types';
import UserList from './UserList.svelte';
import TestWrapper from './TestWrapper.svelte';

describe('UserList', () => {
	it('should render users from API', async () => {
		// Create mock service
		const mockUserApi = {
			getAllUsers: vi.fn().mockResolvedValue([{ id: 1, name: 'John', email: 'john@example.com' }]),
			deleteUser: vi.fn()
		};

		// Create test container
		const testContainer = new Container();
		testContainer.bind(TYPES.UserApiService).toConstantValue(mockUserApi);

		// Render with test container
		const { getByText } = render(TestWrapper, {
			props: {
				container: testContainer,
				component: UserList
			}
		});

		expect(await getByText('John')).toBeInTheDocument();
		expect(mockUserApi.getAllUsers).toHaveBeenCalled();
	});
});
```

### Test Wrapper Component

```svelte
<!-- TestWrapper.svelte -->
<script lang="ts">
	import { initializeDI } from '$lib/di/context.svelte';
	import type { Container } from 'inversify';
	import type { ComponentType } from 'svelte';

	let { container, component, ...props } = $props<{
		container: Container;
		component: ComponentType;
		[key: string]: any;
	}>();

	initializeDI(container);
</script>

<svelte:component this={component} {...props} />
```

### Mocking Services

Create mock implementations that match your interfaces:

```typescript
// mocks/api.mock.ts
import type { IUserApiService } from '$interfaces/api.interface';

export const createMockUserApi = (): IUserApiService => ({
	getAllUsers: vi.fn().mockResolvedValue([]),
	getUserById: vi.fn().mockResolvedValue(null),
	createUser: vi.fn().mockResolvedValue({ id: 1, name: 'Test', email: 'test@example.com' }),
	updateUser: vi.fn().mockResolvedValue({ id: 1, name: 'Updated', email: 'updated@example.com' }),
	deleteUser: vi.fn().mockResolvedValue(undefined)
});
```

## Best Practices

### 1. Always Initialize DI in Root Layout

```svelte
<!-- ✅ GOOD: Initialize once at the root -->
<script lang="ts">
	import { initializeDI } from '$lib/di/context.svelte';
	initializeDI();
</script>

<!-- ❌ BAD: Don't initialize in child components -->
```

### 2. Use Appropriate Service Granularity

```svelte
<!-- ✅ GOOD: Use specific service for focused components -->
<script lang="ts">
  const userApi = useUserApi();
</script>

<!-- ✅ GOOD: Use facade for components needing multiple services -->
<script lang="ts">
  const api = useApi();
</script>

<!-- ❌ BAD: Don't inject unused services -->
<script lang="ts">
  const api = useApi(); // Then only use api.users
</script>
```

### 3. Handle Errors Gracefully

```svelte
<script lang="ts">
	const userApi = useUserApi();
	let error = $state<string | null>(null);

	const loadUsers = async () => {
		try {
			return await userApi.getAllUsers();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error';
			console.error('Failed to load users:', err);
			return [];
		}
	};
</script>
```

### 4. Prefer Interface-Based Design

```typescript
// ✅ GOOD: Depend on interfaces
import type { IUserApiService } from '$interfaces/api.interface';

// ❌ BAD: Don't depend on concrete implementations
import { UserApiService } from '$services/client/api.service';
```

### 5. Keep Services Stateless

Services should be stateless and reusable. Store state in components, not services.

```typescript
// ✅ GOOD: Stateless service
class UserApiService {
	async getAllUsers() {
		/* ... */
	}
}

// ❌ BAD: Stateful service
class UserApiService {
	private cachedUsers: User[] = [];
	async getAllUsers() {
		/* ... */
	}
}
```

## Advanced Usage

### Creating Custom Services

1. Define the interface:

```typescript
// interfaces/notification.interface.ts
export interface INotificationService {
	success(message: string): void;
	error(message: string): void;
}
```

2. Implement the service:

```typescript
// services/client/notification.service.ts
import { injectable } from 'inversify';

@injectable()
export class NotificationService implements INotificationService {
	success(message: string) {
		// Implementation
	}

	error(message: string) {
		// Implementation
	}
}
```

3. Add to types:

```typescript
// container/types.ts
export const TYPES = {
	// ...
	NotificationService: Symbol.for('NotificationService')
};
```

4. Register in container:

```typescript
// container/client/inversify.config.client.ts
clientContainer
	.bind<INotificationService>(TYPES.NotificationService)
	.to(NotificationService)
	.inSingletonScope();
```

5. Create hook:

```typescript
// lib/di/context.svelte.ts
export function useNotifications(): INotificationService {
	return getService<INotificationService>(TYPES.NotificationService);
}
```

### Service Lifetimes

```typescript
// Singleton: One instance for entire application
container.bind<IService>(TYPES.Service).to(Service).inSingletonScope();

// Transient: New instance for each injection
container.bind<IService>(TYPES.Service).to(Service).inTransientScope();

// Request: One instance per request (server-side only)
container.bind<IService>(TYPES.Service).to(Service).inRequestScope();
```

### Conditional Bindings

```typescript
// Development vs Production
if (import.meta.env.DEV) {
	container.bind<ILogger>(TYPES.Logger).to(ConsoleLogger);
} else {
	container.bind<ILogger>(TYPES.Logger).to(ProductionLogger);
}
```

### Factory Bindings

```typescript
container.bind<IHttpClient>(TYPES.HttpClient).toFactory((context) => {
	return (baseURL: string) => {
		return new HttpClient(baseURL);
	};
});
```

## Examples

See the `/di-example` route for live examples demonstrating all patterns:

```
http://localhost:5173/di-example
```

## Troubleshooting

### Error: "DI Container not found in context"

**Cause**: DI not initialized or accessing before initialization

**Solution**: Ensure `initializeDI()` is called in root layout before any components access services

### Error: "No matching bindings found"

**Cause**: Service not registered in container

**Solution**: Add service binding to `container/client/inversify.config.client.ts`

### Type errors with services

**Cause**: Interface mismatch or missing interface

**Solution**: Ensure service implementation matches interface exactly

## Resources

- [InversifyJS Documentation](https://inversify.io/)
- [SvelteKit Documentation](https://kit.svelte.dev/)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Dependency Injection Pattern](https://en.wikipedia.org/wiki/Dependency_injection)

## Contributing

When adding new services:

1. Create interface in `interfaces/`
2. Implement in `services/client/`
3. Add type identifier to `container/types.ts`
4. Register in `container/client/inversify.config.client.ts`
5. Create hook in `lib/di/context.svelte.ts`
6. Add tests with mocks
7. Update this documentation
