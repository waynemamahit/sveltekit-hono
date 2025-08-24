# Development Guide: SvelteKit + Hono + Cloudflare

This guide explains how to develop, preview, and deploy your SvelteKit + Hono application on Cloudflare Workers.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm installed
- Cloudflare account (for deployment)
- Wrangler CLI installed globally: `npm install -g wrangler`

### Development Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Copy environment configuration:**

   ```bash
   cp .env.example .env.local
   ```

3. **Start development server:**

   ```bash
   # Standard SvelteKit development (recommended for frontend dev)
   pnpm dev

   # Or with Cloudflare Workers simulation
   pnpm cf:dev
   ```

## 🔧 Development Workflows

### Local Development Options

1. **Standard SvelteKit Dev (Recommended for UI/Frontend work):**

   ```bash
   pnpm dev
   ```

   - Runs on `http://localhost:5173`
   - Fastest hot reload
   - Full TypeScript checking
   - API routes work through SvelteKit

2. **Cloudflare Workers Simulation (For testing CF-specific features):**

   ```bash
   pnpm cf:dev
   ```

   - Builds the app first
   - Runs with Wrangler dev server
   - Simulates Cloudflare Workers environment
   - Runs on `http://localhost:8787`

### API Development

The Hono API is located in `src/routes/api/[...paths]/+server.ts` and includes:

- **GET /api/health** - Health check endpoint
- **GET /api/hello** - Basic hello endpoint
- **GET /api/users** - List users (mock data)
- **POST /api/users** - Create user (mock)
- **PUT /api/users/:id** - Update user (mock)
- **DELETE /api/users/:id** - Delete user (mock)

### Environment Variables

1. **Client-side variables** (prefix with `PUBLIC_`):
   - Accessible in browser
   - Configure in `src/lib/env.ts`

2. **Server-side variables**:
   - Cloudflare Workers environment
   - Configure in `wrangler.toml`

## 🧪 Testing

This project includes comprehensive testing for both Hono API endpoints and Svelte components using Vitest and Testing Library.

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
- ✅ Error handling
- ✅ Headers and CORS
- ✅ Query parameters and URL params
- ✅ JSON parsing and malformed data
- ✅ Concurrent requests and performance

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

   // Mock functions
   const onClick = vi.fn();
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

## 🏗️ Dependency Injection Container

This project uses **InversifyJS** to implement a clean architecture with dependency injection, following SOLID principles for maintainable, testable code.

### Architecture Overview

The dependency injection system is organized into several key components:

- **Container** - IoC container configuration (`src/container/`)
- **Interfaces** - Service contracts (`src/interfaces/`)
- **Services** - Concrete implementations (`src/services/`)
- **Resolvers** - Helper functions for service resolution

### Container Configuration

#### Core Files

**`src/container/inversify.config.ts`** - Main container setup:
```typescript
import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';

const container = new Container();

// Bind services
container.bind<IUserService>(TYPES.UserService).to(UserService);
container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository).inSingletonScope();
// ... other bindings
```

**`src/container/types.ts`** - Service identifiers:
```typescript
export const TYPES = {
  UserService: Symbol.for('UserService'),
  UserRepository: Symbol.for('UserRepository'),
  Logger: Symbol.for('Logger'),
  // ... other types
} as const;
```

**`src/container/resolvers.ts`** - Service resolution helpers:
```typescript
export const getUserService = (c: Context) => {
  return getService<IUserService>(c, TYPES.UserService);
};

export const getLogger = (c: Context) => {
  return getService<ILogger>(c, TYPES.Logger);
};
```

### Service Architecture

#### User Domain Services

**UserService** - Business logic orchestration
- Coordinates between repository and validation
- Handles business rules and logging
- Scope: Transient (new instance per request)

**UserRepository** - Data access layer
- Manages user persistence (currently in-memory)
- Provides CRUD operations
- Scope: Singleton (shared instance)

**UserValidationService** - Input validation
- Validates create/update requests
- Returns structured validation results
- Scope: Transient

#### Infrastructure Services

**Logger** - Structured logging
- Context-aware logging with metadata
- JSON-formatted output for production
- Scope: Singleton

**ConfigService** - Configuration management
- Environment variable access
- Safe defaults for all environments
- Scope: Singleton

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
  constructor(
    @inject(TYPES.Logger) private readonly logger: ILogger
  ) {}

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
  EmailService: Symbol.for('EmailService'),
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
    mockRepository = { /* mock methods */ };
    mockValidator = { /* mock methods */ };
    mockLogger = { /* mock methods */ };
    
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
