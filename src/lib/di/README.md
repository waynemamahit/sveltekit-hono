# Dependency Injection - Quick Reference

> 📖 **Full Documentation**: See [`docs/DEVELOPMENT.md`](../../../docs/DEVELOPMENT.md) for comprehensive DI documentation.

## Quick Start

### 1. Initialize DI (Root Layout)

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { initializeDI } from '$lib/di/context.svelte';
	initializeDI();
</script>
```

### 2. Use Services in Components

```svelte
<script lang="ts">
	import { useUserApi } from '$lib/di/context.svelte';

	const userApi = useUserApi();
	const users = await userApi.getAllUsers();
</script>
```

## Available Hooks

| Hook              | Service               | Use Case                 |
| ----------------- | --------------------- | ------------------------ |
| `useUserApi()`    | User API Service      | User CRUD operations     |
| `useHealthApi()`  | Health API Service    | System health checks     |
| `useHelloApi()`   | Hello API Service     | Hello endpoint           |
| `useApi()`        | Combined API (Facade) | Multiple services needed |
| `useHttpClient()` | HTTP Client           | Custom API calls         |

## Usage Patterns

### Pattern 1: Single Service

```svelte
<script lang="ts">
	const userApi = useUserApi();
	const users = await userApi.getAllUsers();
</script>
```

### Pattern 2: Multiple Services (Facade)

```svelte
<script lang="ts">
	const api = useApi();
	const users = await api.users.getAllUsers();
	const health = await api.health.checkHealth();
</script>
```

### Pattern 3: Custom Service Hook

```typescript
import { createServiceHook } from '$lib/di/context.svelte';
import { TYPES } from '$container/types';

export const useMyService = createServiceHook<IMyService>(TYPES.MyService);
```

## Testing with DI

```typescript
import { Container } from 'inversify';
import { TYPES } from '$container/types';

const testContainer = new Container();
testContainer.bind(TYPES.UserApiService).toConstantValue(mockUserApi);

// Use in test
initializeDI(testContainer);
```

## Documentation Links

### Comprehensive Guides

- **[🏗️ Server-Side DI Architecture](../../../docs/DEVELOPMENT.md#-dependency-injection-architecture)** - Business logic, repositories, validators
- **[🎨 Client-Side DI (Svelte)](../../../docs/DEVELOPMENT.md#-client-side-dependency-injection-svelte-components)** - API services, HTTP clients, component hooks
- **[🧪 Testing with DI](../../../docs/DEVELOPMENT.md#testing-with-di)** - Mocking, unit tests, integration tests

### Specific Topics

- [Why Dependency Injection?](../../../docs/DEVELOPMENT.md#why-client-side-di)
- [Architecture Overview](../../../docs/DEVELOPMENT.md#architecture-overview)
- [DI Directory Structure](../../../docs/DEVELOPMENT.md#di-directory-structure)
- [Complete API Reference](../../../docs/DEVELOPMENT.md#complete-api-reference)
- [Usage Patterns](../../../docs/DEVELOPMENT.md#usage-patterns)
- [Error Handling](../../../docs/DEVELOPMENT.md#error-handling)
- [Best Practices](../../../docs/DEVELOPMENT.md#best-practices-for-client-side-di)
- [Adding New Services](../../../docs/DEVELOPMENT.md#adding-new-client-side-services)
- [Troubleshooting](../../../docs/DEVELOPMENT.md#troubleshooting-client-side-di)
- [Contributing to DI](../../../docs/DEVELOPMENT.md#contributing-to-di-system)

## Key Differences: Server vs Client

| Aspect        | Server-Side                         | Client-Side                                       |
| ------------- | ----------------------------------- | ------------------------------------------------- |
| **Container** | `src/container/inversify.config.ts` | `src/container/client/inversify.config.client.ts` |
| **Usage**     | Hono API routes                     | Svelte components                                 |
| **Services**  | Business logic, repositories        | HTTP client, API services                         |
| **Access**    | `getService(c, TYPES.Service)`      | `useService()` hooks                              |

## Common Issues

### "DI Container not found in context"

➜ Call `initializeDI()` in root `+layout.svelte`

### "No matching bindings found"

➜ Register service in client container: `src/container/client/inversify.config.client.ts`

### Type errors with services

➜ Ensure service implements interface completely

## Live Example

Run the development server and visit:

```
http://localhost:5173/di-example
```

## Resources

- [InversifyJS Docs](https://inversify.io/)
- [SvelteKit Docs](https://kit.svelte.dev/)
- [Full Development Guide](../../../docs/DEVELOPMENT.md)
