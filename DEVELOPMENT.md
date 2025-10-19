# Development Guide: SvelteKit + Hono + Cloudflare Workers

Comprehensive development guide for building, testing, and deploying this modern full-stack application with enterprise-grade architecture patterns.

## 🚀 Development Setup

### Prerequisites

- **Node.js 18+** and **pnpm**
- **Cloudflare account** (for deployment)
- **Wrangler CLI**: `npm install -g wrangler`

### Quick Setup

```bash
# Install dependencies
pnpm install

# Start development (choose one)
pnpm dev          # Standard SvelteKit (recommended)
pnpm dev:cf       # With Cloudflare Workers simulation
```

### Development Modes

1. **SvelteKit Dev** (`pnpm dev`) - Best for UI development, fastest reload
2. **Cloudflare Simulation** (`pnpm dev:cf`) - Test Workers environment locally

## ✅ Validation with Zod v4

All request DTOs are validated using Zod v4 with schemas colocated in the model layer. Types are inferred from schemas to ensure consistency between runtime validation and TypeScript types.

Schemas and inferred types live in `src/models/user.model.ts`:

```ts
import { z } from 'zod';

export const createUserSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, { message: 'Name is required' })
		.refine((v) => v.length === 0 || v.length >= 2, {
			message: 'Name must be at least 2 characters long'
		}),
	email: z
		.string()
		.trim()
		.min(1, { message: 'Email is required' })
		.refine((v) => v.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
			message: 'Email format is invalid'
		})
});

export const updateUserSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, { message: 'Name cannot be empty' })
		.min(2, { message: 'Name must be at least 2 characters long' })
		.optional(),
	email: z
		.string()
		.trim()
		.min(1, { message: 'Email cannot be empty' })
		.refine((v) => v.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
			message: 'Email format is invalid'
		})
		.optional()
});

export type CreateUserRequest = z.infer<typeof createUserSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
```

Services use `safeParse` and throw typed errors on failure:

```ts
const result = createUserSchema.safeParse(userData);
if (!result.success) {
	const messages = result.error.issues.map((i) => i.message);
	throw new ValidationError(`Validation failed: ${messages.join(', ')}`);
}
```

Interfaces alias DTOs to the inferred types for consistency across layers:

```ts
// src/interfaces/user.interface.ts
export type CreateUserRequest = CreateUserRequestModel;
export type UpdateUserRequest = UpdateUserRequestModel;
```

Note: The previous `UserValidationService` has been removed; validation now happens directly in services using Zod schemas.

## ⚠️ Global Exception Handling

Comprehensive error handling system with custom error classes, global middleware, and structured logging.

### Architecture Components

- **Custom Error Classes** (`src/models/error.model.ts`) - Typed error definitions
- **Global Error Handler** (Hono `onError` middleware) - Centralized exception handling
- **Structured Logging** - Contextual error logging with appropriate log levels
- **Consistent Responses** - Standardized JSON error format

### Custom Error Classes

Type-safe error handling with automatic HTTP status mapping:

```typescript
// Available error classes (src/models/error.model.ts)
ValidationError     → HTTP 400
BadRequestError     → HTTP 400
UnauthorizedError   → HTTP 401
ForbiddenError      → HTTP 403
NotFoundError       → HTTP 404
ConflictError       → HTTP 409
InternalServerError → HTTP 500
```

**Usage in Services:**

```typescript
// Throw typed errors in your services
throw new ValidationError('Email is required');
throw new NotFoundError('User not found');
```

### Global Error Handler

Implemented as Hono `onError` middleware for centralized exception handling:

```typescript
// Global error handler (src/routes/api/[...paths]/+server.ts)
app.onError(async (error, c) => {
	const logger = getLogger(c);

	// Handle custom error classes with proper status codes
	if (error instanceof NotFoundError) {
		logger.warn('NotFoundError:', error.message);
		return c.json(createErrorResponse(error.message), 404);
	}

	// Fallback to errorNames mapping
	if (error.name && errorNames[error.name]) {
		const statusCode = errorNames[error.name];
		return c.json(createErrorResponse(error.message), statusCode);
	}

	// Unhandled errors
	logger.error('Unhandled error', error);
	return c.json(createErrorResponse('Internal server error'), 500);
});
```

### Response Format

All API responses follow a consistent structure:

```typescript
// Success response
{ success: true, data: any, message?: string, timestamp: string }

// Error response
{ success: false, error: string, timestamp: string }
```

### Implementation Examples

**In Services:**

```typescript
// src/services/user.service.ts
export class UserService {
	async getUserById(id: number): Promise<User | null> {
		const user = await this.userRepository.findById(id);
		if (!user) {
			throw new NotFoundError('User not found');
		}
		return user;
	}

	async createUser(userData: CreateUserRequest): Promise<User> {
		const parsed = createUserSchema.safeParse(userData);
		if (!parsed.success) {
			const errors = parsed.error.issues.map((i) => i.message);
			throw new ValidationError(`Validation failed: ${errors.join(', ')}`);
		}
		return await this.userRepository.create({ ...userData, createdAt: new Date() });
	}
}
```

**In API Routes:**

```typescript
// Routes just throw - global handler catches and formats
app.get('/users/:id', async (c): Promise<Response> => {
	const id = parseIntParam(c.req.param('id'));
	const userService = getUserService(c);

	if (id === null) {
		throw new BadRequestError('Invalid user ID'); // → 400 response
	}

	const user = await userService.getUserById(id); // May throw NotFoundError → 404

	return c.json({ success: true, data: user, timestamp: new Date().toISOString() });
});
```

### Logging Strategy

The error handler uses different log levels based on HTTP status codes:

- **Server Errors (500+)** - Logged as `error` level with full stack trace
- **Client Errors (400-499)** - Logged as `warn` level with error message
- **Legacy Validation Errors** - Handled for backward compatibility

### Testing Error Scenarios

**API Error Testing:**

```typescript
// tests/api/error-handling.test.ts
import { describe, expect, it } from 'vitest';
import { GET } from '../../routes/api/[...paths]/+server';

describe('Error Handling', () => {
	it('should return 400 for invalid user ID', async () => {
		const request = new Request('http://localhost/api/users/invalid');
		const response = await GET({ request } as RequestEvent);

		expect(response.status).toBe(400);

		const data = await response.json();
		expect(data).toEqual({
			success: false,
			error: 'Invalid user ID',
			timestamp: expect.any(String)
		});
	});

	it('should return 404 for non-existent user', async () => {
		const request = new Request('http://localhost/api/users/999');
		const response = await GET({ request } as RequestEvent);

		expect(response.status).toBe(404);

		const data = await response.json();
		expect(data.success).toBe(false);
		expect(data.error).toBe('User not found');
	});
});
```

**Service Error Testing:**

```typescript
// tests/services/user.service.test.ts
import { describe, expect, it } from 'vitest';
import { UserService } from '../../services/user.service';
import { BadRequestError, NotFoundError } from '../../models/error.model';

// Example sketch; adapt to your mocks
expect(async () => {
	await new UserService(/* ... */).getUserById(-1);
}).rejects.toThrow(BadRequestError);
```

### Best Practices

1. **Use Specific Error Classes** - Choose the most appropriate error type
2. **Provide Clear Messages** - Error messages should be user-friendly
3. **Log Appropriately** - Server errors need investigation, client errors are warnings
4. **Test Error Paths** - Ensure all error scenarios are covered in tests
5. **Document Error Responses** - API documentation should include error examples

### Creating New Error Types

To add a new error type:

1. **Define the Error Class:**

```typescript
// src/models/error.model.ts
export class RateLimitError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'RateLimitError';
	}
}
```

2. **Add to Error Mapping:**

```typescript
export const errorNames: Record<string, ContentfulStatusCode> = {
	// ... existing mappings
	[RateLimitError.name]: 429
};
```

3. **Use in Services:**

```typescript
if (requestCount > limit) {
	throw new RateLimitError('Rate limit exceeded');
}
```

The global error handler will automatically catch and handle the new error type.

## 🔧 Development Workflows

### Development Modes

**SvelteKit Development** (Recommended):

```bash
pnpm dev  # http://localhost:5173
```

- Fastest hot reload for UI development
- Full TypeScript checking and validation
- API routes work through SvelteKit dev server

**Cloudflare Workers Simulation**:

```bash
pnpm dev:cf  # http://localhost:8787
```

- Tests Cloudflare Workers environment locally
- Simulates edge runtime and Workers APIs
- Requires build step before running

### API Development

All API routes are handled by the Hono server in `src/routes/api/[...paths]/+server.ts`:

- `/api/health` - System health check
- `/api/hello` - API information
- `/api/users` - CRUD operations (demo with in-memory data)
- All endpoints include global error handling and structured logging

### Environment Configuration

**Client-side** (prefix with `PUBLIC_`):

- Accessible in browser code
- Configured in `src/lib/env.ts`

**Server-side** (Cloudflare Workers):

- Configured in `wrangler.toml`
- Available in API routes via `c.env`

## 🧪 Testing

This project includes comprehensive testing for both Hono API endpoints and Svelte components using Vitest and Testing Library.

> 📘 **For comprehensive testing guide, patterns, and examples, see [TESTING.md](./TESTING.md)**
>
> The TESTING.md guide includes:
>
> - Complete testing strategies and conventions
> - Unit, integration, and component testing examples
> - Testing with Dependency Injection patterns
> - Mocking strategies and best practices
> - Coverage reports and CI/CD setup

### Running Tests

```bash
# Run all tests
pnpm test:run

# Run tests in watch mode
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage report
pnpm test:coverage

# Run specific test files
pnpm test:run src/tests/components/
pnpm test:run src/tests/api/
```

### Test Structure

```
src/tests/
├── setup.ts              # Global test setup
├── utils.ts               # Test utilities and mocks
├── api/
│   ├── server.test.ts     # Basic API endpoint tests
│   └── hono-advanced.test.ts  # Advanced API testing patterns
└── components/
    ├── UserCard.test.ts   # Component testing example
    └── UserForm.test.ts   # Form testing with validation
```

### API Testing (Hono)

The API tests cover all CRUD operations and advanced scenarios:

```typescript
// Basic API test example
import { describe, expect, it } from 'vitest';
import { GET } from '../../routes/api/[...paths]/+server';

describe('API Endpoints', () => {
	it('should return health status', async () => {
		const request = new Request('http://localhost/api/health');
		const response = await GET({ request } as RequestEvent);

		expect(response.status).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty('status', 'ok');
		expect(data).toHaveProperty('timestamp');
	});
});
```

**What's Tested:**

- ✅ GET/POST/PUT/DELETE operations
- ✅ Request/response validation
- ✅ Error handling and custom error classes
- ✅ Headers and CORS
- ✅ Query parameters and URL params
- ✅ JSON parsing and malformed data
- ✅ Concurrent requests and performance
- ✅ HTTP status code accuracy
- ✅ Error response format consistency

### Component Testing (Svelte)

Svelte components are tested using `@testing-library/svelte`:

```typescript
// Component test example
import { fireEvent } from '@testing-library/dom';
import { render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import MyComponent from '../../lib/components/MyComponent.svelte';

describe('MyComponent', () => {
	it('should render and handle click events', async () => {
		const onClick = vi.fn();
		const { getByTestId } = render(MyComponent, {
			title: 'Test Title',
			onClick
		});

		expect(getByTestId('title')).toHaveTextContent('Test Title');

		await fireEvent.click(getByTestId('button'));
		expect(onClick).toHaveBeenCalledOnce();
	});
});
```

**What's Tested:**

- ✅ Props rendering
- ✅ Event handling (clicks, form submissions)
- ✅ Form validation and error states
- ✅ Conditional rendering
- ✅ User interactions
- ✅ Component state changes

### Testing Utilities

The `src/tests/utils.ts` provides helpful utilities:

```typescript
// Mock API responses
import { MockAPI } from '../tests/utils';

MockAPI.mockSuccess({ users: [] });
MockAPI.mockError('Server error', 500);
MockAPI.reset(); // Clear all mocks
```

### Configuration

**Vite Config** (`vite.config.ts`):

```typescript
export default defineConfig(() => ({
	plugins: [tailwindcss(), sveltekit(), svelteTesting()], // ← Key plugin
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: ['src/routes/**/*'], // Exclude route files
		environment: 'jsdom',
		setupFiles: ['./src/tests/setup.ts'],
		globals: true,
		coverage: {
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', 'src/routes/**/*']
		}
	}
}));
```

**Setup File** (`src/tests/setup.ts`):

```typescript
import '@testing-library/jest-dom/vitest';
import { beforeEach, vi } from 'vitest';

// Mock fetch globally for API tests
global.fetch = vi.fn();

// Global test setup
beforeEach(() => {
	vi.clearAllMocks();
});
```

### Best Practices

1. **Use data-testid attributes** for reliable element selection:

   ```svelte
   <button data-testid="submit-button">Submit</button>
   ```

2. **Test user behavior, not implementation**:

   ```typescript
   // Good: Test what user sees/does
   expect(getByText('Welcome')).toBeInTheDocument();
   await fireEvent.click(getByTestId('login-button'));

   // Avoid: Testing internal state directly
   ```

3. **Mock external dependencies**:

   ```typescript
   // Mock API calls
   MockAPI.mockSuccess({ data: 'test' });
   MockAPI.mockError('Server error', 500);

   // Mock functions
   const onClick = vi.fn();

   // Mock service errors
   mockUserService.getUserById.mockRejectedValue(new NotFoundError('User not found'));
   ```

4. **Use descriptive test names**:

   ```typescript
   it('should display error message when email is invalid');
   it('should call onSubmit with form data when form is valid');
   ```

5. **Wait for async operations**:

   ```typescript
   await fireEvent.click(button);
   await tick(); // For Svelte reactivity
   ```

### Coverage Reports

After running `pnpm test:coverage`, view the coverage report:

- **Terminal**: Immediate summary in console
- **HTML Report**: Open `coverage/index.html` in browser
- **JSON Report**: `coverage/coverage-final.json` for CI/CD

**Coverage Targets:**

- Statements: > 80%
- Branches: > 80%
- Functions: > 80%
- Lines: > 80%

### Debugging Tests

1. **Use `screen.debug()`** to inspect DOM:

   ```typescript
   import { screen } from '@testing-library/dom';
   screen.debug(); // Logs current DOM state
   ```

2. **Check mock calls**:

   ```typescript
   console.log(mockFunction.mock.calls);
   ```

3. **Run single test file**:

   ```bash
   pnpm test:run src/tests/components/MyComponent.test.ts
   ```

4. **Use Vitest UI** for interactive debugging:

   ```bash
   pnpm test:ui
   ```

### Continuous Integration

Tests are designed to run in CI environments:

```yaml
# Example GitHub Actions step
- name: Run tests
  run: pnpm test:run

- name: Run tests with coverage
  run: pnpm test:coverage
```

## 🏗️ Dependency Injection Architecture

**InversifyJS**-powered dependency injection system following SOLID principles for clean, testable architecture.

### Core Components

- **Container** (`src/container/`) - IoC container configuration
- **Interfaces** (`src/interfaces/`) - Service contracts and types
- **Services** (`src/services/`) - Business logic implementations
- **Resolvers** (`src/container/resolvers.ts`) - Helper functions for service resolution

### Container Setup

**Service Registration** (`src/container/inversify.config.ts`):

```typescript
import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';

const container = new Container();

// Bind services with appropriate scopes
container.bind<IUserService>(TYPES.UserService).to(UserService); // Transient
container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository).inSingletonScope();
container.bind<ILogger>(TYPES.Logger).to(Logger).inSingletonScope();
```

**Service Resolution** (`src/container/resolvers.ts`):

```typescript
export const getUserService = (c: Context) => getService<IUserService>(c, TYPES.UserService);

export const getLogger = (c: Context) => getService<ILogger>(c, TYPES.Logger);
```

### Service Architecture

#### Domain Services

| Service          | Purpose                       | Scope     |
| ---------------- | ----------------------------- | --------- |
| `UserService`    | Business logic orchestration  | Transient |
| `UserRepository` | Data access layer (in-memory) | Singleton |

#### Infrastructure Services

| Service         | Purpose                         | Scope     |
| --------------- | ------------------------------- | --------- |
| `Logger`        | Structured logging with context | Singleton |
| `ConfigService` | Environment configuration       | Singleton |

### Creating New Services

#### 1. Define Interface

Create interface in `src/interfaces/`:

```typescript
// src/interfaces/email.interface.ts
export interface IEmailService {
	sendWelcomeEmail(email: string, name: string): Promise<void>;
	sendNotification(email: string, message: string): Promise<void>;
}
```

#### 2. Implement Service

Create implementation in `src/services/`:

```typescript
// src/services/email.service.ts
import { injectable, inject } from 'inversify';
import type { IEmailService } from '../interfaces/email.interface';
import type { ILogger } from '../interfaces/logger.interface';
import { TYPES } from '../container/types';

@injectable()
export class EmailService implements IEmailService {
	constructor(@inject(TYPES.Logger) private readonly logger: ILogger) {}

	async sendWelcomeEmail(email: string, name: string): Promise<void> {
		this.logger.info('Sending welcome email', { email, name });
		// Implementation here
	}

	async sendNotification(email: string, message: string): Promise<void> {
		this.logger.info('Sending notification', { email });
		// Implementation here
	}
}
```

#### 3. Register in Container

Add to `src/container/types.ts`:

```typescript
export const TYPES = {
	// ... existing types
	EmailService: Symbol.for('EmailService')
} as const;
```

Add to `src/container/inversify.config.ts`:

```typescript
import { EmailService } from '../services/email.service';
import type { IEmailService } from '../interfaces/email.interface';

// Bind services
container.bind<IEmailService>(TYPES.EmailService).to(EmailService);
```

#### 4. Create Resolver

Add to `src/container/resolvers.ts`:

```typescript
export const getEmailService = (c: Context) => {
	return getService<IEmailService>(c, TYPES.EmailService);
};
```

#### 5. Use in API Routes

```typescript
import { getEmailService } from '../container/resolvers';

app.post('/users', async (c) => {
	const emailService = getEmailService(c);
	const userService = getUserService(c);

	const user = await userService.createUser(userData);
	await emailService.sendWelcomeEmail(user.email, user.name);

	return c.json({ success: true, data: user });
});
```

### Testing with DI

#### Mocking Services in Tests

```typescript
// tests/api/user-endpoints.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Container } from 'inversify';
import type { IUserService } from '../../interfaces/user.interface';

describe('User API with Mocked Services', () => {
	let mockContainer: Container;
	let mockUserService: IUserService;

	beforeEach(() => {
		// Create mock service
		mockUserService = {
			getAllUsers: vi.fn(),
			getUserById: vi.fn(),
			createUser: vi.fn(),
			updateUser: vi.fn(),
			deleteUser: vi.fn()
		};

		// Create test container
		mockContainer = new Container();
		mockContainer.bind(TYPES.UserService).toConstantValue(mockUserService);
	});

	it('should return users from service', async () => {
		const mockUsers = [{ id: 1, name: 'Test User' }];
		vi.mocked(mockUserService.getAllUsers).mockResolvedValue(mockUsers);

		// Test implementation
		const request = new Request('http://localhost/api/users');
		const response = await GET({ request, c: { container: mockContainer } });

		expect(response.status).toBe(200);
		expect(mockUserService.getAllUsers).toHaveBeenCalled();
	});
});
```

#### Service Unit Tests

```typescript
// tests/services/user.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../../services/user.service';
import type { IUserRepository, IUserValidationService } from '../../interfaces/user.interface';

describe('UserService', () => {
	let userService: UserService;
	let mockRepository: IUserRepository;
	let mockValidator: IUserValidationService;
	let mockLogger: ILogger;

	beforeEach(() => {
		mockRepository = {
			/* mock methods */
		};
		mockValidator = {
			/* mock methods */
		};
		mockLogger = {
			/* mock methods */
		};

		userService = new UserService(mockRepository, mockValidator, mockLogger);
	});

	it('should create user when validation passes', async () => {
		// Arrange
		const userData = { name: 'John', email: 'john@example.com' };
		vi.mocked(mockValidator.validateCreateUser).mockReturnValue({
			isValid: true,
			errors: []
		});
		vi.mocked(mockRepository.create).mockResolvedValue({
			id: 1,
			...userData,
			createdAt: new Date()
		});

		// Act
		const result = await userService.createUser(userData);

		// Assert
		expect(result).toHaveProperty('id', 1);
		expect(mockValidator.validateCreateUser).toHaveBeenCalledWith(userData);
		expect(mockRepository.create).toHaveBeenCalled();
	});
});
```

#### Comprehensive Testing Patterns

##### Testing API Services with Mocks

```typescript
// tests/services/user-api.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserApiService } from '../../services/client/api.service';
import type { IHttpClient } from '../../interfaces/http-client.interface';

describe('UserApiService', () => {
	let userApiService: UserApiService;
	let mockHttpClient: IHttpClient;

	beforeEach(() => {
		// Create mock HTTP client
		mockHttpClient = {
			get: vi.fn(),
			post: vi.fn(),
			put: vi.fn(),
			patch: vi.fn(),
			delete: vi.fn()
		};

		// Create service with mock
		userApiService = new UserApiService(mockHttpClient);
	});

	it('should fetch all users', async () => {
		const mockUsers = [
			{ id: 1, name: 'John', email: 'john@example.com' },
			{ id: 2, name: 'Jane', email: 'jane@example.com' }
		];

		vi.mocked(mockHttpClient.get).mockResolvedValue({
			data: mockUsers
		});

		const result = await userApiService.getAllUsers();

		expect(result).toEqual(mockUsers);
		expect(mockHttpClient.get).toHaveBeenCalledWith('/api/users');
	});

	it('should create a user', async () => {
		const userData = { name: 'Bob', email: 'bob@example.com' };
		const mockResponse = { data: { id: 3, ...userData } };

		vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse);

		const result = await userApiService.createUser(userData);

		expect(result).toEqual({ id: 3, ...userData });
		expect(mockHttpClient.post).toHaveBeenCalledWith('/api/users', userData);
	});

	it('should throw error when create fails', async () => {
		vi.mocked(mockHttpClient.post).mockResolvedValue({ data: null });

		await expect(
			userApiService.createUser({ name: 'Test', email: 'test@example.com' })
		).rejects.toThrow('Failed to create user');
	});

	it('should delete a user', async () => {
		vi.mocked(mockHttpClient.delete).mockResolvedValue({});

		await userApiService.deleteUser(1);

		expect(mockHttpClient.delete).toHaveBeenCalledWith('/api/users/1');
	});
});
```

##### Using Mock Factory Functions

```typescript
// tests/components/user-operations.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createMockUserApi } from '../mocks/api.mock';

describe('User Operations with Mocks', () => {
	it('should use default mock behavior', async () => {
		const mockApi = createMockUserApi();

		const users = await mockApi.getAllUsers();

		expect(users).toHaveLength(3);
		expect(users[0].name).toBe('John Doe');
	});

	it('should override specific methods', async () => {
		const mockApi = createMockUserApi({
			getAllUsers: vi
				.fn()
				.mockResolvedValue([{ id: 999, name: 'Custom User', email: 'custom@example.com' }])
		});

		const users = await mockApi.getAllUsers();

		expect(users).toHaveLength(1);
		expect(users[0].name).toBe('Custom User');
	});

	it('should simulate API errors', async () => {
		const mockApi = createMockUserApi({
			createUser: vi.fn().mockRejectedValue(new Error('Network error'))
		});

		await expect(mockApi.createUser({ name: 'Test', email: 'test@example.com' })).rejects.toThrow(
			'Network error'
		);
	});

	it('should track method calls', async () => {
		const getAllUsersMock = vi.fn().mockResolvedValue([]);
		const mockApi = createMockUserApi({
			getAllUsers: getAllUsersMock
		});

		await mockApi.getAllUsers();
		await mockApi.getAllUsers();

		expect(getAllUsersMock).toHaveBeenCalledTimes(2);
	});
});
```

##### Integration Testing with Test Containers

```typescript
// tests/integration/user-workflow.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from 'inversify';
import { TYPES } from '../../container/types';
import { MockUserApiService } from '../mocks/api.mock';
import type { IUserApiService } from '../../interfaces/api.interface';

describe('User Workflow Integration Test', () => {
	let testContainer: Container;
	let userApi: IUserApiService;

	beforeEach(() => {
		// Create fresh container for each test
		testContainer = new Container();

		// Bind mock service
		const mockService = new MockUserApiService();
		testContainer.bind<IUserApiService>(TYPES.UserApiService).toConstantValue(mockService);

		// Resolve service
		userApi = testContainer.get<IUserApiService>(TYPES.UserApiService);
	});

	it('should complete full user lifecycle', async () => {
		// Create user
		const newUser = await userApi.createUser({
			name: 'Integration Test User',
			email: 'integration@example.com'
		});
		expect(newUser).toHaveProperty('id');

		// Fetch all users
		let users = await userApi.getAllUsers();
		expect(users).toContainEqual(
			expect.objectContaining({
				name: 'Integration Test User'
			})
		);

		// Update user
		const updated = await userApi.updateUser(newUser.id, {
			name: 'Updated Name'
		});
		expect(updated.name).toBe('Updated Name');

		// Delete user
		await userApi.deleteUser(newUser.id);
		users = await userApi.getAllUsers();
		expect(users).not.toContainEqual(
			expect.objectContaining({
				id: newUser.id
			})
		);
	});

	it('should handle concurrent operations', async () => {
		const operations = [
			userApi.createUser({ name: 'User 1', email: 'user1@example.com' }),
			userApi.createUser({ name: 'User 2', email: 'user2@example.com' }),
			userApi.createUser({ name: 'User 3', email: 'user3@example.com' })
		];

		const results = await Promise.all(operations);

		expect(results).toHaveLength(3);
		results.forEach((user) => {
			expect(user).toHaveProperty('id');
			expect(user).toHaveProperty('name');
		});
	});
});
```

#### Testing Best Practices for DI

##### 1. Isolate Tests with Fresh Containers

```typescript
describe('Service Tests', () => {
	let container: Container;

	beforeEach(() => {
		// Create new container for each test
		container = new Container();
		// Bind services...
	});

	afterEach(() => {
		// Clean up if needed
		container.unbindAll();
	});
});
```

##### 2. Use Descriptive Mock Names

```typescript
// ✅ Good
const mockUserApiWithError = createMockUserApi({
	getAllUsers: vi.fn().mockRejectedValue(new Error('Network timeout'))
});

// ❌ Bad
const mock1 = createMockUserApi({
	getAllUsers: vi.fn().mockRejectedValue(new Error('Network timeout'))
});
```

##### 3. Test Edge Cases

```typescript
it('should handle empty user list', async () => {
	const mockApi = createMockUserApi({
		getAllUsers: vi.fn().mockResolvedValue([])
	});

	const users = await mockApi.getAllUsers();
	expect(users).toEqual([]);
});

it('should handle user not found', async () => {
	const mockApi = createMockUserApi({
		getUserById: vi.fn().mockRejectedValue(new Error('User with ID 999 not found'))
	});

	await expect(mockApi.getUserById(999)).rejects.toThrow('User with ID 999 not found');
});
```

##### 4. Verify Mock Interactions

```typescript
it('should call API with correct parameters', async () => {
	const createUserMock = vi.fn().mockResolvedValue({
		id: 1,
		name: 'Test',
		email: 'test@example.com'
	});

	const mockApi = createMockUserApi({
		createUser: createUserMock
	});

	const userData = { name: 'Test', email: 'test@example.com' };
	await mockApi.createUser(userData);

	expect(createUserMock).toHaveBeenCalledWith(userData);
	expect(createUserMock).toHaveBeenCalledTimes(1);
});
```

##### 5. Test Async Behavior

```typescript
it('should handle delayed responses', async () => {
	const mockApi = createMockUserApi({
		getAllUsers: vi
			.fn()
			.mockImplementation(
				() =>
					new Promise((resolve) =>
						setTimeout(
							() => resolve([{ id: 1, name: 'Delayed User', email: 'delayed@example.com' }]),
							100
						)
					)
			)
	});

	const startTime = Date.now();
	const users = await mockApi.getAllUsers();
	const endTime = Date.now();

	expect(endTime - startTime).toBeGreaterThanOrEqual(100);
	expect(users).toHaveLength(1);
});
```

#### Common Testing Patterns

##### Pattern 1: Arrange-Act-Assert (AAA)

```typescript
it('should follow AAA pattern', async () => {
	// Arrange
	const mockApi = createMockUserApi();
	const userData = { name: 'AAA User', email: 'aaa@example.com' };

	// Act
	const result = await mockApi.createUser(userData);

	// Assert
	expect(result).toMatchObject(userData);
	expect(result.id).toBeDefined();
});
```

##### Pattern 2: Setup-Exercise-Verify (SEV)

```typescript
it('should follow SEV pattern', async () => {
	// Setup
	const deleteMock = vi.fn().mockResolvedValue(undefined);
	const mockApi = createMockUserApi({ deleteUser: deleteMock });

	// Exercise
	await mockApi.deleteUser(1);
	await mockApi.deleteUser(2);

	// Verify
	expect(deleteMock).toHaveBeenCalledTimes(2);
	expect(deleteMock).toHaveBeenNthCalledWith(1, 1);
	expect(deleteMock).toHaveBeenNthCalledWith(2, 2);
});
```

##### Pattern 3: Given-When-Then (GWT)

```typescript
it('should delete user successfully', async () => {
	// Given a mock API service
	const mockApi = createMockUserApi();

	// And a user exists
	const user = await mockApi.createUser({
		name: 'To Delete',
		email: 'delete@example.com'
	});

	// When I delete the user
	await mockApi.deleteUser(user.id);

	// Then the user should not exist
	await expect(mockApi.getUserById(user.id)).rejects.toThrow('not found');
});
```

### Best Practices

#### 1. Interface Design

- Keep interfaces focused and cohesive
- Use descriptive method names
- Return appropriate types (avoid `any`)

#### 2. Service Implementation

- Use `@injectable()` decorator on all services
- Use `@inject()` for all dependencies
- Follow single responsibility principle

#### 3. Dependency Management

- Use constructor injection
- Prefer interfaces over concrete types
- Configure appropriate scopes (singleton vs transient)

#### 4. Error Handling

```typescript
@injectable()
export class UserService implements IUserService {
	async createUser(userData: CreateUserRequest): Promise<User> {
		try {
			// Validation
			const validation = this.validationService.validateCreateUser(userData);
			if (!validation.isValid) {
				const error = new Error(`Validation failed: ${validation.errors.join(', ')}`);
				this.logger.error('User creation failed', error, { userData });
				throw error;
			}

			// Business logic
			const user = await this.userRepository.create(userData);
			this.logger.info('User created successfully', { userId: user.id });

			return user;
		} catch (error) {
			this.logger.error('Failed to create user', error as Error, { userData });
			throw error;
		}
	}
}
```

#### 5. Configuration and Environment

```typescript
@injectable()
export class ConfigService implements IConfigService {
	getAppConfig(): IAppConfig {
		return {
			port: parseInt(this.getEnv('PORT', '3000')),
			environment: this.getEnv('NODE_ENV', 'development'),
			apiVersion: this.getEnv('API_VERSION', '1.0.0')
		};
	}

	private getEnv(key: string, defaultValue: string): string {
		// Safe environment variable access for edge runtimes
		return process.env[key] ?? defaultValue;
	}
}
```

### Debugging DI Issues

#### Common Problems

1. **Service not found**
   - Check if service is registered in container
   - Verify TYPES symbol is correct
   - Ensure `@injectable()` decorator is present

2. **Circular dependencies**
   - Review service dependencies
   - Consider using factory pattern
   - Split services into smaller units

3. **Scope issues**
   - Understand singleton vs transient scopes
   - Use appropriate scope for service type
   - Avoid state in transient services

#### Debug Techniques

```typescript
// Add logging to container resolution
export const getService = <T>(c: Context, serviceType: symbol): T => {
	const diContainer = c.get('container');
	console.log(`Resolving service: ${serviceType.toString()}`);

	try {
		const service = diContainer.get<T>(serviceType);
		console.log(`Service resolved successfully: ${serviceType.toString()}`);
		return service;
	} catch (error) {
		console.error(`Failed to resolve service: ${serviceType.toString()}`, error);
		throw error;
	}
};
```

---

## 🎨 Client-Side Dependency Injection (Svelte Components)

In addition to server-side DI, this project implements a comprehensive client-side dependency injection system for Svelte components using InversifyJS.

### Why Client-Side DI?

- **Testability** - Easily mock API services for component testing
- **Reusability** - Share services across multiple components
- **Maintainability** - Centralized API logic and configuration
- **Type Safety** - Full TypeScript support with IntelliSense
- **Separation of Concerns** - Components don't know about HTTP implementation details

### Architecture Overview

```
┌─────────────────────────────────────────┐
│      Svelte Components (Browser)        │
│   Use hooks: useUserApi(), useApi()     │
└──────────────────┬──────────────────────┘
                   │ resolves from
                   ↓
┌─────────────────────────────────────────┐
│      Client-Side DI Container           │
│   (API services, HTTP client)           │
└──────────────────┬──────────────────────┘
                   │ uses
                   ↓
┌─────────────────────────────────────────┐
│          HTTP Client Service            │
│     (Fetch API wrapper)                 │
└──────────────────┬──────────────────────┘
                   │ calls
                   ↓
┌─────────────────────────────────────────┐
│         Hono API Endpoints              │
└─────────────────────────────────────────┘
```

### Quick Start

#### 1. Using Services in Components

The easiest way is to use the pre-built service hooks:

```svelte
<script lang="ts">
	import { useUserApi } from '$lib/di/context.svelte';
	import { onMount } from 'svelte';

	// Inject the User API service
	const userApi = useUserApi();

	let users = $state([]);

	onMount(async () => {
		users = await userApi.getAllUsers();
	});

	const createUser = async (name: string, email: string) => {
		const newUser = await userApi.createUser({ name, email });
		users = [...users, newUser];
	};
</script>

<h1>Users: {users.length}</h1>
{#each users as user}
	<div>{user.name} - {user.email}</div>
{/each}
```

#### 2. Available Service Hooks

```typescript
import {
	useUserApi, // User CRUD operations
	useHealthApi, // Health check
	useHelloApi, // Hello endpoint
	useApi // All services combined (Facade)
} from '$lib/di/context.svelte';
```

#### 3. Using the Combined API Service

If your component needs multiple services, use the facade:

```svelte
<script lang="ts">
	import { useApi } from '$lib/di/context.svelte';

	const api = useApi();

	// Access all services through one object
	const users = await api.users.getAllUsers();
	const health = await api.health.checkHealth();
	const hello = await api.hello.getHello();
</script>
```

### Client-Side Service Layer

#### HTTP Client Service

The HTTP client wraps the Fetch API with:

- Automatic base URL configuration
- JSON serialization/deserialization
- Error handling with `HttpError` class
- Request/response interceptors

```typescript
// src/services/client/http-client.service.ts
@injectable()
export class HttpClient implements IHttpClient {
	async get<T>(url: string, config?: RequestConfig): Promise<T> {
		return this.request<T>('GET', url, undefined, config);
	}

	async post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
		return this.request<T>('POST', url, data, config);
	}

	// ... other methods
}
```

#### API Services

**User API Service:**

```typescript
@injectable()
export class UserApiService implements IUserApiService {
	constructor(@inject(TYPES.HttpClient) private readonly httpClient: IHttpClient) {}

	async getAllUsers(): Promise<User[]> {
		const response = await this.httpClient.get<ApiResponse<User[]>>('/api/users');
		return response.data || [];
	}

	async createUser(userData: { name: string; email: string }): Promise<User> {
		const response = await this.httpClient.post<ApiResponse<User>>('/api/users', userData);
		if (!response.data) throw new Error('Failed to create user');
		return response.data;
	}
}
```

### Usage Patterns

#### Pattern 1: Individual Service Hooks

Best for components that need one specific service:

```svelte
<script lang="ts">
	import { useUserApi } from '$lib/di/context.svelte';

	const userApi = useUserApi();

	const loadUsers = async () => {
		return await userApi.getAllUsers();
	};
</script>
```

#### Pattern 2: Combined API Service (Facade)

Best for components that need multiple API services:

```svelte
<script lang="ts">
	import { useApi } from '$lib/di/context.svelte';

	const api = useApi();

	const loadData = async () => {
		const users = await api.users.getAllUsers();
		const health = await api.health.checkHealth();
		const hello = await api.hello.getHello();
	};
</script>
```

#### Pattern 3: Component-Level DI

Best for self-contained reusable components:

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

### API Methods Reference

#### User API Service

```typescript
const userApi = useUserApi();

// Get all users
const users = await userApi.getAllUsers();
// Returns: User[]

// Get single user
const user = await userApi.getUserById(1);
// Returns: User

// Create user
const newUser = await userApi.createUser({
	name: 'John Doe',
	email: 'john@example.com'
});
// Returns: User

// Update user
const updated = await userApi.updateUser(1, { name: 'Jane Doe' });
// Returns: User

// Delete user
await userApi.deleteUser(1);
// Returns: void
```

#### Health API Service

```typescript
const healthApi = useHealthApi();

const status = await healthApi.checkHealth();
// Returns: { status: string, environment: string, timestamp: string }
```

#### Hello API Service

```typescript
const helloApi = useHelloApi();

const response = await helloApi.getHello();
// Returns: { message: string, timestamp?: string, environment?: string }
```

### Error Handling

Always wrap service calls in try-catch:

```svelte
<script lang="ts">
	import { useUserApi } from '$lib/di/context.svelte';

	const userApi = useUserApi();
	let error = $state<string | null>(null);

	const loadUsers = async () => {
		error = null;
		try {
			return await userApi.getAllUsers();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error';
			console.error('Failed to load users:', err);
			return [];
		}
	};
</script>

{#if error}
	<div class="error">{error}</div>
{/if}
```

### Testing Components with Client-Side DI

#### Setting Up Test Container

```typescript
// tests/components/UserList.test.ts
import { render, screen, waitFor } from '@testing-library/svelte';
import { Container } from 'inversify';
import { TYPES } from '$container/types';
import TestWrapper from '$tests/helpers/TestWrapper.svelte';
import { createMockUserApi } from '$tests/mocks/api.mock';
import UserList from '$ui/components/UserList.svelte';

describe('UserList Component', () => {
	it('should load and display users', async () => {
		// Create test container
		const testContainer = new Container();

		// Create mock service
		const mockUserApi = createMockUserApi({
			getAllUsers: vi
				.fn()
				.mockResolvedValue([{ id: 1, name: 'Test User', email: 'test@example.com' }])
		});

		// Bind mock to container
		testContainer.bind(TYPES.UserApiService).toConstantValue(mockUserApi);

		// Render with test container
		render(TestWrapper, {
			props: {
				container: testContainer,
				component: UserList
			}
		});

		// Assert
		await waitFor(() => {
			expect(screen.getByText('Test User')).toBeInTheDocument();
		});
	});
});
```

#### Mock Service Factory

```typescript
// tests/mocks/api.mock.ts
export class MockUserApiService implements IUserApiService {
	private users: User[] = [
		{ id: 1, name: 'John Doe', email: 'john@example.com' },
		{ id: 2, name: 'Jane Smith', email: 'jane@example.com' }
	];

	async getAllUsers(): Promise<User[]> {
		return Promise.resolve([...this.users]);
	}

	async createUser(userData: { name: string; email: string }): Promise<User> {
		const newUser: User = {
			id: this.users.length + 1,
			...userData
		};
		this.users.push(newUser);
		return Promise.resolve(newUser);
	}

	// ... other methods
}

export function createMockUserApi(overrides?: Partial<IUserApiService>): IUserApiService {
	const mock = new MockUserApiService();
	if (!overrides) return mock;
	return Object.assign(mock, overrides);
}
```

### Adding New Client-Side Services

#### Step 1: Define Interface

```typescript
// src/interfaces/notification.interface.ts
export interface INotificationService {
	success(message: string): void;
	error(message: string): void;
	info(message: string): void;
}
```

#### Step 2: Implement Service

```typescript
// src/services/client/notification.service.ts
import { injectable } from 'inversify';

@injectable()
export class NotificationService implements INotificationService {
	success(message: string): void {
		// Implementation (e.g., toast notification)
	}

	error(message: string): void {
		// Implementation
	}

	info(message: string): void {
		// Implementation
	}
}
```

#### Step 3: Add Type Identifier

```typescript
// src/container/types.ts
export const TYPES = {
	// ... existing types
	NotificationService: Symbol.for('NotificationService')
};
```

#### Step 4: Register in Client Container

```typescript
// src/container/client/inversify.config.client.ts
import { NotificationService } from '../../services/client/notification.service';

clientContainer
	.bind<INotificationService>(TYPES.NotificationService)
	.to(NotificationService)
	.inSingletonScope();
```

#### Step 5: Create Hook

```typescript
// src/lib/di/context.svelte.ts
export function useNotifications(): INotificationService {
	return getService<INotificationService>(TYPES.NotificationService);
}
```

#### Step 6: Use in Components

```svelte
<script lang="ts">
	import { useNotifications } from '$lib/di/context.svelte';

	const notifications = useNotifications();

	const handleSuccess = () => {
		notifications.success('Operation completed!');
	};
</script>
```

### Best Practices for Client-Side DI

#### 1. Always Initialize in Root Layout

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { initializeDI } from '$lib/di/context.svelte';

	// Initialize once at the root
	initializeDI();
</script>
```

❌ **Don't** initialize in child components

#### 2. Use Appropriate Service Granularity

✅ **Good** - Use specific service for focused components:

```typescript
const userApi = useUserApi();
```

✅ **Good** - Use facade for components needing multiple services:

```typescript
const api = useApi();
```

❌ **Bad** - Don't inject unused services:

```typescript
const api = useApi(); // Then only use api.users
```

#### 3. Handle Errors Gracefully

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

#### 4. Keep Services Stateless

Services should be stateless and reusable. Store state in components:

✅ **Good** - Stateless service:

```typescript
class UserApiService {
	async getAllUsers() {
		/* ... */
	}
}
```

❌ **Bad** - Stateful service:

```typescript
class UserApiService {
	private cachedUsers: User[] = []; // Don't do this
	async getAllUsers() {
		/* ... */
	}
}
```

#### 5. Depend on Interfaces

✅ **Good** - Depend on interface:

```typescript
import type { IUserApiService } from '$interfaces/api.interface';
const userApi = useUserApi(); // Returns IUserApiService
```

❌ **Bad** - Depend on implementation:

```typescript
import { UserApiService } from '$services/client/api.service';
const userApi = new UserApiService(); // Don't do this
```

### Live Examples

Visit `/di-example` route to see all patterns in action:

```
http://localhost:5173/di-example
```

The example page includes:

- Pattern 1: Individual service hooks
- Pattern 2: Combined API service (Facade)
- Pattern 3: Component-level DI
- Benefits overview
- Code examples

### Troubleshooting Client-Side DI

#### "DI Container not found in context"

**Cause**: DI not initialized or accessing before initialization

**Solution**: Ensure `initializeDI()` is called in root layout (`+layout.svelte`)

#### "No matching bindings found"

**Cause**: Service not registered in client container

**Solution**: Add binding to `src/container/client/inversify.config.client.ts`

#### Type errors with services

**Cause**: Interface mismatch or missing interface

**Solution**: Ensure service implementation matches interface exactly

### Key Differences: Server vs Client DI

| Aspect             | Server-Side DI                      | Client-Side DI                                    |
| ------------------ | ----------------------------------- | ------------------------------------------------- |
| **Location**       | `src/container/inversify.config.ts` | `src/container/client/inversify.config.client.ts` |
| **Usage**          | Hono API routes                     | Svelte components                                 |
| **Services**       | Business logic, repositories        | HTTP client, API services                         |
| **Initialization** | Per request (Hono middleware)       | Once at app root (`+layout.svelte`)               |
| **Resolution**     | `getService(c, TYPES.Service)`      | `useService()` hooks                              |
| **Environment**    | Edge/Node.js                        | Browser                                           |

## 📦 Building and Deployment

### Local Preview

1. **Build the application:**

   ```bash
   pnpm build
   ```

2. **Preview locally:**

   ```bash
   # SvelteKit preview
   pnpm preview

   # Or Cloudflare Workers preview
   pnpm preview:wrangler
   ```

### Cloudflare Deployment

1. **Login to Cloudflare:**

   ```bash
   wrangler login
   ```

2. **Deploy to development:**

   ```bash
   pnpm deploy
   ```

3. **Deploy to production:**
   ```bash
   pnpm deploy:production
   ```

### Deployment Configuration

The app is configured for **Cloudflare Pages** deployment with:

- Static assets served from Cloudflare's edge
- API routes handled by Cloudflare Workers
- Automatic HTTPS and global CDN

## 🏗️ Project Structure

```
src/
├── routes/
│   ├── +page.svelte          # Main page with API demos
│   ├── +page.ts              # Page configuration
│   ├── +layout.svelte        # Layout component
│   └── api/
│       └── [...paths]/
│           └── +server.ts     # Hono API server
├── container/                # Dependency Injection Container
│   ├── inversify.config.ts   # IoC container configuration
│   ├── types.ts              # Service type identifiers
│   └── resolvers.ts          # Service resolution helpers
├── interfaces/               # Service contracts
│   ├── user.interface.ts     # User domain interfaces
│   ├── logger.interface.ts   # Logging interfaces
│   └── config.interface.ts   # Configuration interfaces
├── services/                 # Service implementations
│   ├── user.service.ts       # User business logic
│   ├── user.repository.ts    # User data access
│   ├── user-validation.service.ts # User validation
│   ├── logger.service.ts     # Logging implementation
│   └── config.service.ts     # Configuration service
├── lib/
│   └── env.ts                # Environment configuration
├── types/
│   └── base.ts               # Base type definitions
├── tests/
│   ├── setup.ts              # Test configuration
│   ├── utils.ts              # Test utilities
│   ├── api/
│   │   ├── server.test.ts    # API endpoint tests
│   │   └── hono-advanced.test.ts # Advanced API tests
│   └── components/
│       ├── UserCard.test.ts  # Component tests
│       └── UserForm.test.ts  # Form validation tests
├── app.html                  # HTML template
└── app.css                   # Global styles

Configuration:
├── svelte.config.js          # SvelteKit configuration
├── wrangler.toml            # Cloudflare Workers config
├── vite.config.ts           # Vite configuration
├── package.json             # Dependencies and scripts
└── .env.example             # Environment variables template
```

## 🛠️ Available Scripts

| Command              | Description                         |
| -------------------- | ----------------------------------- |
| `pnpm dev`           | Start SvelteKit dev server          |
| `pnpm dev:cf`        | Build and run Wrangler dev server   |
| `pnpm build`         | Build for production                |
| `pnpm build:cf`      | Test build for Cloudflare (dry run) |
| `pnpm preview`       | Preview built app locally           |
| `pnpm preview:cf`    | Preview with Wrangler               |
| `pnpm test`          | Run tests in watch mode             |
| `pnpm test:run`      | Run all tests once                  |
| `pnpm test:ui`       | Run tests with interactive UI       |
| `pnpm test:coverage` | Run tests with coverage report      |
| `pnpm deploy`        | Deploy to Cloudflare                |
| `pnpm deploy:cf`     | Deploy to production environment    |
| `pnpm check`         | Run TypeScript type checking        |
| `pnpm lint`          | Run ESLint and Prettier checks      |
| `pnpm format`        | Format code with Prettier           |

## 🔍 Debugging

### Common Issues

1. **API routes not working in production:**
   - Check `wrangler.toml` configuration
   - Ensure all HTTP methods are exported in `+server.ts`

2. **Environment variables not accessible:**
   - Client-side vars must be prefixed with `PUBLIC_`
   - Server-side vars must be in `wrangler.toml`

3. **Build errors:**
   - Check TypeScript types
   - Ensure all imports are correct
   - Run `pnpm check` for type checking

4. **Test failures:**
   - Run `pnpm test:ui` for interactive debugging
   - Check mock configurations in `src/tests/setup.ts`
   - Verify component imports and data-testid attributes
   - Use `screen.debug()` to inspect DOM state
   - Test error scenarios with proper error class mocking
   - Verify HTTP status codes in API tests

### Development Tips

1. **Use standard SvelteKit dev** for most development
2. **Test with Wrangler** before deploying
3. **Check Cloudflare Workers docs** for platform-specific features
4. **Monitor Cloudflare Dashboard** for deployment status and logs

## 📚 Resources

- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Hono Documentation](https://hono.dev/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Svelte](https://testing-library.com/docs/svelte-testing-library/intro/)
- [Testing Library DOM](https://testing-library.com/docs/dom-testing-library/intro/)
