# Testing Guide: SvelteKit + Hono + Cloudflare Workers

This guide provides comprehensive testing strategies, patterns, and examples for testing your SvelteKit + Hono application with Dependency Injection.

## Table of Contents

- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [Project Test Structure](#project-test-structure)
- [Testing Conventions](#testing-conventions)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [Component Testing](#component-testing)
- [E2E Testing with Playwright](#e2e-testing-with-playwright)
- [Testing with Dependency Injection](#testing-with-dependency-injection)
- [Mocking Strategies](#mocking-strategies)
- [Best Practices](#best-practices)
- [Running Tests](#running-tests)
- [Coverage Reports](#coverage-reports)
- [Continuous Integration](#continuous-integration)
- [Troubleshooting](#troubleshooting)

## Overview

### Testing Philosophy

Our testing strategy follows these principles:

1. **Test Behavior, Not Implementation** - Focus on what your code does, not how it does it
2. **Write Tests First** - Consider TDD for complex business logic
3. **Keep Tests Simple** - Tests should be easy to read and maintain
4. **Fast Feedback** - Tests should run quickly to encourage frequent execution
5. **Isolate Dependencies** - Use mocking and DI to test units in isolation

### Testing Pyramid

```
       /\
      /E2E\      ← Few, slow, expensive
     /------\
    /Integration\   ← Some, moderate speed
   /------------\
  /   Unit Tests  \  ← Many, fast, cheap
 /------------------\
```

## Testing Stack

| Tool                | Purpose                                |
| ------------------- | -------------------------------------- |
| **Vitest**          | Test runner and assertion library      |
| **Testing Library** | Component testing utilities            |
| **InversifyJS**     | Dependency injection for testable code |
| **Playwright**      | E2E testing framework                  |
| **MSW**             | API mocking (optional)                 |

### Installation

```bash
# Unit/Integration/Component Testing
pnpm add -D vitest @vitest/ui @testing-library/svelte @testing-library/jest-dom

# E2E Testing
pnpm add -D @playwright/test@1.56.1 @types/node@24.8.1
pnpm exec playwright install chromium
```

## Project Test Structure

```
src/
├── tests/
│   ├── unit/                    # Unit tests
│   │   ├── services/
│   │   │   ├── user.service.test.ts
│   │   │   └── health.service.test.ts
│   │   ├── validators/
│   │   │   └── user.validator.test.ts
│   │   └── utils/
│   │       └── helpers.test.ts
│   ├── integration/             # Integration tests
│   │   ├── api/
│   │   │   ├── user-endpoints.test.ts
│   │   │   └── health-endpoints.test.ts
│   │   └── workflows/
│   │       └── user-lifecycle.test.ts
│   ├── component/               # Component tests
│   │   ├── UserCard.test.ts
│   │   ├── UserForm.test.ts
│   │   └── UserList.test.ts
│   ├── mocks/                   # Reusable mocks
│   │   ├── api.mock.ts
│   │   ├── services.mock.ts
│   │   └── data.mock.ts
│   ├── fixtures/                # Test data
│   │   ├── users.fixture.ts
│   │   └── responses.fixture.ts
│   └── setup.ts                 # Global test setup
tests/
├── e2e/                       # E2E tests
│   ├── pages/                  # Page Object Models
│   │   └── HomePage.ts
│   ├── fixtures/               # Custom fixtures and helpers
│   │   ├── index.ts
│   │   └── api-helpers.ts
│   ├── homepage.spec.ts        # Homepage UI tests
│   ├── user-management.spec.ts
│   ├── api.spec.ts             # API endpoint tests
│   ├── navigation.spec.ts      # Navigation tests
│   └── README.md              # Quick reference guide
```

## Testing Conventions

### File Naming

- **Test files**: `*.test.ts` or `*.spec.ts`
- **Mock files**: `*.mock.ts`
- **Fixture files**: `*.fixture.ts`
- **Component tests**: Place near component or in `tests/component/`

### Naming Conventions

```typescript
describe('ServiceName', () => {
	describe('methodName', () => {
		it('should do something when condition', () => {
			// Test implementation
		});
	});
});
```

### Test Organization

```typescript
describe('UserService', () => {
	// Setup
	let service: UserService;
	let mockDependency: MockType;

	beforeEach(() => {
		// Fresh setup for each test
	});

	afterEach(() => {
		// Cleanup
	});

	// Group related tests
	describe('getUserById', () => {
		it('should return user when user exists', () => {});
		it('should throw error when user not found', () => {});
		it('should handle invalid ID format', () => {});
	});
});
```

## Unit Testing

### Service Unit Tests

```typescript
// tests/unit/services/user.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../../../services/user.service';
import type { IUserRepository } from '../../../interfaces/user.interface';

describe('UserService', () => {
	let userService: UserService;
	let mockRepository: IUserRepository;

	beforeEach(() => {
		// Create mock repository
		mockRepository = {
			findById: vi.fn(),
			findAll: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn()
		};

		// Inject mock into service
		userService = new UserService(mockRepository);
	});

	describe('getUserById', () => {
		it('should return user when found', async () => {
			const mockUser = { id: 1, name: 'John', email: 'john@example.com' };
			vi.mocked(mockRepository.findById).mockResolvedValue(mockUser);

			const result = await userService.getUserById(1);

			expect(result).toEqual(mockUser);
			expect(mockRepository.findById).toHaveBeenCalledWith(1);
		});

		it('should throw NotFoundError when user does not exist', async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null);

			await expect(userService.getUserById(999)).rejects.toThrow('User not found');
		});

		it('should throw ValidationError for invalid ID', async () => {
			await expect(userService.getUserById(-1)).rejects.toThrow('Invalid user ID');
		});
	});

	describe('createUser', () => {
		it('should create user with valid data', async () => {
			const userData = { name: 'Jane', email: 'jane@example.com' };
			const createdUser = { id: 2, ...userData, createdAt: new Date() };

			vi.mocked(mockRepository.create).mockResolvedValue(createdUser);

			const result = await userService.createUser(userData);

			expect(result).toEqual(createdUser);
			expect(mockRepository.create).toHaveBeenCalledWith(userData);
		});

		it('should throw ValidationError for invalid email', async () => {
			const invalidData = { name: 'Test', email: 'invalid-email' };

			await expect(userService.createUser(invalidData)).rejects.toThrow('Invalid email format');
		});

		it('should throw ConflictError for duplicate email', async () => {
			vi.mocked(mockRepository.create).mockRejectedValue(new Error('Email already exists'));

			await expect(
				userService.createUser({ name: 'Test', email: 'existing@example.com' })
			).rejects.toThrow('Email already exists');
		});
	});
});
```

### Validator Unit Tests

```typescript
// tests/unit/validators/user.validator.test.ts
import { describe, it, expect } from 'vitest';
import { UserValidator } from '../../../validators/user.validator';

describe('UserValidator', () => {
	const validator = new UserValidator();

	describe('validateEmail', () => {
		it('should pass for valid emails', () => {
			const validEmails = ['test@example.com', 'user.name@domain.co.uk', 'name+tag@example.com'];

			validEmails.forEach((email) => {
				expect(validator.validateEmail(email)).toBe(true);
			});
		});

		it('should fail for invalid emails', () => {
			const invalidEmails = ['invalid', 'missing@domain', '@example.com', 'user@.com', ''];

			invalidEmails.forEach((email) => {
				expect(validator.validateEmail(email)).toBe(false);
			});
		});
	});

	describe('validateUserData', () => {
		it('should return valid for correct user data', () => {
			const result = validator.validateUserData({
				name: 'John Doe',
				email: 'john@example.com'
			});

			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should return errors for missing fields', () => {
			const result = validator.validateUserData({
				name: '',
				email: ''
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Name is required');
			expect(result.errors).toContain('Email is required');
		});

		it('should return error for name too short', () => {
			const result = validator.validateUserData({
				name: 'Jo',
				email: 'jo@example.com'
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Name must be at least 3 characters');
		});
	});
});
```

## Integration Testing

### API Endpoint Integration Tests

```typescript
// tests/integration/api/user-endpoints.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import { userRoutes } from '../../../routes/user.routes';

describe('User API Endpoints', () => {
	let app: Hono;

	beforeAll(() => {
		app = new Hono();
		app.route('/api/users', userRoutes);
	});

	describe('GET /api/users', () => {
		it('should return all users', async () => {
			const response = await app.request('/api/users');
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(Array.isArray(data)).toBe(true);
			expect(data.length).toBeGreaterThan(0);
		});

		it('should return empty array when no users exist', async () => {
			// Setup: Clear users
			const response = await app.request('/api/users');
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual([]);
		});
	});

	describe('GET /api/users/:id', () => {
		it('should return user by ID', async () => {
			const response = await app.request('/api/users/1');
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toHaveProperty('id', 1);
			expect(data).toHaveProperty('name');
			expect(data).toHaveProperty('email');
		});

		it('should return 404 for non-existent user', async () => {
			const response = await app.request('/api/users/99999');

			expect(response.status).toBe(404);
		});

		it('should return 400 for invalid ID format', async () => {
			const response = await app.request('/api/users/invalid');

			expect(response.status).toBe(400);
		});
	});

	describe('POST /api/users', () => {
		it('should create new user', async () => {
			const userData = {
				name: 'New User',
				email: 'newuser@example.com'
			};

			const response = await app.request('/api/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(userData)
			});

			const data = await response.json();

			expect(response.status).toBe(201);
			expect(data).toHaveProperty('id');
			expect(data.name).toBe(userData.name);
			expect(data.email).toBe(userData.email);
		});

		it('should return 400 for invalid data', async () => {
			const response = await app.request('/api/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: '' })
			});

			expect(response.status).toBe(400);
		});

		it('should return 409 for duplicate email', async () => {
			const userData = {
				name: 'Duplicate',
				email: 'existing@example.com'
			};

			// First creation
			await app.request('/api/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(userData)
			});

			// Duplicate attempt
			const response = await app.request('/api/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(userData)
			});

			expect(response.status).toBe(409);
		});
	});

	describe('DELETE /api/users/:id', () => {
		it('should delete existing user', async () => {
			// Create user first
			const createResponse = await app.request('/api/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: 'To Delete', email: 'delete@example.com' })
			});
			const user = await createResponse.json();

			// Delete user
			const deleteResponse = await app.request(`/api/users/${user.id}`, {
				method: 'DELETE'
			});

			expect(deleteResponse.status).toBe(204);

			// Verify deletion
			const getResponse = await app.request(`/api/users/${user.id}`);
			expect(getResponse.status).toBe(404);
		});

		it('should return 404 when deleting non-existent user', async () => {
			const response = await app.request('/api/users/99999', {
				method: 'DELETE'
			});

			expect(response.status).toBe(404);
		});
	});
});
```

### Workflow Integration Tests

```typescript
// tests/integration/workflows/user-lifecycle.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from 'inversify';
import { TYPES } from '../../../container/types';
import { UserService } from '../../../services/user.service';
import type { IUserService } from '../../../interfaces/user.interface';

describe('User Lifecycle Workflow', () => {
	let container: Container;
	let userService: IUserService;

	beforeEach(() => {
		container = new Container();
		container.bind<IUserService>(TYPES.UserService).to(UserService);
		userService = container.get<IUserService>(TYPES.UserService);
	});

	it('should complete full CRUD lifecycle', async () => {
		// CREATE
		const newUser = await userService.createUser({
			name: 'Lifecycle User',
			email: 'lifecycle@example.com'
		});

		expect(newUser).toHaveProperty('id');
		const userId = newUser.id;

		// READ
		const fetchedUser = await userService.getUserById(userId);
		expect(fetchedUser.name).toBe('Lifecycle User');

		// UPDATE
		const updatedUser = await userService.updateUser(userId, {
			name: 'Updated Name'
		});
		expect(updatedUser.name).toBe('Updated Name');
		expect(updatedUser.email).toBe('lifecycle@example.com');

		// DELETE
		await userService.deleteUser(userId);
		await expect(userService.getUserById(userId)).rejects.toThrow('User not found');
	});

	it('should handle batch operations', async () => {
		const usersToCreate = [
			{ name: 'User 1', email: 'user1@example.com' },
			{ name: 'User 2', email: 'user2@example.com' },
			{ name: 'User 3', email: 'user3@example.com' }
		];

		const createdUsers = await Promise.all(
			usersToCreate.map((userData) => userService.createUser(userData))
		);

		expect(createdUsers).toHaveLength(3);
		createdUsers.forEach((user) => {
			expect(user).toHaveProperty('id');
		});

		const allUsers = await userService.getAllUsers();
		expect(allUsers.length).toBeGreaterThanOrEqual(3);
	});
});
```

## Component Testing

### Testing Svelte Components

```typescript
// tests/component/UserCard.test.ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import UserCard from '../../ui/components/UserCard.svelte';

describe('UserCard', () => {
	const mockUser = {
		id: 1,
		name: 'John Doe',
		email: 'john@example.com'
	};

	it('should render user information', () => {
		render(UserCard, { user: mockUser });

		expect(screen.getByText('John Doe')).toBeInTheDocument();
		expect(screen.getByText('john@example.com')).toBeInTheDocument();
	});

	it('should call onDelete when delete button clicked', async () => {
		const onDelete = vi.fn();
		render(UserCard, { user: mockUser, onDelete });

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		await fireEvent.click(deleteButton);

		expect(onDelete).toHaveBeenCalledWith(mockUser.id);
		expect(onDelete).toHaveBeenCalledTimes(1);
	});

	it('should not show delete button when onDelete not provided', () => {
		render(UserCard, { user: mockUser });

		const deleteButton = screen.queryByRole('button', { name: /delete/i });
		expect(deleteButton).not.toBeInTheDocument();
	});

	it('should apply custom class when provided', () => {
		const { container } = render(UserCard, {
			user: mockUser,
			class: 'custom-class'
		});

		expect(container.firstChild).toHaveClass('custom-class');
	});
});
```

### Testing Forms with Validation

```typescript
// tests/component/UserForm.test.ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import UserForm from '../../ui/components/UserForm.svelte';

describe('UserForm', () => {
	it('should render form fields', () => {
		render(UserForm);

		expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
	});

	it('should show validation errors for empty fields', async () => {
		render(UserForm);

		const submitButton = screen.getByRole('button', { name: /submit/i });
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText(/name is required/i)).toBeInTheDocument();
			expect(screen.getByText(/email is required/i)).toBeInTheDocument();
		});
	});

	it('should show error for invalid email', async () => {
		render(UserForm);

		const emailInput = screen.getByLabelText(/email/i);
		await fireEvent.input(emailInput, { target: { value: 'invalid-email' } });
		await fireEvent.blur(emailInput);

		await waitFor(() => {
			expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
		});
	});

	it('should call onSubmit with form data when valid', async () => {
		const onSubmit = vi.fn().mockResolvedValue({});
		render(UserForm, { onSubmit });

		const nameInput = screen.getByLabelText(/name/i);
		const emailInput = screen.getByLabelText(/email/i);

		await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
		await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });

		const submitButton = screen.getByRole('button', { name: /submit/i });
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledWith({
				name: 'John Doe',
				email: 'john@example.com'
			});
		});
	});

	it('should disable submit button while submitting', async () => {
		const onSubmit = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 100)));
		render(UserForm, { onSubmit });

		const nameInput = screen.getByLabelText(/name/i);
		const emailInput = screen.getByLabelText(/email/i);
		const submitButton = screen.getByRole('button', { name: /submit/i });

		await fireEvent.input(nameInput, { target: { value: 'John' } });
		await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
		await fireEvent.click(submitButton);

		expect(submitButton).toBeDisabled();

		await waitFor(() => {
			expect(submitButton).not.toBeDisabled();
		});
	});

	it('should clear form after successful submission', async () => {
		const onSubmit = vi.fn().mockResolvedValue({});
		render(UserForm, { onSubmit, clearOnSubmit: true });

		const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
		const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;

		await fireEvent.input(nameInput, { target: { value: 'John' } });
		await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });

		const submitButton = screen.getByRole('button', { name: /submit/i });
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(nameInput.value).toBe('');
			expect(emailInput.value).toBe('');
		});
	});
});
```

## E2E Testing with Playwright

This section covers comprehensive End-to-End (E2E) testing using Playwright for the SvelteKit + Hono application.

### E2E Overview

Playwright is a modern E2E testing framework that allows you to test your application across multiple browsers (Chromium, Firefox, and WebKit). Our E2E tests simulate real user interactions and verify that the entire application stack works correctly.

### E2E Implementation Summary

✅ **Implementation Complete**

Playwright has been successfully integrated into the project with comprehensive E2E test coverage, linting compliance, and CI/CD support.

#### What Was Installed

- `@playwright/test@1.56.1` - Playwright testing framework
- `@types/node@24.8.1` - Node.js type definitions (required for Playwright)
- Chromium browser (installed via `playwright install chromium`)

#### Package.json Scripts Added

```json
{
	"test:e2e": "playwright test",
	"test:e2e:ui": "playwright test --ui",
	"test:e2e:debug": "playwright test --debug",
	"test:e2e:headed": "playwright test --headed",
	"test:e2e:chromium": "playwright test --project=chromium",
	"test:e2e:firefox": "playwright test --project=firefox",
	"test:e2e:webkit": "playwright test --project=webkit",
	"test:e2e:report": "playwright show-report"
}
```

#### Test Coverage

- **903 tests** across **3 browsers** (Chromium, Firefox, WebKit)
- **301 tests per browser**
- **4 test files** with comprehensive coverage

| Test Suite            | Tests | Description                                                      |
| --------------------- | ----- | ---------------------------------------------------------------- |
| **Homepage**          | 18    | Page structure, API integration, responsive design, performance  |
| **User Management**   | 33    | CRUD operations, forms, validation, state management, concurrent |
| **API Endpoints**     | 71    | Health, Hello, Users API with full validation and error cases    |
| **Navigation**        | 179   | Internal/external nav, history, 404s, scroll, accessibility      |
| **Total per browser** | 301   | **Total across 3 browsers: 903 tests**                           |

### E2E Quick Start

#### Prerequisites

1. Ensure dependencies are installed:

```bash
pnpm install
```

2. Install Playwright browsers:

```bash
pnpm exec playwright install chromium
```

#### Run Your First Test

```bash
# Run all E2E tests
pnpm run test:e2e

# Run tests in interactive UI mode
pnpm run test:e2e:ui
```

### E2E Architecture

#### Page Object Model (POM)

Tests use the **Page Object Model** pattern for better maintainability and reusability:

```
tests/e2e/
├── pages/              # Page Object Models
│   └── HomePage.ts     # HomePage POM with locators and actions
├── fixtures/           # Custom fixtures and helpers
│   ├── index.ts        # Test fixtures with auto-cleanup
│   └── api-helpers.ts  # API testing utilities
├── homepage.spec.ts    # Homepage UI tests
├── user-management.spec.ts
├── api.spec.ts         # API endpoint tests
└── navigation.spec.ts  # Navigation tests
```

#### Custom Fixtures

Tests use custom Playwright fixtures for:

- **HomePage fixture** - Pre-configured page object
- **API fixture** - API helpers with automatic test data cleanup
- **Type safety** - Full TypeScript support

Example:

```typescript
import { test, expect } from './fixtures';

test('should create user', async ({ homePage, api }) => {
	const userData = api.generateTestUser();
	await homePage.createUser(userData.name, userData.email);
	await homePage.expectUserToBeVisible(userData.name, userData.email);
});
```

### Running E2E Tests

#### All Available Commands

```bash
# Run all tests (headless mode)
pnpm run test:e2e

# Run tests with UI (interactive mode - recommended for development)
pnpm run test:e2e:ui

# Run tests in headed mode (see the browser)
pnpm run test:e2e:headed

# Debug tests (step through with debugger)
pnpm run test:e2e:debug

# Run tests in specific browsers
pnpm run test:e2e:chromium   # Chrome/Edge
pnpm run test:e2e:firefox    # Firefox
pnpm run test:e2e:webkit     # Safari

# View HTML test report
pnpm run test:e2e:report
```

#### Running Specific Tests

```bash
# Run a specific test file
pnpm exec playwright test homepage.spec.ts

# Run tests matching a pattern
pnpm exec playwright test user-management

# Run a specific test by name
pnpm exec playwright test -g "should create a new user"
```

#### Test Execution Modes

- **Headless** (default): Tests run without opening a visible browser
- **Headed**: Browser window is visible during test execution
- **UI Mode**: Interactive mode with time-travel debugging
- **Debug**: Step through tests with Chrome DevTools

### Writing E2E Tests

#### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
	test.beforeEach(async ({ page }) => {
		// Setup - runs before each test
		await page.goto('/');
	});

	test('should perform an action', async ({ page }) => {
		// Arrange
		const button = page.getByRole('button', { name: /submit/i });

		// Act
		await button.click();

		// Assert
		await expect(page.getByText('Success')).toBeVisible();
	});
});
```

#### Using Page Object Model

```typescript
import { test, expect } from './fixtures';

test.describe('My Feature', () => {
	test.beforeEach(async ({ homePage }) => {
		await homePage.goto();
	});

	test('should do something', async ({ homePage }) => {
		// Use page object methods
		await homePage.createUser('John Doe', 'john@example.com');

		// Use page object assertions
		await homePage.expectUserToBeVisible('John Doe', 'john@example.com');
	});
});
```

#### Using API Helpers

```typescript
test('should create user via API', async ({ api }) => {
	// Generate unique test data
	const userData = api.generateTestUser();

	// Create user
	const user = await api.createUser(userData.name, userData.email);

	// Verify user exists
	await api.expectUserExists(user.id);

	// Cleanup happens automatically via fixture
});
```

#### Locator Strategies (Preferred Order)

Use locators that resemble how users interact with your app:

```typescript
// 1. Role-based (BEST - accessible and semantic)
page.getByRole('button', { name: /submit/i });
page.getByRole('heading', { name: /welcome/i });
page.getByRole('link', { name: /home/i });

// 2. Label (good for form fields)
page.getByLabel('Email address');
page.getByLabel(/password/i);

// 3. Placeholder (for inputs)
page.getByPlaceholder('Enter your name');

// 4. Text content
page.getByText('Welcome back!');
page.getByText(/hello world/i);

// 5. Test ID (last resort)
page.getByTestId('custom-element');
```

#### Common Assertions

```typescript
// Visibility
await expect(element).toBeVisible();
await expect(element).toBeHidden();

// Text content
await expect(element).toHaveText('Expected text');
await expect(element).toContainText('partial text');

// Input values
await expect(input).toHaveValue('value');
await expect(input).toBeEmpty();

// Attributes
await expect(link).toHaveAttribute('href', '/path');
await expect(element).toHaveClass('active');

// State
await expect(button).toBeEnabled();
await expect(button).toBeDisabled();
await expect(checkbox).toBeChecked();

// Count
await expect(page.getByRole('listitem')).toHaveCount(5);

// URL
await expect(page).toHaveURL('http://localhost:5173/');
await expect(page).toHaveTitle('Page Title');
```

### E2E Best Practices

#### ✅ DO

- **Use Page Object Model** - Reusable methods and locators
- **Use Custom Fixtures** - Automatic setup/teardown
- **Generate Test Data** - `api.generateTestUser()` for unique data
- **Use Descriptive Names** - Clear test descriptions
- **Group Related Tests** - Use `describe` blocks
- **Wait Properly** - Use `expect().toBeVisible()` not `waitForTimeout`
- **Test Isolation** - Each test should be independent

```typescript
// ✅ Good
test('should create and display user', async ({ homePage, api }) => {
	const userData = api.generateTestUser();
	await homePage.createUser(userData.name, userData.email);
	await homePage.expectUserToBeVisible(userData.name, userData.email);
});
```

#### ❌ DON'T

- **Don't use hard-coded waits** - `page.waitForTimeout(5000)`
- **Don't share state between tests** - Each test should be independent
- **Don't use hard-coded test data** - Generate unique data
- **Don't access page directly** - Use page object methods
- **Don't skip cleanup** - Fixtures handle it automatically

```typescript
// ❌ Bad
test('bad test', async ({ page }) => {
	await page.goto('/');
	await page.waitForTimeout(5000); // Don't do this
	await page.fill('input', 'test@test.com'); // Hard-coded data
});
```

### E2E Common Patterns

#### Testing Forms

```typescript
test('should submit form successfully', async ({ page }) => {
	await page.goto('/');

	// Fill form
	await page.getByPlaceholder(/name/i).fill('John Doe');
	await page.getByPlaceholder(/email/i).fill('john@example.com');

	// Submit
	await page.getByRole('button', { name: /submit/i }).click();

	// Verify success
	await expect(page.getByText('John Doe')).toBeVisible({ timeout: 10000 });
});
```

#### Testing Navigation

```typescript
test('should navigate between pages', async ({ page }) => {
	await page.goto('/');

	// Click link
	const link = page.getByRole('link', { name: /about/i });
	await link.click();

	// Verify navigation
	await page.waitForURL('**/about');
	await expect(page).toHaveURL(/\/about/);
});
```

#### Testing API Endpoints

```typescript
test('should return users from API', async ({ request }) => {
	const response = await request.get('/api/users');

	expect(response.status()).toBe(200);

	const users = await response.json();
	expect(Array.isArray(users)).toBe(true);
});
```

#### Testing with Network Mocking

```typescript
test('should handle API error gracefully', async ({ page }) => {
	// Mock API to return error
	await page.route('**/api/users', (route) => {
		route.fulfill({
			status: 500,
			body: JSON.stringify({ error: 'Server error' })
		});
	});

	await page.goto('/');

	// Verify error handling
	await expect(page.getByText(/error/i)).toBeVisible();
});
```

#### Testing with Multiple Tabs

```typescript
test('should open link in new tab', async ({ page, context }) => {
	await page.goto('/');

	const link = page.getByRole('link', { name: /api docs/i });

	// Listen for new page
	const pagePromise = context.waitForEvent('page');
	await link.click();
	const newPage = await pagePromise;

	await newPage.waitForLoadState();
	expect(newPage.url()).toContain('/api/docs');

	await newPage.close();
});
```

#### Concurrent Operations

```typescript
test('should handle concurrent requests', async ({ api }) => {
	const users = api.generateMultipleTestUsers(5);

	const promises = users.map((user) => api.createUser(user.name, user.email));

	const createdUsers = await Promise.all(promises);

	createdUsers.forEach((user) => {
		expect(user).toHaveProperty('id');
	});
});
```

### E2E Debugging

#### UI Mode (Best for Development)

```bash
pnpm run test:e2e:ui
```

Features:

- Time-travel debugging
- View DOM snapshots
- Inspect network calls
- Edit and re-run tests
- Step through execution

#### Debug Mode

```bash
pnpm run test:e2e:debug
```

Opens Playwright Inspector with step-by-step debugging.

#### Manual Debugging

```typescript
test('debug test', async ({ page, homePage }) => {
	// Pause execution
	await page.pause();

	// Take screenshot
	await page.screenshot({ path: 'debug.png' });

	// Log page state
	console.log(await homePage.getUserCount());
});
```

#### Trace Viewer

If tests fail in CI, download artifacts and view trace:

```bash
pnpm exec playwright show-trace trace.zip
```

### E2E CI/CD Integration

#### GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/playwright.yml`) that:

1. Installs dependencies
2. Installs Playwright browsers
3. Runs all E2E tests
4. Uploads test reports as artifacts

Tests run automatically on:

- Push to `main`, `master`, or `develop` branches
- Pull requests to these branches

#### Viewing CI Test Results

1. Go to GitHub Actions tab
2. Click on the workflow run
3. Download artifacts:
   - `playwright-report` - HTML report
   - `test-results` - Screenshots and traces

### E2E Maintenance

#### Updating Playwright

```bash
# Update Playwright
pnpm add -D @playwright/test@latest

# Update browsers
pnpm exec playwright install
```

#### Adding New Tests

1. Create new `.spec.ts` file in `tests/e2e/`
2. Follow the existing test structure
3. Run `pnpm run test:e2e` to verify
4. Check `pnpm run lint` passes

#### Configuration

Configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:5173`
- **Test Directory**: `./tests/e2e`
- **Output Directory**: `tests/playwright-report` (for test results and reports)
- **Browsers**: Chromium, Firefox, WebKit
- **Retries**: 2 on CI, 0 locally
- **Auto-start dev server**: Yes
- **Parallel execution**: Enabled

#### API Reference

##### HomePage Page Object

```typescript
// Navigation
await homePage.goto();
await homePage.navigateToDIExamples();

// User Management
await homePage.createUser(name, email);
await homePage.deleteUser(name);
await homePage.fillUserForm(name, email);
await homePage.submitUserForm();

// Getters
const count = await homePage.getUserCount();
const isEmpty = await homePage.isFormEmpty();

// Assertions
await homePage.expectPageToBeVisible();
await homePage.expectUserToBeVisible(name, email);
await homePage.expectFormToBeEmpty();
await homePage.expectEmptyState();
```

##### API Helpers

```typescript
// User CRUD
const user = await api.createUser(name, email);
const users = await api.getAllUsers();
const user = await api.getUserById(id);
await api.deleteUser(id);
await api.deleteAllUsers();

// Test Data Generation
const userData = api.generateTestUser();
const users = api.generateMultipleTestUsers(count);

// Assertions
await api.expectUserExists(id);
await api.expectUserNotFound(id);
await api.expectHealthStatusOk();
await api.expectValidationError(name, email);

// Cleanup
await api.cleanupTestUsers(); // Automatic via fixture
```

## Testing with Dependency Injection

### Testing Services with Mocked Dependencies

```typescript
// tests/unit/services/user-api.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserApiService } from '../../../services/client/api.service';
import type { IHttpClient } from '../../../interfaces/http-client.interface';

describe('UserApiService with DI', () => {
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

		// Inject mock into service
		userApiService = new UserApiService(mockHttpClient);
	});

	describe('getAllUsers', () => {
		it('should fetch all users', async () => {
			const mockUsers = [
				{ id: 1, name: 'John', email: 'john@example.com' },
				{ id: 2, name: 'Jane', email: 'jane@example.com' }
			];

			vi.mocked(mockHttpClient.get).mockResolvedValue({ data: mockUsers });

			const result = await userApiService.getAllUsers();

			expect(result).toEqual(mockUsers);
			expect(mockHttpClient.get).toHaveBeenCalledWith('/api/users');
		});

		it('should throw error when API fails', async () => {
			vi.mocked(mockHttpClient.get).mockRejectedValue(new Error('Network error'));

			await expect(userApiService.getAllUsers()).rejects.toThrow('Network error');
		});
	});

	describe('createUser', () => {
		it('should create a user successfully', async () => {
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
	});

	describe('deleteUser', () => {
		it('should delete a user', async () => {
			vi.mocked(mockHttpClient.delete).mockResolvedValue({});

			await userApiService.deleteUser(1);

			expect(mockHttpClient.delete).toHaveBeenCalledWith('/api/users/1');
		});
	});
});
```

### Integration Tests with Test Container

```typescript
// tests/integration/di-container.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from 'inversify';
import { TYPES } from '../../container/types';
import { MockUserApiService } from '../mocks/api.mock';
import type { IUserApiService } from '../../interfaces/api.interface';

describe('DI Container Integration', () => {
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

	it('should resolve services from container', () => {
		expect(userApi).toBeDefined();
		expect(userApi.getAllUsers).toBeInstanceOf(Function);
	});

	it('should handle full user lifecycle', async () => {
		// Create
		const newUser = await userApi.createUser({
			name: 'Test User',
			email: 'test@example.com'
		});
		expect(newUser).toHaveProperty('id');

		// Read
		let users = await userApi.getAllUsers();
		expect(users).toContainEqual(expect.objectContaining({ name: 'Test User' }));

		// Update
		const updated = await userApi.updateUser(newUser.id, { name: 'Updated Name' });
		expect(updated.name).toBe('Updated Name');

		// Delete
		await userApi.deleteUser(newUser.id);
		users = await userApi.getAllUsers();
		expect(users).not.toContainEqual(expect.objectContaining({ id: newUser.id }));
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

## Mocking Strategies

### Creating Mock Factories

```typescript
// tests/mocks/api.mock.ts
import { vi } from 'vitest';
import type { IUserApiService } from '../../interfaces/api.interface';

export function createMockUserApi(overrides?: Partial<IUserApiService>): IUserApiService {
	const defaultMock: IUserApiService = {
		getAllUsers: vi.fn().mockResolvedValue([
			{ id: 1, name: 'John Doe', email: 'john@example.com' },
			{ id: 2, name: 'Jane Smith', email: 'jane@example.com' },
			{ id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
		]),
		getUserById: vi
			.fn()
			.mockImplementation((id: number) =>
				Promise.resolve({ id, name: `User ${id}`, email: `user${id}@example.com` })
			),
		createUser: vi
			.fn()
			.mockImplementation((userData) =>
				Promise.resolve({ id: Math.floor(Math.random() * 1000), ...userData })
			),
		updateUser: vi.fn().mockImplementation((id, userData) => Promise.resolve({ id, ...userData })),
		deleteUser: vi.fn().mockResolvedValue(undefined)
	};

	return { ...defaultMock, ...overrides };
}

export class MockUserApiService implements IUserApiService {
	private users: Array<{ id: number; name: string; email: string }> = [
		{ id: 1, name: 'Mock User 1', email: 'mock1@example.com' },
		{ id: 2, name: 'Mock User 2', email: 'mock2@example.com' }
	];

	async getAllUsers() {
		return [...this.users];
	}

	async getUserById(id: number) {
		const user = this.users.find((u) => u.id === id);
		if (!user) throw new Error(`User with ID ${id} not found`);
		return user;
	}

	async createUser(userData: { name: string; email: string }) {
		const newUser = {
			id: this.users.length + 1,
			...userData
		};
		this.users.push(newUser);
		return newUser;
	}

	async updateUser(id: number, userData: Partial<{ name: string; email: string }>) {
		const userIndex = this.users.findIndex((u) => u.id === id);
		if (userIndex === -1) throw new Error(`User with ID ${id} not found`);

		this.users[userIndex] = { ...this.users[userIndex], ...userData };
		return this.users[userIndex];
	}

	async deleteUser(id: number) {
		const userIndex = this.users.findIndex((u) => u.id === id);
		if (userIndex === -1) throw new Error(`User with ID ${id} not found`);
		this.users.splice(userIndex, 1);
	}
}
```

### Using Mock Factories in Tests

```typescript
// tests/component/user-operations.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createMockUserApi } from '../mocks/api.mock';

describe('User Operations with Mock Factory', () => {
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
		const mockApi = createMockUserApi({ getAllUsers: getAllUsersMock });

		await mockApi.getAllUsers();
		await mockApi.getAllUsers();

		expect(getAllUsersMock).toHaveBeenCalledTimes(2);
	});
});
```

### Test Data Fixtures

```typescript
// tests/fixtures/users.fixture.ts
export const mockUsers = {
	john: {
		id: 1,
		name: 'John Doe',
		email: 'john@example.com',
		createdAt: new Date('2024-01-01')
	},
	jane: {
		id: 2,
		name: 'Jane Smith',
		email: 'jane@example.com',
		createdAt: new Date('2024-01-02')
	},
	bob: {
		id: 3,
		name: 'Bob Johnson',
		email: 'bob@example.com',
		createdAt: new Date('2024-01-03')
	}
};

export const createMockUser = (overrides?: Partial<typeof mockUsers.john>) => ({
	id: Math.floor(Math.random() * 1000),
	name: 'Test User',
	email: 'test@example.com',
	createdAt: new Date(),
	...overrides
});

export const mockUserList = () => Object.values(mockUsers);
```

## Best Practices

### 1. Test Isolation

**✅ DO:** Create fresh instances for each test

```typescript
beforeEach(() => {
	container = new Container();
	mockService = createMockUserApi();
});

afterEach(() => {
	container.unbindAll();
	vi.clearAllMocks();
});
```

**❌ DON'T:** Share state between tests

```typescript
// Bad - shared state
const mockApi = createMockUserApi();

it('test 1', async () => {
	await mockApi.createUser({ name: 'User 1', email: 'user1@example.com' });
});

it('test 2', async () => {
	// This test depends on state from test 1
	const users = await mockApi.getAllUsers();
});
```

### 2. Descriptive Test Names

**✅ DO:** Use descriptive names that explain the scenario

```typescript
it('should return 404 when user does not exist', async () => {});
it('should throw ValidationError for invalid email format', async () => {});
it('should allow updating user name without changing email', async () => {});
```

**❌ DON'T:** Use vague or unclear names

```typescript
it('works', async () => {});
it('test user', async () => {});
it('should pass', async () => {});
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should create user with valid data', async () => {
	// Arrange
	const userData = { name: 'John', email: 'john@example.com' };
	const mockApi = createMockUserApi();

	// Act
	const result = await mockApi.createUser(userData);

	// Assert
	expect(result).toMatchObject(userData);
	expect(result.id).toBeDefined();
});
```

### 4. Test Edge Cases

```typescript
describe('UserValidator', () => {
	it('should handle empty string', () => {
		expect(validator.validateEmail('')).toBe(false);
	});

	it('should handle null', () => {
		expect(validator.validateEmail(null as any)).toBe(false);
	});

	it('should handle undefined', () => {
		expect(validator.validateEmail(undefined as any)).toBe(false);
	});

	it('should handle very long email', () => {
		const longEmail = 'a'.repeat(100) + '@example.com';
		expect(validator.validateEmail(longEmail)).toBe(false);
	});

	it('should handle special characters', () => {
		expect(validator.validateEmail('user+tag@example.com')).toBe(true);
	});
});
```

### 5. Mock Verification

```typescript
it('should call repository with correct parameters', async () => {
	const createMock = vi.fn().mockResolvedValue({ id: 1, name: 'Test', email: 'test@example.com' });
	const mockRepository = { create: createMock };
	const service = new UserService(mockRepository);

	const userData = { name: 'Test', email: 'test@example.com' };
	await service.createUser(userData);

	expect(createMock).toHaveBeenCalledWith(userData);
	expect(createMock).toHaveBeenCalledTimes(1);
});
```

### 6. Async Testing

```typescript
// ✅ DO: Use async/await
it('should fetch users', async () => {
	const users = await userService.getAllUsers();
	expect(users).toHaveLength(3);
});

// ✅ DO: Test promise rejections
it('should throw error', async () => {
	await expect(userService.getUserById(-1)).rejects.toThrow('Invalid ID');
});

// ❌ DON'T: Forget to await
it('should fetch users', () => {
	userService.getAllUsers(); // Missing await!
	expect(users).toHaveLength(3); // users is undefined
});
```

### 7. Test Organization

```typescript
describe('UserService', () => {
	// Group by method
	describe('getUserById', () => {
		it('should return user when found', () => {});
		it('should throw when not found', () => {});
		it('should validate ID format', () => {});
	});

	describe('createUser', () => {
		it('should create user with valid data', () => {});
		it('should throw for invalid email', () => {});
		it('should throw for duplicate email', () => {});
	});

	// Or group by scenario
	describe('when user exists', () => {
		it('should return user data', () => {});
		it('should allow updates', () => {});
		it('should allow deletion', () => {});
	});

	describe('when user does not exist', () => {
		it('should throw on fetch', () => {});
		it('should throw on update', () => {});
		it('should throw on delete', () => {});
	});
});
```

## Running Tests

### Available Test Commands

```bash
# Run all tests once
pnpm test:run

# Run tests in watch mode (recommended for development)
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test user.service.test.ts

# Run tests matching pattern
pnpm test --grep "UserService"

# Run tests in specific directory
pnpm test tests/unit/

# Run tests with reporter
pnpm test --reporter=verbose

# Run tests and update snapshots
pnpm test -u
```

### Watch Mode

```bash
# Start watch mode
pnpm test

# Available commands in watch mode:
# Press 'a' to run all tests
# Press 'f' to run only failed tests
# Press 'p' to filter by filename
# Press 't' to filter by test name
# Press 'q' to quit
```

### Debugging Tests

```typescript
// Use console.log for quick debugging
it('should debug test', async () => {
	const result = await service.getUserById(1);
	console.log('Result:', result);
	expect(result).toBeDefined();
});

// Use debugger statement
it('should debug with breakpoint', async () => {
	debugger; // Execution will pause here
	const result = await service.getUserById(1);
	expect(result).toBeDefined();
});
```

### Running Tests in VS Code

Add to `.vscode/launch.json`:

```json
{
	"version": "0.2.0",
	"configurations": [
		{
			"type": "node",
			"request": "launch",
			"name": "Debug Vitest Tests",
			"runtimeExecutable": "pnpm",
			"runtimeArgs": ["test", "--run"],
			"console": "integratedTerminal",
			"internalConsoleOptions": "neverOpen"
		}
	]
}
```

## Coverage Reports

### Generating Coverage

```bash
# Generate coverage report
pnpm test:coverage

# View coverage in browser
pnpm test:coverage --ui
```

### Coverage Configuration

```typescript
// vitest.config.ts
export default defineConfig({
	test: {
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', 'src/tests/', '**/*.test.ts', '**/*.spec.ts', '**/*.mock.ts'],
			all: true,
			lines: 80,
			functions: 80,
			branches: 80,
			statements: 80
		}
	}
});
```

### Coverage Reports Location

```
coverage/
├── coverage-final.json
├── index.html          # Open this in browser
├── lcov.info
└── lcov-report/
```

### Understanding Coverage Metrics

- **Lines**: Percentage of lines executed
- **Functions**: Percentage of functions called
- **Branches**: Percentage of code branches taken
- **Statements**: Percentage of statements executed

### Coverage Best Practices

1. **Aim for 80%+ coverage** but don't obsess over 100%
2. **Focus on critical paths** - business logic, validation, error handling
3. **Don't test implementation details** - test behavior
4. **Exclude generated code** - build artifacts, migrations
5. **Review uncovered code** - understand why it's not tested

## Continuous Integration

### GitHub Actions Configuration

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v3

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run linter
        run: pnpm lint

      - name: Run type check
        run: pnpm check

      - name: Run tests
        run: pnpm test:run

      - name: Run tests with coverage
        run: pnpm test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella

      - name: Build project
        run: pnpm build
```

### Pre-commit Hooks

```bash
# Install husky
pnpm add -D husky

# Initialize husky
pnpm exec husky init
```

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm lint
pnpm test:run
```

## Troubleshooting

### Common Issues

#### Tests timing out

```typescript
// Increase timeout for slow tests
it('should handle slow operation', async () => {
	// Operation takes >5 seconds
	await slowOperation();
}, 10000); // 10 second timeout
```

#### Mock not being called

```typescript
// ❌ Wrong
const mockFn = vi.fn();
// ... test code ...
expect(mockFn).toHaveBeenCalled(); // Fails

// ✅ Correct
const mockFn = vi.fn();
vi.mocked(service.method).mockImplementation(mockFn);
// ... test code ...
expect(mockFn).toHaveBeenCalled();
```

#### Async test failures

```typescript
// ❌ Wrong - missing await
it('should work', () => {
	service.asyncMethod(); // Promise not awaited!
	expect(result).toBe(true); // result is undefined
});

// ✅ Correct
it('should work', async () => {
	await service.asyncMethod();
	expect(result).toBe(true);
});
```

#### Module not found errors

```bash
# Clear cache and reinstall
rm -rf node_modules .svelte-kit
pnpm install

# Clear Vitest cache
pnpm test --clearCache
```

#### Type errors in tests

```typescript
// Use type assertions when needed
const mockData = {
	id: 1,
	name: 'Test'
} as User;

// Or use Partial for incomplete objects
const partialUser: Partial<User> = {
	name: 'Test'
};
```

#### Tests pass locally but fail in CI

1. Check Node.js version matches
2. Verify environment variables
3. Check for race conditions
4. Look for file system differences (case sensitivity)
5. Check timezone issues with Date objects

### Debug Tips

```typescript
// 1. Use test.only to run single test
it.only('should debug this test', () => {
	// Only this test runs
});

// 2. Use test.skip to skip tests
it.skip('should skip this test', () => {
	// This test is skipped
});

// 3. Use console.log for quick debugging
it('should log values', () => {
	console.log('Value:', someValue);
});

// 4. Use test.todo for future tests
it.todo('should implement this feature');

// 5. Check mock calls
it('should verify mock', () => {
	console.log(mockFn.mock.calls);
	console.log(mockFn.mock.results);
});
```

### Performance Issues

```typescript
// Use concurrent tests for independent tests
describe.concurrent('Independent tests', () => {
	it('test 1', async () => {
		// Runs concurrently
	});

	it('test 2', async () => {
		// Runs concurrently
	});
});

// Reuse expensive setup
let expensiveResource: Resource;

beforeAll(async () => {
	// Runs once before all tests
	expensiveResource = await setupExpensiveResource();
});

afterAll(async () => {
	// Clean up once after all tests
	await expensiveResource.cleanup();
});
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [InversifyJS Testing](https://github.com/inversify/InversifyJS#injecting-dependencies-in-tests)
- [Testing Best Practices](https://testingjavascript.com/)
- [DEVELOPMENT.md](./DEVELOPMENT.md) - DI patterns and examples

---

## Quick Reference

### Test Structure Template

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('ComponentName', () => {
	let service: ServiceType;
	let mockDependency: MockType;

	beforeEach(() => {
		// Setup
		mockDependency = createMock();
		service = new ServiceType(mockDependency);
	});

	afterEach(() => {
		// Cleanup
		vi.clearAllMocks();
	});

	describe('methodName', () => {
		it('should do something when condition', async () => {
			// Arrange
			const input = {
				/* test data */
			};

			// Act
			const result = await service.methodName(input);

			// Assert
			expect(result).toBe(expected);
			expect(mockDependency.method).toHaveBeenCalled();
		});

		it('should throw error when invalid input', async () => {
			// Arrange
			const invalidInput = {
				/* invalid data */
			};

			// Act & Assert
			await expect(service.methodName(invalidInput)).rejects.toThrow('Error message');
		});
	});
});
```

### Common Matchers

```typescript
// Equality
expect(value).toBe(4);
expect(value).toEqual({ id: 1 });
expect(value).not.toBe(null);

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeDefined();
expect(value).toBeUndefined();
expect(value).toBeNull();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThan(10);
expect(value).toBeCloseTo(0.3);

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain(item);
expect(array).toContainEqual({ id: 1 });

// Objects
expect(object).toHaveProperty('key');
expect(object).toMatchObject({ key: 'value' });

// Functions
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledTimes(2);
expect(fn).toHaveBeenCalledWith(arg1, arg2);
expect(fn).toHaveBeenNthCalledWith(1, arg);

// Promises
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow(error);
```

---

**Happy Testing! 🧪**
