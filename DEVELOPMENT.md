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
├── lib/
│   └── env.ts                # Environment configuration
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
