# End-to-End Tests

Comprehensive E2E testing suite for the SvelteKit + Hono application using [Playwright](https://playwright.dev/) with Page Object Model pattern and custom fixtures.

## 📊 Test Coverage

- **903 tests** across **3 browsers** (Chromium, Firefox, WebKit)
- **301 tests per browser**
- **4 test files** with comprehensive coverage

### Test Breakdown

| Test Suite            | Tests | Description                                                      |
| --------------------- | ----- | ---------------------------------------------------------------- |
| **Homepage**          | 18    | Page structure, API integration, responsive design, performance  |
| **User Management**   | 33    | CRUD operations, forms, validation, state management, concurrent |
| **API Endpoints**     | 71    | Health, Hello, Users API with full validation and error cases    |
| **Navigation**        | 179   | Internal/external nav, history, 404s, scroll, accessibility      |
| **Total per browser** | 301   | **Total across 3 browsers: 903 tests**                           |

## 🏗️ Architecture

### Page Object Model (POM)

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

### Custom Fixtures

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

## 🚀 Running Tests

### Quick Start

```bash
# Run all tests (headless)
pnpm run test:e2e

# Interactive UI mode (RECOMMENDED for development)
pnpm run test:e2e:ui

# Run with visible browser
pnpm run test:e2e:headed

# Debug mode
pnpm run test:e2e:debug
```

### Browser-Specific Tests

```bash
pnpm run test:e2e:chromium   # Chrome/Edge
pnpm run test:e2e:firefox    # Firefox
pnpm run test:e2e:webkit     # Safari
```

### Run Specific Tests

```bash
# Run single file
pnpm exec playwright test homepage.spec.ts

# Run specific test by name
pnpm exec playwright test -g "should create a new user"

# Run tests matching pattern
pnpm exec playwright test user-management
```

### View Reports

```bash
# Open HTML report
pnpm run test:e2e:report

# Show last trace
pnpm exec playwright show-trace trace.zip
```

## 📝 Writing Tests

### Using Page Object Model

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

### Using API Helpers

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

### Test Organization

Tests are organized with `describe` blocks for better structure:

```typescript
test.describe('Feature Name', () => {
	test.describe('Sub-feature', () => {
		test('specific test case', async ({ homePage }) => {
			// Test implementation
		});
	});
});
```

## 🎯 Best Practices

### ✅ DO

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

### ❌ DON'T

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

## 📚 API Reference

### HomePage Page Object

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

### API Helpers

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

## 🐛 Debugging

### UI Mode (Best for Development)

```bash
pnpm run test:e2e:ui
```

Features:

- Time-travel debugging
- View DOM snapshots
- Inspect network calls
- Edit and re-run tests
- Step through execution

### Debug Mode

```bash
pnpm run test:e2e:debug
```

Opens Playwright Inspector with step-by-step debugging.

### Manual Debugging

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

### Trace Viewer

If tests fail in CI, download artifacts and view trace:

```bash
pnpm exec playwright show-trace trace.zip
```

## 🧪 Test Patterns

### Form Testing

```typescript
test('should submit form', async ({ homePage, api }) => {
	const userData = api.generateTestUser();

	await homePage.fillUserForm(userData.name, userData.email);
	await homePage.submitUserForm();

	await homePage.expectUserToBeVisible(userData.name, userData.email);
	await homePage.expectFormToBeEmpty();
});
```

### API Testing

```typescript
test('should create user via API', async ({ api, request }) => {
	const userData = api.generateTestUser();

	const response = await request.post('/api/users', {
		data: userData
	});

	expect(response.status()).toBe(200);
	const user = await response.json();
	expect(user).toHaveProperty('id');

	// Cleanup automatic via fixture
});
```

### Error Handling

```typescript
test('should handle validation errors', async ({ api }) => {
	await api.expectValidationError('', 'invalid-email');
});
```

### Concurrent Operations

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

### Responsive Testing

```typescript
test('should be responsive', async ({ homePage }) => {
	await homePage.page.setViewportSize({ width: 375, height: 667 });
	await homePage.goto();

	await expect(homePage.heading).toBeVisible();
});
```

## 🔧 Configuration

Configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:5173`
- **Test Directory**: `./tests/e2e`
- **Browsers**: Chromium, Firefox, WebKit
- **Retries**: 2 on CI, 0 locally
- **Auto-start dev server**: Yes
- **Parallel execution**: Enabled

## 📊 CI/CD Integration

Tests run automatically on GitHub Actions:

- ✅ On push to main/master/develop
- ✅ On pull requests
- ✅ Uploads test reports as artifacts
- ✅ Uploads screenshots/traces on failure

See `.github/workflows/playwright.yml`

## 🆘 Troubleshooting

### Tests are flaky

```typescript
// Increase timeout for slow operations
await expect(element).toBeVisible({ timeout: 10000 });

// Wait for network to settle
await page.waitForLoadState('networkidle');
```

### Element not found

```typescript
// Use page object methods
await homePage.expectUserToBeVisible(name, email);

// Or use proper waits
await expect(page.getByText('Submit')).toBeVisible();
```

### Port already in use

```bash
# Kill process on port 5173 (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or change port in playwright.config.ts
```

### Tests pass locally but fail in CI

- Check for timing issues
- Verify CI environment variables
- Review uploaded artifacts and traces
- Consider increasing retries

## 📖 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model Guide](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [Complete E2E Testing Guide](../../docs/E2E_TESTING.md)

## 🎉 Summary

The E2E test suite provides:

- ✅ **903 comprehensive tests** across 3 browsers
- ✅ **Page Object Model** for maintainability
- ✅ **Custom fixtures** with auto-cleanup
- ✅ **Type-safe** with full TypeScript support
- ✅ **Organized** with describe blocks
- ✅ **Best practices** built-in
- ✅ **CI/CD ready** with GitHub Actions

Happy testing! 🚀
